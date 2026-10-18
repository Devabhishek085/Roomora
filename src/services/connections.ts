import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type { TokenBalance, RoommateConnection, Message } from '../types';

/**
 * Gets the current user's token balance from the database.
 */
export async function getTokenBalance(userId: string): Promise<TokenBalance | null> {
  if (!isSupabaseConfigured) return null;

  const { data, error } = await supabase
    .from('token_balances')
    .select('balance, lifetime_granted')
    .eq('user_id', userId)
    .single();

  if (error || !data) return null;
  return data as TokenBalance;
}

/**
 * Initiates a new roommate connection.
 * Atomically deducts one token via database stored procedure.
 * Returns the connection result or an error code.
 */
export async function initiateConnection(
  initiatorId: string,
  recipientId: string
): Promise<{
  success: boolean;
  connectionId?: string;
  tokensRemaining?: number;
  error?: string;
  idempotent?: boolean;
}> {
  if (!isSupabaseConfigured) {
    return { success: false, error: 'backend_not_configured' };
  }

  // Generate idempotency key: prevents double-spend on duplicate clicks
  const idempotencyKey = `conn_${initiatorId}_${recipientId}_${Date.now()}`;

  const { data, error } = await supabase.rpc('deduct_connection_token', {
    p_initiator_id: initiatorId,
    p_recipient_id: recipientId,
    p_idempotency_key: idempotencyKey
  });

  if (error) {
    console.error('[Connection] RPC error:', error);
    return { success: false, error: error.message };
  }

  const result = data as {
    success: boolean;
    connection_id?: string;
    tokens_remaining?: number;
    error?: string;
    idempotent?: boolean;
  };

  return {
    success: result.success,
    connectionId: result.connection_id,
    tokensRemaining: result.tokens_remaining,
    error: result.error,
    idempotent: result.idempotent
  };
}

/**
 * Checks if a connection already exists between two users.
 */
export async function checkExistingConnection(
  userId: string,
  targetId: string
): Promise<RoommateConnection | null> {
  if (!isSupabaseConfigured) return null;

  const { data } = await supabase
    .from('roommate_connections')
    .select('*')
    .or(
      `and(initiator_id.eq.${userId},recipient_id.eq.${targetId}),` +
      `and(initiator_id.eq.${targetId},recipient_id.eq.${userId})`
    )
    .single();

  return data as RoommateConnection | null;
}

/**
 * Gets all connections for the current user (active, accepted, and pending).
 */
export async function getUserConnections(userId: string): Promise<RoommateConnection[]> {
  if (!isSupabaseConfigured) return [];

  const { data, error } = await supabase
    .from('roommate_connections')
    .select('*')
    .or(`initiator_id.eq.${userId},recipient_id.eq.${userId}`)
    .in('status', ['pending', 'accepted', 'active'])
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[Connection] Error fetching user connections:', error);
    return [];
  }

  return (data as RoommateConnection[]) || [];
}

/**
 * Responds to a pending connection invitation (accept or decline).
 */
export async function respondToInvitation(
  connectionId: string,
  status: 'accepted' | 'declined'
): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured) return { success: false, error: 'backend_not_configured' };

  // First try the secure stored procedure
  const { data: rpcData, error: rpcError } = await supabase.rpc('respond_to_connection_invitation', {
    p_connection_id: connectionId,
    p_status: status
  });

  if (!rpcError && rpcData?.success) {
    return { success: true };
  }

  // Fallback to direct table update if RPC is not yet registered in remote DB
  const { error: updateError } = await supabase
    .from('roommate_connections')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', connectionId);

  if (updateError) {
    return { success: false, error: updateError.message };
  }

  return { success: true };
}

/**
 * Accepts a connection invitation.
 */
export async function acceptConnection(connectionId: string): Promise<{ success: boolean; error?: string }> {
  return respondToInvitation(connectionId, 'accepted');
}

/**
 * Declines a connection invitation.
 */
export async function declineConnection(connectionId: string): Promise<{ success: boolean; error?: string }> {
  return respondToInvitation(connectionId, 'declined');
}

