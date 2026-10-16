import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ArrowLeft, Send, MessageSquare, Users, AlertCircle, Flag, Ban } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import {
  getMessages,
  sendMessage,
  markMessagesRead,
  blockUser,
  reportUser
} from '../services/connections';
import { fetchProfileById } from '../services/profiles';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type { Message, DbProfile } from '../types';

export const MessagesPage: React.FC = () => {
  const { conversationId } = useParams<{ conversationId: string }>();
  const { user } = useAuthStore();
  const [messages, setMessages] = useState<Message[]>([]);
  const [otherUser, setOtherUser] = useState<DbProfile | null>(null);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showActions, setShowActions] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadMessages = useCallback(async () => {
    if (!conversationId || !user) return;
    const msgs = await getMessages(conversationId);
    setMessages(msgs);
    await markMessagesRead(conversationId, user.id);
    scrollToBottom();
  }, [conversationId, user]);

  // Load conversation info and participants
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
        const otherId = convo.connection.initiator_id === user.id
          ? convo.connection.recipient_id
          : convo.connection.initiator_id;
        const profile = await fetchProfileById(otherId);
        setOtherUser(profile);
      }

      await loadMessages();
      setIsLoading(false);
    };

    init();
  }, [conversationId, user, loadMessages]);

  // Realtime subscription for new messages
  useEffect(() => {
    if (!conversationId || !isSupabaseConfigured) return;

    const channel = supabase
      .channel(`messages:${conversationId}`)
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
            if (prev.some(m => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });
          if (newMsg.sender_id !== user?.id) {
            await markMessagesRead(conversationId, user!.id);
          }
          scrollToBottom();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, user]);

  const handleSend = async () => {
    if (!inputText.trim() || !conversationId || !user || isSending) return;

    setIsSending(true);
    const text = inputText.trim();
    setInputText('');

    const result = await sendMessage(conversationId, user.id, text);
    if (!result.success) {
      setError(result.error || 'Failed to send message');
      setInputText(text); // restore
    }
    setIsSending(false);
  };

  const handleBlock = async () => {
    if (!user || !otherUser) return;
    if (!confirm(`Block ${otherUser.display_name}? They will no longer be able to see your profile.`)) return;
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
    <div className="min-h-screen bg-[#FAF8F5] dark:bg-[#0A0D14] flex flex-col">
      {/* Header */}
      <div className="sticky top-20 z-10 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              to="/connections"
              className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-slate-600 dark:text-slate-300" />
            </Link>
            {otherUser ? (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-500 to-emerald-400 flex items-center justify-center text-white font-bold text-sm shadow-sm">
                  {otherUser.display_name?.[0] || '?'}
                </div>
                <div>
                  <h2 className="font-bold text-sm text-slate-900 dark:text-white">
                    {otherUser.display_name}
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {otherUser.city || 'Roommate match'}
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-teal-500" />
                <span className="font-bold text-sm text-slate-900 dark:text-white">Conversation</span>
              </div>
            )}
          </div>

          {/* More actions */}
          <div className="relative">
            <button
              onClick={() => setShowActions(s => !s)}
              className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 text-lg font-bold"
              aria-label="More actions"
            >
              ⋮
            </button>
            {showActions && (
              <div className="absolute right-0 top-10 z-50 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl py-2 min-w-[160px]">
                <button
                  onClick={handleReport}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  <Flag className="w-3.5 h-3.5 text-amber-500" />
                  Report User
                </button>
                <button
                  onClick={handleBlock}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                >
                  <Ban className="w-3.5 h-3.5" />
                  Block User
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 max-w-3xl mx-auto w-full px-4 py-6 space-y-3 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin w-8 h-8 border-2 border-teal-500/30 border-t-teal-500 rounded-full" />
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-16">
            <MessageSquare className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-4" />
            <h3 className="font-bold text-slate-700 dark:text-slate-300 mb-1">Start the conversation</h3>
            <p className="text-sm text-slate-400 dark:text-slate-500">
              Say hello to {otherUser?.display_name || 'your new connection'}!
            </p>
          </div>
        ) : (
          messages.map((msg) => {
            const isOwn = msg.sender_id === user?.id;
            return (
              <div
                key={msg.id}
                className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                    isOwn
                      ? 'bg-teal-500 text-slate-950 rounded-br-md'
                      : 'bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-slate-900 dark:text-white rounded-bl-md'
                  }`}
                >
                  {msg.content}
                  <div className={`text-[10px] mt-1 ${isOwn ? 'text-slate-950/60' : 'text-slate-400'}`}>
                    {new Date(msg.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                    {isOwn && (
                      <span className="ml-2">{msg.is_read ? '✓✓' : '✓'}</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {error && (
        <div className="max-w-3xl mx-auto w-full px-4">
          <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
            <button onClick={() => setError(null)} className="ml-auto font-bold">✕</button>
          </div>
        </div>
      )}

      {/* Message Input */}
      <div className="sticky bottom-0 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-t border-slate-200/80 dark:border-slate-800">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <div className="flex items-end gap-3">
            <textarea
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Type a message... (Enter to send)"
              rows={1}
              maxLength={2000}
              className="flex-1 resize-none px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-teal-500 transition max-h-32"
              id="message-input"
            />
            <button
              onClick={handleSend}
              disabled={!inputText.trim() || isSending}
              className="flex-shrink-0 w-12 h-12 flex items-center justify-center rounded-2xl bg-teal-500 hover:bg-teal-400 disabled:opacity-50 disabled:cursor-not-allowed text-slate-950 transition-all active:scale-95 shadow-md"
              aria-label="Send message"
              id="send-message-btn"
            >
              {isSending ? (
                <span className="animate-spin w-4 h-4 border-2 border-slate-950/30 border-t-slate-950 rounded-full" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </button>
          </div>
          <p className="text-[10px] text-slate-400 mt-1 text-right">{inputText.length}/2000</p>
        </div>
      </div>
    </div>
  );
};
