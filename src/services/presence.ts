/**
 * Roomora Realtime Presence Service
 * Tracks online status across active users using Supabase Realtime Presence.
 */
import { useEffect, useState } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { useAuthStore } from '../store/useAuthStore';
import type { RealtimeChannel } from '@supabase/supabase-js';

// Global shared state for active online user IDs
const activeOnlineUsers = new Set<string>();
const listeners = new Set<(onlineSet: Set<string>) => void>();

function notifyListeners() {
  const snapshot = new Set(activeOnlineUsers);
  listeners.forEach(cb => cb(snapshot));
}

let globalPresenceChannel: RealtimeChannel | null = null;

export function initGlobalPresence(userId: string) {
  if (!isSupabaseConfigured || !userId) return;

  if (globalPresenceChannel) {
    return;
  }

  const channel = supabase.channel('roomora_global_presence', {
    config: {
      presence: { key: userId }
    }
  });

  globalPresenceChannel = channel;

  const updatePresence = () => {
    const state = channel.presenceState();
    activeOnlineUsers.clear();
    
    // Add presence keys and any payload user_ids
    Object.keys(state).forEach(key => {
      activeOnlineUsers.add(key);
      const presences = state[key] as Array<{ user_id?: string }>;
      if (Array.isArray(presences)) {
        presences.forEach(p => {
          if (p.user_id) activeOnlineUsers.add(p.user_id);
        });
      }
    });

    notifyListeners();
  };

  channel
    .on('presence', { event: 'sync' }, updatePresence)
    .on('presence', { event: 'join' }, updatePresence)
    .on('presence', { event: 'leave' }, updatePresence)
    .subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        await channel.track({
          user_id: userId,
          online_at: new Date().toISOString()
        });
      }
    });
}

export function cleanupGlobalPresence() {
  if (globalPresenceChannel) {
    globalPresenceChannel.untrack().catch(() => {});
    supabase.removeChannel(globalPresenceChannel).catch(() => {});
    globalPresenceChannel = null;
    activeOnlineUsers.clear();
    notifyListeners();
  }
}

/**
 * Hook to check if a specific user is currently online.
 */
export function useIsUserOnline(targetUserId: string | null | undefined): boolean {
  const [isOnline, setIsOnline] = useState<boolean>(() => {
    if (!targetUserId) return false;
    return activeOnlineUsers.has(targetUserId);
  });

  useEffect(() => {
    if (!targetUserId) {
      setIsOnline(false);
      return;
    }

    const handleChange = (currentOnlineSet: Set<string>) => {
      setIsOnline(currentOnlineSet.has(targetUserId));
    };

    // Initial check
    setIsOnline(activeOnlineUsers.has(targetUserId));

    listeners.add(handleChange);
    return () => {
      listeners.delete(handleChange);
    };
  }, [targetUserId]);

  return isOnline;
}
