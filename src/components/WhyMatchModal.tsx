import React from 'react';
import { X, CheckCircle2, AlertCircle, Info, Sparkles, ShieldCheck } from 'lucide-react';
import type { RoommateProfile, CompatibilityReport } from '../types';

interface WhyMatchModalProps {
  roommate: RoommateProfile | null;
  report: CompatibilityReport | null;
  onClose: () => void;
}

export const WhyMatchModal: React.FC<WhyMatchModalProps> = ({
  roommate,
  report,
  onClose
}) => {
  if (!roommate || !report) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50">
          <div className="flex items-center gap-3">
            <img
              src={roommate.avatarUrl}
              alt={roommate.name}
              className="w-12 h-12 rounded-2xl object-cover border-2 border-teal-500"
            />
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-heading font-extrabold text-lg text-slate-900 dark:text-white">
                  Why {roommate.name}?
                </h3>
                <span className="px-2.5 py-0.5 rounded-full bg-teal-100 dark:bg-teal-950 text-teal-700 dark:text-teal-300 font-black text-xs">
                  {report.score}% Match
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Explainable compatibility analysis computed transparently
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs sm:text-sm">
          {/* Summary Box */}
          <div className="p-4 rounded-2xl bg-teal-50/70 dark:bg-teal-950/40 border border-teal-200/80 dark:border-teal-800/60 text-teal-900 dark:text-teal-100 flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-teal-600 dark:text-teal-400 shrink-0 mt-0.5" />
            <div>
              <strong className="block font-bold text-xs uppercase tracking-wider text-teal-700 dark:text-teal-300 mb-0.5">
                Engine Verdict
              </strong>
              <p className="text-xs leading-relaxed">{report.summaryText}</p>
            </div>
          </div>

          {/* Hard Constraint Status */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
            <span className="font-bold text-xs text-slate-700 dark:text-slate-300">
              Hard Budget & Policy Constraints
            </span>
            {report.hardConstraintPassed ? (
              <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="w-4 h-4" /> Passed
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-xs font-bold text-rose-500">
                <AlertCircle className="w-4 h-4" /> Warning
              </span>
            )}
          </div>
          {report.hardConstraintReason && (
            <p className="text-xs text-rose-500 bg-rose-50 dark:bg-rose-950/50 p-3 rounded-xl border border-rose-200 dark:border-rose-800">
              {report.hardConstraintReason}
            </p>
          )}

          {/* Category-by-Category Match Breakdown */}
          <div className="space-y-3">
            <h4 className="font-bold text-xs uppercase tracking-wider text-slate-400">
              Detailed Factor Breakdown
            </h4>
            <div className="space-y-2.5">
              {report.categoryBreakdown.map((item) => (
                <div
                  key={item.category}
                  className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800"
                >
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="font-bold text-xs text-slate-900 dark:text-white">
                      {item.label}
                    </span>
                    <span className="font-black text-xs text-teal-600 dark:text-teal-400">
                      {item.matchPercentage}%
                    </span>
                  </div>
                  {/* Progress bar */}
                  <div className="h-2 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden mb-2">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        item.matchPercentage >= 80
                          ? 'bg-teal-500'
                          : item.matchPercentage >= 60
                          ? 'bg-amber-400'
                          : 'bg-rose-400'
                      }`}
                      style={{ width: `${item.matchPercentage}%` }}
                    />
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400">
                    {item.explanation}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Strengths & Points to Discuss */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {report.strengths.length > 0 && (
              <div className="p-4 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-800/40 space-y-2">
                <h5 className="font-bold text-xs uppercase tracking-wider text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Core Synergy
                </h5>
                <ul className="space-y-1 text-xs text-emerald-900 dark:text-emerald-200">
                  {report.strengths.map((s, idx) => (
                    <li key={idx}>• {s}</li>
                  ))}
                </ul>
              </div>
            )}

            {report.considerations.length > 0 && (
              <div className="p-4 rounded-2xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-800/40 space-y-2">
                <h5 className="font-bold text-xs uppercase tracking-wider text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5" /> Discuss Before Moving In
                </h5>
                <ul className="space-y-1 text-xs text-amber-900 dark:text-amber-200">
                  {report.considerations.map((c, idx) => (
                    <li key={idx}>• {c}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Ethical Disclaimer */}
          <div className="p-3.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-teal-500 shrink-0" />
            <span>
              Disclaimer: Compatibility is a mathematical guide based on your answered survey, not a guarantee. We never use protected characteristics or discriminatory proxies.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
