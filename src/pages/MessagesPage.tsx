import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  ArrowLeft,
  Send,
  MessageSquare,
  Users,
  AlertCircle,
  Flag,
  Ban,
  Check,
  CheckCheck,
  ShieldCheck,
  Clock,
  Sparkles
} from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import {
  getMessages,
  sendMessage,
  markMessagesRead,
  blockUser,
  reportUser,
  acceptConnection
} from '../services/connections';
import { fetchProfileById } from '../services/profiles';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { useIsUserOnline } from '../services/presence';
import type { RealtimeChannel } from '@supabase/supabase-js';
import type { Message, DbProfile, RoommateConnection } from '../types';

export const MessagesPage: React.FC = () => {
  const { conversationId } = useParams<{ conversationId: string }>();
  const { user } = useAuthStore();
  const [messages, setMessages] = useState<Message[]>([]);
  const [otherUser, setOtherUser] = useState<DbProfile | null>(null);
  const [connection, setConnection] = useState<RoommateConnection | null>(null);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [isAccepting, setIsAccepting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showActions, setShowActions] = useState(false);
  const [inChatOnline, setInChatOnline] = useState(false);
  const isGlobalOnline = useIsUserOnline(otherUser?.id);
  const isOtherUserOnline = inChatOnline || isGlobalOnline;
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const isNearBottomRef = useRef(true);
  const channelRef = useRef<RealtimeChannel | null>(null);

  const handleScroll = () => {
    const el = messagesContainerRef.current;
    if (!el) return;
    const threshold = 100;
    isNearBottomRef.current = el.scrollHeight - el.scrollTop - el.clientHeight <= threshold;
  };

  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
    requestAnimationFrame(() => {
      const el = messagesContainerRef.current;
      if (!el) return;
      el.scrollTo({
        top: el.scrollHeight,
        behavior
      });
    });
  }, []);

  const loadMessages = useCallback(async () => {
    if (!conversationId || !user) return;
    const msgs = await getMessages(conversationId);
    setMessages(msgs);
    await markMessagesRead(conversationId, user.id);
    scrollToBottom('auto');
  }, [conversationId, user, scrollToBottom]);

  // Load conversation info, participants, and connection status
  useEffect(() => {
    if (!conversationId || !user || !isSupabaseConfigured) {
      setIsLoading(false);
      return;
    }

    const init = async () => {
      setIsLoading(true);

      // Get connection from conversation
      const { data: convo } = await supabase
        .from('conversations')
        .select('*, connection:roommate_connections(*)')
        .eq('id', conversationId)
        .single();

      if (convo?.connection) {
        const conn = convo.connection as RoommateConnection;
        setConnection(conn);

        const otherId = conn.initiator_id === user.id
          ? conn.recipient_id
          : conn.initiator_id;
        const profile = await fetchProfileById(otherId);
        setOtherUser(profile);
      }

      await loadMessages();
      setIsLoading(false);
    };

    init();
  }, [conversationId, user, loadMessages]);

  // Realtime subscription for instant peer messaging, DB replication & auto-sync
  useEffect(() => {
    if (!conversationId || !isSupabaseConfigured) return;

    // Create a bidirectional broadcast & presence channel
    const channel = supabase.channel(`chat_room_${conversationId}`, {
      config: {
        broadcast: { ack: false, self: false },
        presence: { key: user?.id || 'anon' }
      }
    });

    channelRef.current = channel;

    const checkPresence = () => {
      if (!otherUser?.id) return;
      const state = channel.presenceState();
      const isPresent =
        Boolean(state[otherUser.id]?.length) ||
        Object.values(state).some(pList => (pList as any[]).some(p => p.user_id === otherUser.id));
      setInChatOnline(isPresent);
    };

    channel
      // Presence tracking for live online green dot
      .on('presence', { event: 'sync' }, checkPresence)
      .on('presence', { event: 'join' }, checkPresence)
      .on('presence', { event: 'leave' }, checkPresence)
      // 1. Instant Peer Broadcast (sub-50ms live chat across active tabs)
      .on('broadcast', { event: 'chat_message' }, async ({ payload }) => {
        const incoming = payload as Message;
        setMessages(prev => {
          // Prevent duplicates
          if (
            prev.some(
              m =>
                m.id === incoming.id ||
                (m.sender_id === incoming.sender_id &&
                  m.content === incoming.content &&
                  Math.abs(new Date(m.created_at).getTime() - new Date(incoming.created_at).getTime()) < 5000)
            )
          ) {
            return prev;
          }
          return [...prev, incoming];
        });

        // Mark as read and broadcast read receipt back to sender
        if (incoming.sender_id !== user?.id) {
          await markMessagesRead(conversationId, user!.id);
          channel.send({
            type: 'broadcast',
            event: 'read_receipt',
            payload: { conversationId, readerId: user!.id }
          }).catch(() => {});
        }
        scrollToBottom('smooth');
      })
      // 2. Instant Read Receipt Broadcast (ticks turn cyan in real-time)
      .on('broadcast', { event: 'read_receipt' }, () => {
        setMessages(prev => prev.map(m => ({ ...m, is_read: true })));
      })
      // 3. Postgres Database Replication (authoritative persistence)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`
        },
        async (payload) => {
          const newMsg = payload.new as Message;
          setMessages(prev => {
            // Reconcile optimistic temp message with database message
            const tempIndex = prev.findIndex(
              m => m.id.startsWith('temp-') && m.sender_id === newMsg.sender_id && m.content === newMsg.content
            );
            if (tempIndex !== -1) {
              const updated = [...prev];
              updated[tempIndex] = newMsg;
              return updated;
            }
            if (prev.some(m => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });

          if (newMsg.sender_id !== user?.id) {
            await markMessagesRead(conversationId, user!.id);
          }
          scrollToBottom('smooth');
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`
        },
        (payload) => {
          const updatedMsg = payload.new as Message;
          setMessages(prev =>
            prev.map(m => (m.id === updatedMsg.id ? updatedMsg : m))
          );
        }
      )
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          console.log(`[Realtime] Connected to chat room ${conversationId}`);
          if (user?.id) {
            await channel.track({
              user_id: user.id,
              online_at: new Date().toISOString()
            });
          }
        }
      });

    // 4. Lightweight background sync every 2.5 seconds (prevents need for manual page refresh)
    const syncInterval = setInterval(async () => {
      if (document.visibilityState === 'visible') {
        const fresh = await getMessages(conversationId);
        setMessages(prev => {
          const tempMsgs = prev.filter(m => m.id.startsWith('temp-'));
          if (tempMsgs.length === 0) {
            // Only update state if message count or read status actually changed
            const hasChanged =
              prev.length !== fresh.length ||
              prev.some((p, idx) => p.id !== fresh[idx]?.id || p.is_read !== fresh[idx]?.is_read);
            return hasChanged ? fresh : prev;
          }
          const tempContents = new Set(tempMsgs.map(t => t.content));
          const confirmed = fresh.filter(f => !tempContents.has(f.content));
          return [...confirmed, ...tempMsgs];
        });
      }
    }, 2500);

    // 5. Instantly refresh when user tabs back into the window
    const handleFocus = () => {
      loadMessages();
    };
    window.addEventListener('focus', handleFocus);

    return () => {
      clearInterval(syncInterval);
      window.removeEventListener('focus', handleFocus);
      channel.untrack().catch(() => {});
      channelRef.current = null;
      supabase.removeChannel(channel);
    };
  }, [conversationId, user, otherUser?.id, loadMessages]);

  // Re-check presence when otherUser is loaded
  useEffect(() => {
    if (channelRef.current && otherUser?.id) {
      const state = channelRef.current.presenceState();
      const isPresent =
        Boolean(state[otherUser.id]?.length) ||
        Object.values(state).some(pList => (pList as any[]).some(p => p.user_id === otherUser.id));
      setInChatOnline(isPresent);
    }
  }, [otherUser?.id]);

  const handleSend = async () => {
    if (!inputText.trim() || !conversationId || !user || isSending) return;

    // Guard if connection is not yet accepted
    if (connection && connection.status === 'pending') {
      setError('You cannot send messages until the connection invitation is accepted.');
      return;
    }

    const text = inputText.trim();
    const tempId = `temp-${Date.now()}`;
    const optimisticMsg: Message = {
      id: tempId,
      conversation_id: conversationId,
      sender_id: user.id,
      content: text,
      is_read: false,
      created_at: new Date().toISOString()
    };

    // ⚡ ZERO-LATENCY INSTANT LOCAL SHOW (0ms)
    setMessages(prev => [...prev, optimisticMsg]);
    setInputText('');
    scrollToBottom('smooth');

    // ⚡ FAST SUB-50ms WEBSOCKET BROADCAST TO RECIPIENT
    if (channelRef.current) {
      channelRef.current
        .send({
          type: 'broadcast',
          event: 'chat_message',
          payload: optimisticMsg
        })
        .catch(err => console.warn('[Realtime] Broadcast send warning:', err));
    }

    // Persist to database in background
    setIsSending(true);
    const result = await sendMessage(conversationId, user.id, text);
    if (!result.success) {
      setError(result.error || 'Failed to send message');
      // Rollback optimistic message and restore text on failure
      setMessages(prev => prev.filter(m => m.id !== tempId));
      setInputText(text);
    } else if (result.messageId) {
      // Reconcile with official database ID
      setMessages(prev =>
        prev.map(m => (m.id === tempId ? { ...m, id: result.messageId! } : m))
      );
    }
    setIsSending(false);
  };

  const handleAcceptInvite = async () => {
    if (!connection) return;
    setIsAccepting(true);
    const result = await acceptConnection(connection.id);
    if (result.success) {
      setConnection(prev => prev ? { ...prev, status: 'accepted' } : null);
      setError(null);
    } else {
      setError(result.error || 'Failed to accept invitation');
    }
    setIsAccepting(false);
  };

  const handleBlock = async () => {
    if (!user || !otherUser) return;
    if (!confirm(`Block ${otherUser.display_name}? They will no longer be able to message you.`)) return;
    const result = await blockUser(user.id, otherUser.id);
    if (result.success) {
      alert('User blocked successfully.');
      setShowActions(false);
    }
  };

  const handleReport = async () => {
    if (!user || !otherUser) return;
    const reason = prompt('Reason for report:\n1. spam\n2. harassment\n3. fake_profile\n4. inappropriate_content\n5. other\n\nEnter reason:');
    if (!reason) return;
    const details = prompt('Additional details (optional):');
    await reportUser(user.id, otherUser.id, reason, details || undefined);
    alert('Report submitted. Thank you for keeping Roomora safe.');
    setShowActions(false);
  };

  const isPending = connection?.status === 'pending';
  const isRecipient = connection?.recipient_id === user?.id;

  if (!isSupabaseConfigured) {
    return (
      <div className="min-h-screen bg-[#FAF8F5] dark:bg-[#0A0D14] flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <MessageSquare className="w-12 h-12 text-slate-400 mx-auto mb-4" />
          <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Messaging Requires Backend</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Configure Supabase credentials in <code>.env.local</code> to enable real-time messaging.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100dvh-4.25rem)] max-h-[calc(100dvh-4.25rem)] bg-[#FAF8F5] dark:bg-[#0A0D14] p-2 sm:p-4 md:p-5 flex flex-col justify-center overflow-hidden">
      {/* Framed Chat Window Card */}
      <div className="max-w-4xl w-full mx-auto h-full flex-1 min-h-0 flex flex-col rounded-2xl sm:rounded-3xl border-2 border-slate-200/90 dark:border-slate-800 shadow-2xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl overflow-hidden transition-all">
        
        {/* Chat Window Header */}
        <div className="shrink-0 px-4 sm:px-6 py-3.5 bg-white/95 dark:bg-slate-900/95 border-b border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <Link
              to="/connections"
              className="p-2 -ml-1 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
              title="Back to Connections"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>

            {otherUser ? (
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-tr from-teal-500 to-emerald-400 flex items-center justify-center text-white font-extrabold text-base shadow-sm ring-2 ring-white dark:ring-slate-800">
                    {otherUser.display_name?.[0] || '?'}
                  </div>
                  {/* Green dot ONLY when user is online */}
                  {isOtherUserOnline && (
                    <span
                      className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-white dark:border-slate-900 rounded-full shadow-sm animate-in fade-in duration-200"
                      title="Online"
                    />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white leading-tight">
                      {otherUser.display_name}
                    </h2>
                    {otherUser && !otherUser.is_demo && (
                      <span className="hidden sm:inline-flex items-center gap-0.5 text-[10px] text-teal-600 dark:text-teal-400 font-bold bg-teal-50 dark:bg-teal-950/50 px-2 py-0.5 rounded-full border border-teal-200/50 dark:border-teal-800/50">
                        <ShieldCheck className="w-2.5 h-2.5" />
                        Verified
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                    {isOtherUserOnline && (
                      <>
                        <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-pulse" />
                          Online
                        </span>
                        <span>•</span>
                      </>
                    )}
                    <span>{otherUser.occupation || 'Roommate'}</span>
                    {otherUser.city ? <span>• {otherUser.city}</span> : ''}
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-teal-500" />
                <span className="font-bold text-sm text-slate-900 dark:text-white">Roommate Chat</span>
              </div>
            )}
          </div>

          {/* Header Right Actions */}
          <div className="flex items-center gap-2">
            {isPending && (
              <span className="hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 text-[11px] font-bold text-amber-700 dark:text-amber-300">
                <Clock className="w-3 h-3" />
                Invitation Pending
              </span>
            )}

            <div className="relative">
              <button
                onClick={() => setShowActions(s => !s)}
                className="w-9 h-9 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 flex items-center justify-center font-bold text-lg transition-colors"
                aria-label="More actions"
              >
                ⋮
              </button>
              {showActions && (
                <div className="absolute right-0 top-11 z-50 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl py-2 min-w-[160px] animate-in fade-in zoom-in-95 duration-100">
                  <button
                    onClick={handleReport}
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                  >
                    <Flag className="w-3.5 h-3.5 text-amber-500" />
                    Report User
                  </button>
                  <button
                    onClick={handleBlock}
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                  >
                    <Ban className="w-3.5 h-3.5" />
                    Block User
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Pending Invitation Notification Banner */}
        {isPending && (
          <div className="shrink-0 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-teal-500/10 border-b border-amber-200/80 dark:border-amber-800/60 p-3 sm:px-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 text-xs text-slate-800 dark:text-slate-200">
                <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                {isRecipient ? (
                  <span>
                    <strong>{otherUser?.display_name || 'This user'}</strong> sent you a connection invitation. Accept to unlock chat.
                  </span>
                ) : (
                  <span>
                    Waiting for <strong>{otherUser?.display_name || 'recipient'}</strong> to accept your connection invitation before messages can be exchanged.
                  </span>
                )}
              </div>

              {isRecipient && (
                <button
                  onClick={handleAcceptInvite}
                  disabled={isAccepting}
                  className="px-4 py-1.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 text-xs font-black transition-all shadow-sm active:scale-95 disabled:opacity-50 shrink-0"
                >
                  {isAccepting ? 'Accepting...' : 'Accept Invitation'}
                </button>
              )}
            </div>
          </div>
        )}

        {/* Messages Body Area */}
        <div
          ref={messagesContainerRef}
          data-lenis-prevent="true"
          onScroll={handleScroll}
          className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-4 sm:p-6 space-y-3.5 bg-gradient-to-b from-slate-50/70 to-slate-100/50 dark:from-slate-950/70 dark:to-slate-900/60"
        >
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-full py-20 space-y-3">
              <div className="animate-spin w-8 h-8 border-2 border-teal-500/30 border-t-teal-500 rounded-full" />
              <p className="text-xs text-slate-400">Loading conversation...</p>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-12 px-4">
              <div className="w-16 h-16 rounded-3xl bg-teal-50 dark:bg-teal-950/50 border border-teal-200/60 dark:border-teal-800/60 flex items-center justify-center mb-4 text-teal-600 dark:text-teal-400 shadow-sm">
                <Sparkles className="w-8 h-8" />
              </div>
              <h3 className="font-extrabold text-slate-800 dark:text-slate-200 text-base mb-1">
                Say hello to {otherUser?.display_name || 'your roommate'}!
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs">
                Ask about rent sharing, locality preferences, flat amenities, or coordinate a virtual meet.
              </p>
            </div>
          ) : (
            messages.map((msg) => {
              const isOwn = msg.sender_id === user?.id;
              const timeString = new Date(msg.created_at).toLocaleTimeString('en-IN', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
              });

              const isTemp = msg.id.startsWith('temp-');

              return (
                <div
                  key={msg.id}
                  className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`group relative max-w-[85%] sm:max-w-[70%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed transition-all shadow-sm ${
                      isOwn
                        ? 'bg-gradient-to-br from-teal-500 to-teal-600 text-slate-950 rounded-tr-sm font-medium'
                        : 'bg-white dark:bg-slate-800 border border-slate-200/90 dark:border-slate-700/80 text-slate-900 dark:text-white rounded-tl-sm'
                    }`}
                  >
                    <p className="whitespace-pre-wrap break-words">{msg.content}</p>

                    {/* Metadata & Status Ticks */}
                    <div
                      className={`flex items-center justify-end gap-1.5 text-[10px] mt-1 select-none ${
                        isOwn ? 'text-slate-950/70' : 'text-slate-400 dark:text-slate-500'
                      }`}
                    >
                      <span>{timeString}</span>

                      {isOwn && (
                        <span
                          className="flex items-center ml-0.5"
                          title={msg.is_read ? 'Read' : isTemp ? 'Sending...' : 'Delivered'}
                        >
                          {msg.is_read ? (
                            /* Double cyan tick for Read */
                            <CheckCheck className="w-3.5 h-3.5 text-cyan-900 dark:text-cyan-300 font-extrabold" />
                          ) : isTemp ? (
                            /* Single tick for in-flight / sending */
                            <Check className="w-3.5 h-3.5 text-slate-950/50 animate-pulse" />
                          ) : (
                            /* Double grey tick for delivered */
                            <CheckCheck className="w-3.5 h-3.5 text-slate-950/70" />
                          )}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Error Alert inside chat window */}
        {error && (
          <div className="shrink-0 px-4 py-2 bg-rose-50 dark:bg-rose-950/50 border-t border-rose-200 dark:border-rose-800 flex items-center justify-between text-xs text-rose-700 dark:text-rose-300">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
            <button onClick={() => setError(null)} className="font-bold hover:underline">
              Dismiss
            </button>
          </div>
        )}

        {/* UI Under Chat Window: Stylized Composer Dock */}
        <div className="shrink-0 p-3 sm:p-4 bg-slate-100/95 dark:bg-slate-900/95 border-t-2 border-slate-200/90 dark:border-slate-800/90 backdrop-blur-md">
          <div className="relative flex items-end gap-2.5 bg-white dark:bg-slate-800/90 rounded-2xl border border-slate-300/80 dark:border-slate-700/80 shadow-sm focus-within:ring-2 focus-within:ring-teal-500/50 focus-within:border-teal-500 p-2 transition-all">
            <textarea
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              disabled={isPending}
              placeholder={
                isPending
                  ? '🔒 Chat is locked until connection invitation is accepted'
                  : 'Type a message... (Press Enter to send)'
              }
              rows={1}
              maxLength={2000}
              className="flex-1 resize-none bg-transparent px-2 py-1 text-slate-900 dark:text-white placeholder:text-slate-400 text-sm outline-none max-h-32 disabled:opacity-50 disabled:cursor-not-allowed"
              id="message-input"
            />

            <button
              onClick={handleSend}
              disabled={!inputText.trim() || isSending || isPending}
              className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-xl bg-gradient-to-tr from-teal-500 to-emerald-400 hover:from-teal-400 hover:to-emerald-300 disabled:opacity-40 disabled:cursor-not-allowed text-slate-950 font-bold transition-all shadow-md shadow-teal-500/20 active:scale-95"
              aria-label="Send message"
              id="send-message-btn"
            >
              {isSending ? (
                <span className="animate-spin w-4 h-4 border-2 border-slate-950/30 border-t-slate-950 rounded-full" />
              ) : (
                <Send className="w-4 h-4 -ml-0.5" />
              )}
            </button>
          </div>

          <div className="flex items-center justify-between text-[10px] text-slate-400 mt-2 px-1">
            <span className="flex items-center gap-1">
              <CheckCheck className="w-3 h-3 text-cyan-600 dark:text-cyan-400" />
            </span>
            <span>{inputText.length}/2000</span>
          </div>
        </div>
      </div>
    </div>
  );
};
