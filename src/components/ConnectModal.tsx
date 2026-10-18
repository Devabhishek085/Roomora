import React, { useState, useEffect } from 'react';
import { X, MessageSquare, Coins, ShieldCheck, ArrowRight, AlertCircle, Users, Bot } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import type { RoommateProfile } from '../types';
import { useAuthStore } from '../store/useAuthStore';
import { useAppStore } from '../store/useAppStore';
import { initiateConnection, checkExistingConnection, getConversationByConnection } from '../services/connections';
import { isSupabaseConfigured } from '../lib/supabase';

interface ConnectModalProps {
  roommate: RoommateProfile | null;
  onClose: () => void;
}

type ModalStep = 'confirm' | 'processing' | 'success' | 'already_connected' | 'no_tokens' | 'demo_profile' | 'error' | 'not_authenticated';

export const ConnectModal: React.FC<ConnectModalProps> = ({ roommate, onClose }) => {
  const navigate = useNavigate();
  const { user, tokenBalance, refreshTokenBalance } = useAuthStore();
  const { addRoommateRequest } = useAppStore(); // Fallback for demo mode
  const [step, setStep] = useState<ModalStep>('confirm');
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Reset state when roommate changes & manage scroll lock
  useEffect(() => {
    if (roommate) {
      setStep('confirm');
      setConversationId(null);
      setErrorMessage(null);
      const lenis = (window as any).__lenis;
      if (lenis && typeof lenis.stop === 'function') lenis.stop();
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        if (lenis && typeof lenis.start === 'function') lenis.start();
        document.body.style.overflow = prev;
      };
    }
  }, [roommate]);

  if (!roommate) return null;

  const handleConnect = async () => {
    // Demo profile guard
    if (roommate.isVerifiedDemo && roommate.demoLabel) {
      setStep('demo_profile');
      return;
    }

    // Auth guard
    if (!user) {
      setStep('not_authenticated');
      return;
    }

    // If Supabase not configured, fall back to legacy localStorage behavior
    if (!isSupabaseConfigured) {
      addRoommateRequest(roommate.id, roommate.name, `Connection request from demo mode`);
      setStep('success');
      return;
    }

    setStep('processing');

    // Check existing connection
    const existing = await checkExistingConnection(user.id, roommate.id);
    if (existing) {
      const convoId = await getConversationByConnection(existing.id);
      setConversationId(convoId);
      setStep('already_connected');
      return;
    }

    // Initiate connection (atomic token deduction)
    const result = await initiateConnection(user.id, roommate.id);

    if (result.success) {
      // Refresh token balance in UI
      await refreshTokenBalance();
      if (result.connectionId) {
        const convoId = await getConversationByConnection(result.connectionId);
        setConversationId(convoId);
      }
      setStep('success');
    } else {
      if (result.error === 'insufficient_tokens') {
        setStep('no_tokens');
      } else if (result.error === 'connection_already_exists') {
        setStep('already_connected');
      } else if (result.error === 'cannot_connect_to_demo_profile') {
        setStep('demo_profile');
      } else {
        setErrorMessage(result.error || 'Connection failed. Please try again.');
        setStep('error');
      }
    }
  };

  const renderContent = () => {
    switch (step) {
      case 'confirm':
        return (
          <div className="space-y-5">
            {/* Profile Preview */}
            <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800">
              <img
                src={roommate.avatarUrl}
                alt={roommate.name}
                className="w-14 h-14 rounded-xl object-cover border-2 border-teal-400/30"
              />
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white">{roommate.name}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {roommate.occupation} • {roommate.city}
                </p>
                {roommate.isVerifiedDemo && roommate.demoLabel && (
                  <span className="inline-flex items-center gap-1 text-[10px] text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-full border border-amber-200/60 dark:border-amber-800/40 mt-1">
                    <Bot className="w-3 h-3" />
                    {roommate.demoLabel}
                  </span>
                )}
              </div>
            </div>

            {/* Token cost explanation */}
            <div className="p-4 rounded-2xl bg-teal-50 dark:bg-teal-950/40 border border-teal-200/60 dark:border-teal-800/40">
              <div className="flex items-start gap-3">
                <Coins className="w-5 h-5 text-teal-600 dark:text-teal-400 shrink-0 mt-0.5" />
                <div className="text-xs text-teal-800 dark:text-teal-200">
                  {user ? (
                    <>
                      <strong className="block font-bold mb-1">
                        Uses 1 connection token
                      </strong>
                      {tokenBalance ? (
                        <span>
                          You have <strong>{tokenBalance.balance}</strong> of {tokenBalance.lifetime_granted} free connections remaining.
                          Once connected, messaging is free — no additional tokens required.
                        </span>
                      ) : (
                        <span>Connecting uses 1 token from your free allowance.</span>
                      )}
                    </>
                  ) : (
                    <span>Sign in to connect. New accounts get 10 free connections.</span>
                  )}
                </div>
              </div>
            </div>

            {/* Demo profile warning */}
            {roommate.isVerifiedDemo && roommate.demoLabel && (
              <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200/60 dark:border-amber-800/40 text-amber-800 dark:text-amber-200 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>
                  This is an <strong>{roommate.demoLabel}</strong>. Demo profiles cannot receive real connections. No token will be deducted.
                </span>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-sm hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleConnect}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-sm transition-all shadow-md active:scale-95"
                id="confirm-connect-btn"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Connect</span>
              </button>
            </div>
          </div>
        );

      case 'processing':
        return (
          <div className="text-center py-8 space-y-4">
            <div className="w-14 h-14 mx-auto">
              <div className="animate-spin w-14 h-14 border-4 border-teal-500/20 border-t-teal-500 rounded-full" />
            </div>
            <p className="font-semibold text-slate-700 dark:text-slate-300">Establishing connection...</p>
          </div>
        );

      case 'success':
        return (
          <div className="text-center space-y-5 py-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-teal-100 dark:bg-teal-950 flex items-center justify-center">
              <ShieldCheck className="w-8 h-8 text-teal-600 dark:text-teal-400" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white mb-1">
                Connected! 🎉
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                You're now connected with {roommate.name}. Start a conversation!
              </p>
              {tokenBalance && (
                <p className="text-xs text-teal-600 dark:text-teal-400 mt-2 font-semibold">
                  {tokenBalance.balance} connection{tokenBalance.balance !== 1 ? 's' : ''} remaining
                </p>
              )}
            </div>
            <div className="flex gap-3">
              <button onClick={onClose} className="flex-1 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-sm hover:bg-slate-200 transition-all">
                Close
              </button>
              {conversationId && (
                <button
                  onClick={() => { onClose(); navigate(`/messages/${conversationId}`); }}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-sm transition-all shadow-md"
                  id="open-chat-btn"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Open Chat</span>
                </button>
              )}
            </div>
          </div>
        );

      case 'already_connected':
        return (
          <div className="text-center space-y-5 py-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
              <Users className="w-8 h-8 text-teal-500" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">Already Connected</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                You're already connected with {roommate.name}. No token deducted.
              </p>
            </div>
            <div className="flex gap-3">
              <button onClick={onClose} className="flex-1 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-sm">
                Close
              </button>
              {conversationId && (
                <button
                  onClick={() => { onClose(); navigate(`/messages/${conversationId}`); }}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-sm shadow-md"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Go to Chat</span>
                </button>
              )}
            </div>
          </div>
        );

      case 'no_tokens':
        return (
          <div className="text-center space-y-5 py-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-rose-100 dark:bg-rose-950/40 flex items-center justify-center">
              <Coins className="w-8 h-8 text-rose-500" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">No Tokens Remaining</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                You've used all your free connection tokens. Upgrade to Connect+ for unlimited connections.
              </p>
            </div>
            <div className="flex gap-3">
              <button onClick={onClose} className="flex-1 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-sm">
                Later
              </button>
              <Link
                to="/subscribe"
                onClick={onClose}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-sm shadow-md"
                id="upgrade-plan-btn"
              >
                <span>View Plans</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        );

      case 'demo_profile':
        return (
          <div className="text-center space-y-5 py-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-amber-100 dark:bg-amber-950/40 flex items-center justify-center">
              <Bot className="w-8 h-8 text-amber-500" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">Demo Profile</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {roommate.name} is an AI-generated demo profile and cannot be contacted. Browse real verified profiles to connect.
              </p>
            </div>
            <button onClick={onClose} className="w-full py-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-sm">
              Close
            </button>
          </div>
        );

      case 'not_authenticated':
        return (
          <div className="text-center space-y-5 py-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-indigo-100 dark:bg-indigo-950/40 flex items-center justify-center">
              <Users className="w-8 h-8 text-indigo-500" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">Sign In Required</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Create a free account to connect with roommates. New accounts get 10 free connections.
              </p>
            </div>
            <div className="flex gap-3">
              <button onClick={onClose} className="flex-1 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-sm">
                Cancel
              </button>
              <Link
                to="/register"
                onClick={onClose}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-sm shadow-md"
              >
                <span>Create Account</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        );

      case 'error':
        return (
          <div className="text-center space-y-5 py-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-rose-100 dark:bg-rose-950/40 flex items-center justify-center">
              <AlertCircle className="w-8 h-8 text-rose-500" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">Connection Failed</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">{errorMessage}</p>
            </div>
            <button onClick={onClose} className="w-full py-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-sm">
              Close
            </button>
          </div>
        );
    }
  };

  return (
    <div
      data-lenis-prevent="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4 overscroll-contain"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      role="dialog"
      aria-modal="true"
      aria-label={`Connect with ${roommate.name}`}
    >
      <div data-lenis-prevent="true" className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 pb-4 border-b border-slate-100 dark:border-slate-800">
          <h2 className="font-bold text-slate-900 dark:text-white">
            Connect with {roommate.name}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 transition-colors"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};
