import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { 
  Users, 
  Sparkles, 
  SlidersHorizontal, 
  Info, 
  ShieldCheck, 
  Search,
  Filter
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { DEMO_ROOMMATES, calculateCompatibility } from '../services/compatibility';
import { RoommateCard } from '../components/RoommateCard';
import { WhyMatchModal } from '../components/WhyMatchModal';
import { ConnectModal } from '../components/ConnectModal';
import type { RoommateProfile, CompatibilityReport } from '../types';

export const MatchesPage: React.FC = () => {
  const { userProfile } = useAppStore();

  const [minScore, setMinScore] = useState<number>(50);
  const [selectedGender, setSelectedGender] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<'score' | 'budget' | 'age'>('score');

  // Selected for modals
  const [inspectRoommate, setInspectRoommate] = useState<{
    roommate: RoommateProfile;
    report: CompatibilityReport;
  } | null>(null);
  const [connectRoommate, setConnectRoommate] = useState<RoommateProfile | null>(null);

  // Compute compatibility for all profiles
  const evaluatedProfiles = useMemo(() => {
    return DEMO_ROOMMATES.map((rm) => {
      const report = calculateCompatibility(userProfile, rm);
      return {
        roommate: rm,
        report
      };
    });
  }, [userProfile]);

  // Apply filters
  const filteredProfiles = useMemo(() => {
    let result = evaluatedProfiles.filter(({ roommate, report }) => {
      if (report.score < minScore) return false;
      if (selectedGender !== 'All' && roommate.gender !== selectedGender) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = roommate.name.toLowerCase().includes(q);
        const matchesInst = roommate.institution.toLowerCase().includes(q);
        const matchesLoc = roommate.targetLocalities.some((l) => l.toLowerCase().includes(q));
        if (!matchesName && !matchesInst && !matchesLoc) return false;
      }
      return true;
    });

    if (sortBy === 'score') {
      result.sort((a, b) => b.report.score - a.report.score);
    } else if (sortBy === 'budget') {
      result.sort((a, b) => a.roommate.budgetMin - b.roommate.budgetMin);
    } else if (sortBy === 'age') {
      result.sort((a, b) => a.roommate.age - b.roommate.age);
    }

    return result;
  }, [evaluatedProfiles, minScore, selectedGender, searchQuery, sortBy]);

  return (
    <div className="min-h-screen bg-[#FAF8F5] dark:bg-[#0A0D14] text-slate-900 dark:text-slate-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200/80 dark:border-slate-800 pb-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-100 dark:bg-teal-950 text-teal-800 dark:text-teal-300 text-xs font-bold mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Explainable Weighted Matching</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold font-heading text-slate-900 dark:text-white">
              Roommate Compatibility Discovery
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
              Matching candidates for <strong className="text-slate-900 dark:text-white">{userProfile.name}</strong> ({userProfile.institution}) based on your circadian rhythm, chores, and budget.
            </p>
          </div>

          <Link
            to="/onboarding"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 dark:bg-slate-800 hover:bg-teal-500 dark:hover:bg-teal-400 text-white dark:text-white hover:text-slate-950 dark:hover:text-slate-950 text-xs font-bold transition-all shadow-sm"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Retake Lifestyle Quiz</span>
          </Link>
        </div>

        {/* Filter Controls Bar */}
        <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-wrap items-center justify-between gap-4">
          {/* Search box */}
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, college, or locality..."
              className="w-full text-xs pl-9 pr-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border-none text-slate-900 dark:text-white outline-none"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs">
            {/* Gender filter */}
            <div className="flex items-center gap-1">
              <span className="text-slate-400 font-semibold mr-1">Gender:</span>
              {['All', 'Male', 'Female'].map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setSelectedGender(g)}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                    selectedGender === g
                      ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>

            {/* Min compatibility */}
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400 font-semibold">Min Match:</span>
              <select
                value={minScore}
                onChange={(e) => setMinScore(Number(e.target.value))}
                className="bg-slate-100 dark:bg-slate-800 px-2.5 py-1.5 rounded-lg text-slate-800 dark:text-slate-200 font-bold outline-none cursor-pointer"
              >
                <option value={40}>All (40%+)</option>
                <option value={60}>Moderate (60%+)</option>
                <option value={75}>High (75%+)</option>
                <option value={85}>Top Synergy (85%+)</option>
              </select>
            </div>

            {/* Sort */}
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400 font-semibold">Sort:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-slate-100 dark:bg-slate-800 px-2.5 py-1.5 rounded-lg text-slate-800 dark:text-slate-200 font-bold outline-none cursor-pointer"
              >
                <option value="score">Compatibility Score</option>
                <option value="budget">Budget (Lowest First)</option>
                <option value="age">Age</option>
              </select>
            </div>
          </div>
        </div>

        {/* Roommates 3D Card Grid */}
        {filteredProfiles.length === 0 ? (
          <div className="p-12 text-center rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              No roommate profiles match current filters
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Try setting Min Match to &ldquo;All&rdquo; or clearing the search query.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProfiles.map(({ roommate, report }) => (
              <RoommateCard
                key={roommate.id}
                roommate={roommate}
                report={report}
                onWhyMatch={(rm, rep) => setInspectRoommate({ roommate: rm, report: rep })}
                onConnect={(rm) => setConnectRoommate(rm)}
              />
            ))}
          </div>
        )}

        {/* Ethics & Transparent Algorithm Banner */}
        <div className="p-4 rounded-2xl bg-teal-50/70 dark:bg-teal-950/40 border border-teal-200/80 dark:border-teal-800/60 text-xs text-teal-900 dark:text-teal-200 flex items-center gap-3">
          <ShieldCheck className="w-5 h-5 text-teal-600 dark:text-teal-400 shrink-0" />
          <div>
            <strong className="font-bold block">Explainable AI Commitment:</strong>
            <span>
              All scores are calculated deterministically using the formula: TotalWeightedScore / TotalUserWeights, normalized to 100%. We never scrape sensitive data or use arbitrary black-box models.
            </span>
          </div>
        </div>
      </div>

      {/* Why This Match Modal */}
      <WhyMatchModal
        roommate={inspectRoommate?.roommate || null}
        report={inspectRoommate?.report || null}
        onClose={() => setInspectRoommate(null)}
      />

      {/* Connect Modal */}
      <ConnectModal
        roommate={connectRoommate}
        onClose={() => setConnectRoommate(null)}
      />
    </div>
  );
};
