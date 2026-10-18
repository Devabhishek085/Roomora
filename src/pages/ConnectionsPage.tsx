import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MessageSquare, Users, ArrowRight, Coins, ShieldCheck, Check, X, Clock, MailCheck, AlertCircle } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import {
  getUserConnections,
  getConversationByConnection,
  acceptConnection,
  declineConnection
} from '../services/connections';
import { fetchProfileById } from '../services/profiles';
import { isSupabaseConfigured } from '../lib/supabase';
import type { RoommateConnection, DbProfile } from '../types';

interface ConnectionWithProfile {
  connection: RoommateConnection;
  otherProfile: DbProfile | null;
  conversationId: string | null;
}

type TabType = 'active' | 'incoming' | 'sent';

export const ConnectionsPage: React.FC = () => {
  const { user, tokenBalance } = useAuthStore();
  const [connectionsData, setConnectionsData] = useState<ConnectionWithProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('active');
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const loadConnections = async () => {
    if (!user || !isSupabaseConfigured) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const connections = await getUserConnections(user.id);

    const enriched = await Promise.all(
      connections.map(async (conn) => {
        const otherId = conn.initiator_id === user.id ? conn.recipient_id : conn.initiator_id;
        const [otherProfile, conversationId] = await Promise.all([
          fetchProfileById(otherId),
          getConversationByConnection(conn.id)
        ]);
        return { connection: conn, otherProfile, conversationId };
      })
    );

    setConnectionsData(enriched);

    // If there are pending invitations received, default tab to 'incoming'
    const hasIncoming = enriched.some(
      item => item.connection.recipient_id === user.id && item.connection.status === 'pending'
    );
    if (hasIncoming) {
      setActiveTab('incoming');
    }

    setIsLoading(false);
  };

  useEffect(() => {
    loadConnections();
  }, [user]);

  const handleAccept = async (connectionId: string, profileName: string) => {
    setActionInProgress(connectionId);
    setFeedbackMessage(null);

    const result = await acceptConnection(connectionId);
    if (result.success) {
      // Optimistically update status
      setConnectionsData(prev =>
        prev.map(item =>
          item.connection.id === connectionId
            ? { ...item, connection: { ...item.connection, status: 'accepted' } }
            : item
        )
      );
      setFeedbackMessage({
        text: `Connected with ${profileName}! You can now start chatting.`,
        type: 'success'
      });
      // Switch to active tab to see the new connection
      setActiveTab('active');
    } else {
      setFeedbackMessage({
        text: result.error || 'Failed to accept invitation. Please try again.',
        type: 'error'
      });
    }
    setActionInProgress(null);
  };

  const handleDecline = async (connectionId: string) => {
    if (!confirm('Are you sure you want to decline this connection invitation?')) return;

    setActionInProgress(connectionId);
    setFeedbackMessage(null);

    const result = await declineConnection(connectionId);
    if (result.success) {
      setConnectionsData(prev => prev.filter(item => item.connection.id !== connectionId));
      setFeedbackMessage({
        text: 'Invitation declined.',
        type: 'success'
      });
    } else {
      setFeedbackMessage({
        text: result.error || 'Failed to decline invitation.',
        type: 'error'
      });
    }
    setActionInProgress(null);
  };

  // Group connections
  const incomingInvitations = connectionsData.filter(
    item => item.connection.recipient_id === user?.id && item.connection.status === 'pending'
  );

  const sentInvitations = connectionsData.filter(
    item => item.connection.initiator_id === user?.id && item.connection.status === 'pending'
  );

  const activeConnections = connectionsData.filter(
    item => item.connection.status === 'accepted' || item.connection.status === 'active'
  );

  return (
    <div className="min-h-screen bg-[#FAF8F5] dark:bg-[#0A0D14] py-8 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-extrabold font-heading text-slate-900 dark:text-white">
              My Connections
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Manage your connection requests, invitations, and roommate conversations
            </p>
          </div>

          {/* Token balance */}
          {tokenBalance && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-teal-50 dark:bg-teal-950/50 border border-teal-200/60 dark:border-teal-800 text-xs font-bold text-teal-700 dark:text-teal-300">
              <Coins className="w-4 h-4" />
              <span>{tokenBalance.balance} tokens left</span>
            </div>
          )}
        </div>

        {/* Feedback Alert */}
        {feedbackMessage && (
          <div
            className={`p-4 rounded-2xl flex items-center justify-between text-sm ${
              feedbackMessage.type === 'success'
                ? 'bg-teal-50 dark:bg-teal-950/50 text-teal-900 dark:text-teal-200 border border-teal-200 dark:border-teal-800'
                : 'bg-rose-50 dark:bg-rose-950/50 text-rose-900 dark:text-rose-200 border border-rose-200 dark:border-rose-800'
            }`}
          >
            <span>{feedbackMessage.text}</span>
            <button
              onClick={() => setFeedbackMessage(null)}
              className="text-xs font-bold opacity-70 hover:opacity-100 ml-3"
            >
              ✕
            </button>
          </div>
        )}

        {!isSupabaseConfigured && (
          <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-sm">
            ⚠️ Backend not configured. Configure Supabase to enable real connections and messaging.
          </div>
        )}

        {!user && (
          <div className="p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-md text-center space-y-4">
            <Users className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto" />
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Sign in to see your connections</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Create an account to start connecting with compatible roommates.
            </p>
            <div className="flex justify-center gap-3">
              <Link to="/register" className="px-5 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-sm transition-all">
                Create Account
              </Link>
              <Link to="/login" className="px-5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-white font-bold text-sm transition-all">
                Sign In
              </Link>
            </div>
          </div>
        )}

        {user && !isLoading && (
          /* Filter Tabs */
          <div className="flex items-center gap-2 p-1.5 bg-slate-100/80 dark:bg-slate-800/80 rounded-2xl border border-slate-200/70 dark:border-slate-700/60">
            <button
              onClick={() => setActiveTab('active')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'active'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Active Chats</span>
              <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-slate-200 dark:bg-slate-700">
                {activeConnections.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('incoming')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'incoming'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <MailCheck className="w-3.5 h-3.5" />
              <span>Invitations</span>
              {incomingInvitations.length > 0 ? (
                <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-teal-500 text-slate-950 font-black animate-pulse">
                  {incomingInvitations.length}
                </span>
              ) : (
                <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-slate-200 dark:bg-slate-700">
                  0
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('sent')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'sent'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Sent</span>
              <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-slate-200 dark:bg-slate-700">
                {sentInvitations.length}
              </span>
            </button>
          </div>
        )}

        {user && isLoading && (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin w-8 h-8 border-2 border-teal-500/30 border-t-teal-500 rounded-full" />
          </div>
        )}

        {/* Tab 1: Active & Accepted Connections */}
        {user && !isLoading && activeTab === 'active' && (
          <div className="space-y-3">
            {activeConnections.length === 0 ? (
              <div className="p-10 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-md text-center space-y-4">
                <MessageSquare className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto" />
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">No active chats yet</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {incomingInvitations.length > 0
                    ? `You have ${incomingInvitations.length} pending invitation${incomingInvitations.length > 1 ? 's' : ''} waiting for your acceptance.`
                    : 'Browse compatible roommates and send a connection invitation to start chatting.'}
                </p>
                {incomingInvitations.length > 0 ? (
                  <button
                    onClick={() => setActiveTab('incoming')}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-sm transition-all"
                  >
                    <span>View Invitations</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                ) : (
                  <Link
                    to="/matches"
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-sm transition-all"
                  >
                    <Users className="w-4 h-4" />
                    <span>Find Roommates</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                )}
              </div>
            ) : (
              activeConnections.map(({ connection, otherProfile, conversationId }) => (
                <div
                  key={connection.id}
                  className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md transition-all flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-teal-500 to-emerald-400 flex items-center justify-center text-white font-black text-lg shadow-sm">
                      {otherProfile?.display_name?.[0] || '?'}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 dark:text-white">
                        {otherProfile?.display_name || 'Roommate'}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {otherProfile?.occupation || ''} {otherProfile?.city ? `• ${otherProfile.city}` : ''}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        {otherProfile && !otherProfile.is_demo && (
                          <span className="flex items-center gap-1 text-[10px] text-teal-700 dark:text-teal-300 font-bold">
                            <ShieldCheck className="w-3 h-3" />
                            Connected
                          </span>
                        )}
                        <span className="text-[10px] text-slate-400">
                          {new Date(connection.created_at).toLocaleDateString('en-IN')}
                        </span>
                      </div>
                    </div>
                  </div>

                  {conversationId ? (
                    <Link
                      to={`/messages/${conversationId}`}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs transition-all shadow-sm active:scale-95 shrink-0"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>Message</span>
                    </Link>
                  ) : (
                    <span className="text-xs text-slate-400">Preparing...</span>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {/* Tab 2: Incoming Invitations (Needs Action) */}
        {user && !isLoading && activeTab === 'incoming' && (
          <div className="space-y-3">
            {incomingInvitations.length === 0 ? (
              <div className="p-10 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-md text-center space-y-4">
                <MailCheck className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto" />
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">No pending invitations</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  When someone connects with your profile, you'll receive an email notification and their invitation will appear here for you to accept.
                </p>
              </div>
            ) : (
              incomingInvitations.map(({ connection, otherProfile }) => {
                const isProcessing = actionInProgress === connection.id;
                const profileName = otherProfile?.display_name || 'Roommate';

                return (
                  <div
                    key={connection.id}
                    className="p-5 rounded-2xl bg-white dark:bg-slate-900 border-2 border-teal-500/30 dark:border-teal-500/40 shadow-sm transition-all space-y-4"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-teal-500 to-emerald-400 flex items-center justify-center text-white font-black text-lg shadow-sm">
                          {otherProfile?.display_name?.[0] || '?'}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-bold text-slate-900 dark:text-white">
                              {profileName}
                            </h3>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/50">
                              Invitation Received
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            {otherProfile?.occupation || ''} {otherProfile?.city ? `• ${otherProfile.city}` : ''}
                          </p>
                          <p className="text-[11px] text-teal-600 dark:text-teal-400 mt-1 font-medium">
                            🔒 Accept this invitation to unlock 1-on-1 chatting
                          </p>
                        </div>
                      </div>

                      <span className="text-[10px] text-slate-400 shrink-0">
                        {new Date(connection.created_at).toLocaleDateString('en-IN')}
                      </span>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                      <button
                        onClick={() => handleDecline(connection.id)}
                        disabled={isProcessing}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all disabled:opacity-50"
                      >
                        <X className="w-3.5 h-3.5 text-rose-500" />
                        <span>Decline</span>
                      </button>

                      <button
                        onClick={() => handleAccept(connection.id, profileName)}
                        disabled={isProcessing}
                        className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 text-xs font-black transition-all shadow-md active:scale-95 disabled:opacity-50"
                      >
                        {isProcessing ? (
                          <div className="animate-spin w-3.5 h-3.5 border-2 border-slate-950/30 border-t-slate-950 rounded-full" />
                        ) : (
                          <Check className="w-3.5 h-3.5" />
                        )}
                        <span>Accept & Start Chat</span>
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* Tab 3: Sent Requests (Pending Approval) */}
        {user && !isLoading && activeTab === 'sent' && (
          <div className="space-y-3">
            {sentInvitations.length === 0 ? (
              <div className="p-10 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-md text-center space-y-4">
                <Clock className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto" />
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">No pending sent requests</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  When you initiate a connection with someone, your sent invitation will be tracked here until they accept.
                </p>
                <Link
                  to="/matches"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-sm transition-all"
                >
                  <Users className="w-4 h-4" />
                  <span>Explore Roommates</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            ) : (
              sentInvitations.map(({ connection, otherProfile }) => (
                <div
                  key={connection.id}
                  className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-slate-400 to-slate-500 flex items-center justify-center text-white font-black text-lg shadow-sm">
                      {otherProfile?.display_name?.[0] || '?'}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 dark:text-white">
                        {otherProfile?.display_name || 'Roommate'}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {otherProfile?.occupation || ''} {otherProfile?.city ? `• ${otherProfile.city}` : ''}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="flex items-center gap-1 text-[10px] text-amber-600 dark:text-amber-400 font-bold bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-full border border-amber-200 dark:border-amber-800/40">
                          <Clock className="w-3 h-3" />
                          Waiting for acceptance
                        </span>
                        <span className="text-[10px] text-slate-400">
                          Sent {new Date(connection.created_at).toLocaleDateString('en-IN')}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-[11px] font-semibold text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                      Chat locked
                    </span>
                    <p className="text-[10px] text-slate-400 mt-1 max-w-[130px]">
                      Unlocks once accepted
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Token balance CTA */}
        {user && tokenBalance && tokenBalance.balance === 0 && (
          <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-950 to-slate-900 border border-indigo-500/20 text-white">
            <h3 className="font-bold mb-1">Out of free connections?</h3>
            <p className="text-sm text-indigo-200 mb-4">
              Upgrade to Connect+ for unlimited connections at ₹199/month.
            </p>
            <Link
              to="/subscribe"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-teal-400 hover:bg-teal-300 text-slate-950 font-bold text-sm transition-all"
            >
              <span>View Plans</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};