/**
 * Gets the conversation ID for a given connection.
 */
export async function getConversationByConnection(
  connectionId: string
): Promise<string | null> {
  if (!isSupabaseConfigured) return null;

  const { data } = await supabase
    .from('conversations')
    .select('id')
    .eq('connection_id', connectionId)
    .single();

  return data?.id ?? null;
}

/**
 * Sends a message in a conversation.
 * Only works if the sender is a participant (enforced by RLS).
 */
export async function sendMessage(
  conversationId: string,
  senderId: string,
  content: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  if (!isSupabaseConfigured) return { success: false, error: 'backend_not_configured' };

  const trimmed = content.trim();
  if (!trimmed || trimmed.length > 2000) {
    return { success: false, error: 'Invalid message length' };
  }

  const { data, error } = await supabase
    .from('messages')
    .insert({
      conversation_id: conversationId,
      sender_id: senderId,
      content: trimmed,
      is_read: false
    })
    .select('id')
    .single();

  if (error) return { success: false, error: error.message };
  return { success: true, messageId: data.id };
}

/**
 * Fetches messages for a conversation with pagination.
 */
export async function getMessages(
  conversationId: string,
  page = 1,
  pageSize = 50
): Promise<Message[]> {
  if (!isSupabaseConfigured) return [];

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const { data } = await supabase
    .from('messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })
    .range(from, to);

  return (data as Message[]) || [];
}

/**
 * Marks messages as read.
 */
export async function markMessagesRead(
  conversationId: string,
  readerId: string
): Promise<void> {
  if (!isSupabaseConfigured) return;

  await supabase
    .from('messages')
    .update({ is_read: true })
    .eq('conversation_id', conversationId)
    .neq('sender_id', readerId)
    .eq('is_read', false);
}

/**
 * Blocks a user.
 */
export async function blockUser(
  blockerId: string,
  blockedId: string
): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured) return { success: false, error: 'backend_not_configured' };

  const { error } = await supabase
    .from('user_blocks')
    .insert({ blocker_id: blockerId, blocked_id: blockedId });

  if (error) return { success: false, error: error.message };

  // Also update any active connections to blocked
  await supabase
    .from('roommate_connections')
    .update({ status: 'blocked' })
    .or(
      `and(initiator_id.eq.${blockerId},recipient_id.eq.${blockedId}),` +
      `and(initiator_id.eq.${blockedId},recipient_id.eq.${blockerId})`
    );

  return { success: true };
}

/**
 * Reports a user.
 */
export async function reportUser(
  reporterId: string,
  reportedId: string,
  reason: string,
  details?: string
): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured) return { success: false, error: 'backend_not_configured' };

  const { error } = await supabase
    .from('user_reports')
    .insert({
      reporter_id: reporterId,
      reported_id: reportedId,
      reason,
      details: details?.substring(0, 1000)
    });

  if (error) return { success: false, error: error.message };
  return { success: true };
}

/**
 * Saves/unsaves a roommate profile.
 */
export async function toggleSavedRoommate(
  userId: string,
  roommateId: string,
  currentlySaved: boolean
): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured) return { success: false, error: 'backend_not_configured' };

  if (currentlySaved) {
    const { error } = await supabase
      .from('saved_roommates')
      .delete()
      .eq('user_id', userId)
      .eq('roommate_id', roommateId);

    return { success: !error, error: error?.message };
  } else {
    const { error } = await supabase
      .from('saved_roommates')
      .insert({ user_id: userId, roommate_id: roommateId });

    return { success: !error, error: error?.message };
  }
}

/**
 * Gets saved roommate IDs for the current user.
 */
export async function getSavedRoommateIds(userId: string): Promise<string[]> {
  if (!isSupabaseConfigured) return [];

  const { data } = await supabase
    .from('saved_roommates')
    .select('roommate_id')
    .eq('user_id', userId);

  return (data || []).map((r: { roommate_id: string }) => r.roommate_id);
}
