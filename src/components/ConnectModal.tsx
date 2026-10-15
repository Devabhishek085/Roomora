import React, { useState } from 'react';
import { X, Send, Sparkles, CheckCircle2 } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useAppStore } from '../store/useAppStore';
import type { RoommateProfile } from '../types';

interface ConnectModalProps {
  roommate: RoommateProfile | null;
  onClose: () => void;
}

export const ConnectModal: React.FC<ConnectModalProps> = ({ roommate, onClose }) => {
  const { addRoommateRequest, userProfile } = useAppStore();
  const [message, setMessage] = useState(
    `Hey ${roommate?.name || 'there'}! I saw your profile on Roommate.com and we have matching lifestyle preferences for ${roommate?.city || 'campus'}. Would love to connect and chat about finding a place together!`
  );
  const [sent, setSent] = useState(false);

  if (!roommate) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addRoommateRequest(roommate.id, roommate.name, message);
    setSent(true);
    try {
      confetti({ particleCount: 60, spread: 70, origin: { y: 0.6 } });
    } catch {}
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src={roommate.avatarUrl}
              alt={roommate.name}
              className="w-12 h-12 rounded-2xl object-cover border-2 border-teal-500"
            />
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Connect with {roommate.name}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {roommate.occupation} • {roommate.institution}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {sent ? (
          <div className="py-6 text-center space-y-3">
            <div className="w-12 h-12 mx-auto rounded-full bg-teal-100 dark:bg-teal-950/80 text-teal-600 dark:text-teal-400 flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-base text-slate-900 dark:text-white">
              Request Sent!
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Your message was stored in your local Dashboard. When {roommate.name} accepts, you can coordinate apartment visits together.
            </p>
            <button
              onClick={onClose}
              className="mt-2 px-5 py-2 rounded-xl bg-slate-900 dark:bg-slate-800 text-white text-xs font-bold"
            >
              Close
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Your Intro Message
              </label>
              <textarea
                rows={4}
                required
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full text-xs p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-teal-500/50"
              />
            </div>

            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Saved to Dashboard</span>
              <span>100% Free Demo Connect</span>
            </div>

            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs shadow-md transition-all active:scale-95"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Send Connect Invitation</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
