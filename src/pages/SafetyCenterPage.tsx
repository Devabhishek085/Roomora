import React, { useState } from 'react';
import { 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  Flag, 
  Phone, 
  Lock, 
  FileText, 
  HelpCircle 
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';

export const SafetyCenterPage: React.FC = () => {
  const { addSafetyReport, safetyReports } = useAppStore();

  const [reportTitle, setReportTitle] = useState('');
  const [reportType, setReportType] = useState<'listing' | 'roommate'>('listing');
  const [reportReason, setReportReason] = useState('Demanded advance token before room visit');
  const [reportDetails, setReportDetails] = useState('');
  const [reportSubmitted, setReportSubmitted] = useState(false);

  // Interactive Checklist State
  const [checkedItems, setCheckedItems] = useState<Record<number, boolean>>({
    0: true,
    1: true
  });

  const toggleCheck = (idx: number) => {
    setCheckedItems((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  const checklist = [
    {
      title: 'Physical In-Person Room Visit',
      desc: 'Never commit to a PG or flat based purely on photos. Always inspect room ventilation, water pressure, and noise in person.'
    },
    {
      title: 'No Token Advance Before Document Check',
      desc: 'Fraudulent listings urge you to send ₹2,000–₹5,000 via UPI to "reserve" the room. Never send advance money before signing a rent deed.'
    },
    {
      title: 'Verify Student College ID / Owner Utility Bill',
      desc: 'Ask for the electricity bill or ownership proof from the landlord, and verify student identity cards for flatmates.'
    },
    {
      title: 'Clarify Hidden Bills (Electricity & Food)',
      desc: 'Confirm in writing whether AC electricity is charged on a commercial sub-meter and if Sunday dinner is included.'
    },
    {
      title: 'Emergency Contact & Night Curfew Policy',
      desc: 'Check if entry gates are strictly locked at 10:30 PM and whether you have keys or 24/7 guard access.'
    }
  ];

  const handleReportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addSafetyReport({
      targetId: 'rep-' + Date.now(),
      targetType: reportType,
      targetTitle: reportTitle,
      reason: reportReason,
      details: reportDetails
    });
    setReportSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] dark:bg-[#0A0D14] text-slate-900 dark:text-slate-100 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-10">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-100 dark:bg-teal-950 text-teal-800 dark:text-teal-300 text-xs font-bold">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Campus Safety & Scam Prevention</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold font-heading text-slate-900 dark:text-white">
            Student Housing Safety Center
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-xl mx-auto">
            Practical guidelines, red-flag scam checklists, and incident reporting for anyone searching for a PG or shared flat.
          </p>
        </div>

        {/* Beta Notice */}
        <div className="p-5 rounded-3xl bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <strong className="font-bold block text-sm">Beta Platform Notice:</strong>
            <p className="leading-relaxed">
              Roommate.com is in closed beta. Host verification is manual review-based at this stage. Always meet in a public place first, never wire money without a signed agreement, and cross-check the landlord&apos;s Aadhaar before paying any advance.
            </p>
          </div>
        </div>

        {/* Red-Flag Checklist Section */}
        <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-6">
          <div>
            <h2 className="text-xl font-bold font-heading text-slate-900 dark:text-white">
              Essential Pre-Payment Checklist
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Check off every item before handing over any security deposit.
            </p>
          </div>

          <div className="space-y-3">
            {checklist.map((item, idx) => {
              const isChecked = !!checkedItems[idx];
              return (
                <div
                  key={idx}
                  onClick={() => toggleCheck(idx)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 ${
                    isChecked
                      ? 'border-teal-500/50 bg-teal-50/50 dark:bg-teal-950/30'
                      : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-lg flex items-center justify-center shrink-0 mt-0.5 border ${
                      isChecked
                        ? 'bg-teal-500 border-teal-500 text-slate-950'
                        : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800'
                    }`}
                  >
                    {isChecked && <CheckCircle2 className="w-4 h-4" />}
                  </div>

                  <div>
                    <h4
                      className={`text-xs font-bold ${
                        isChecked
                          ? 'text-teal-900 dark:text-teal-200'
                          : 'text-slate-800 dark:text-slate-200'
                      }`}
                    >
                      {item.title}
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                      {item.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Report Suspicious Activity Form */}
        <div id="report" className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-6">
          <div className="flex items-center gap-2">
            <Flag className="w-5 h-5 text-rose-500" />
            <h2 className="text-xl font-bold font-heading text-slate-900 dark:text-white">
              Report a Suspicious Property or Roommate
            </h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 -mt-3">
            Reports are captured in local state and flagged on this browser.
          </p>

          {reportSubmitted ? (
            <div className="p-4 rounded-2xl bg-teal-100 dark:bg-teal-950 text-teal-800 dark:text-teal-200 text-xs font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-teal-600" />
              <span>Report saved locally! Thank you for protecting fellow campus students.</span>
            </div>
          ) : (
            <form onSubmit={handleReportSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Report Target
                  </label>
                  <select
                    value={reportType}
                    onChange={(e) => setReportType(e.target.value as any)}
                    className="w-full text-xs p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  >
                    <option value="listing">Fake Property / PG Listing</option>
                    <option value="roommate">Misleading Roommate Profile</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Target Name or Title
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Skyline PG or Candidate Name"
                    value={reportTitle}
                    onChange={(e) => setReportTitle(e.target.value)}
                    className="w-full text-xs p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Reason for Report
                </label>
                <select
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  className="w-full text-xs p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                >
                  <option value="Demanded advance token before room visit">Demanded advance token before room visit</option>
                  <option value="Photos do not match reality">Photos do not match reality</option>
                  <option value="Harassment or inappropriate communication">Harassment or inappropriate communication</option>
                  <option value="Hidden charges undisclosed in rent">Hidden charges undisclosed in rent</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Details / Evidence
                </label>
                <textarea
                  rows={3}
                  value={reportDetails}
                  onChange={(e) => setReportDetails(e.target.value)}
                  placeholder="Provide context regarding the incident..."
                  className="w-full text-xs p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>

              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-md transition-all active:scale-95"
              >
                Submit Local Report
              </button>
            </form>
          )}

          {safetyReports.length > 0 && (
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
              <span className="text-xs font-bold text-slate-500 block mb-2">
                Your Submitted Reports ({safetyReports.length})
              </span>
              <div className="space-y-2">
                {safetyReports.map((r) => (
                  <div
                    key={r.id}
                    className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs flex justify-between items-center"
                  >
                    <div>
                      <span className="font-bold text-slate-900 dark:text-white">{r.targetTitle}</span>
                      <p className="text-[11px] text-rose-500">{r.reason}</p>
                    </div>
                    <span className="text-[10px] text-slate-400">Under Review (Local)</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
