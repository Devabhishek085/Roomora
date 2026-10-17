import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MessageSquare, Users, ArrowRight, Coins, ShieldCheck } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { getUserConnections, getConversationByConnection } from '../services/connections';
import { fetchProfileById } from '../services/profiles';
import { isSupabaseConfigured } from '../lib/supabase';
import type { RoommateConnection, DbProfile } from '../types';

interface ConnectionWithProfile {
  connection: RoommateConnection;
  otherProfile: DbProfile | null;
  conversationId: string | null;
}

export const ConnectionsPage: React.FC = () => {
  const { user, tokenBalance } = useAuthStore();
  const [connectionsData, setConnectionsData] = useState<ConnectionWithProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user || !isSupabaseConfigured) {
      setIsLoading(false);
      return;
    }

    const load = async () => {
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
      setIsLoading(false);
    };

    load();
  }, [user]);

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
              Your active roommate connections and messages
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

        {user && isLoading && (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin w-8 h-8 border-2 border-teal-500/30 border-t-teal-500 rounded-full" />
          </div>
        )}

        {user && !isLoading && connectionsData.length === 0 && (
          <div className="p-10 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-md text-center space-y-4">
            <MessageSquare className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto" />
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">No connections yet</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Use your {tokenBalance?.balance ?? 10} free tokens to connect with compatible roommates.
            </p>
            <Link
              to="/matches"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-sm transition-all"
            >
              <Users className="w-4 h-4" />
              <span>Find Roommates</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}

        {user && !isLoading && connectionsData.length > 0 && (
          <div className="space-y-3">
            {connectionsData.map(({ connection, otherProfile, conversationId }) => (
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
                          Real Profile
                        </span>
                      )}
                      <span className="text-[10px] text-slate-400">
                        Connected {new Date(connection.created_at).toLocaleDateString('en-IN')}
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
                  <span className="text-xs text-slate-400">Loading...</span>
                )}
              </div>
            ))}
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
