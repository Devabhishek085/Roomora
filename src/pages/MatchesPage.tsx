import React, { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  Sparkles,
  SlidersHorizontal,
  ShieldCheck,
  Search,
  Bot,
  Coins,
  Info
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { useAuthStore } from '../store/useAuthStore';
import { DEMO_ROOMMATES, calculateCompatibility } from '../services/compatibility';
import { fetchRoommateProfiles } from '../services/profiles';
import { RoommateCard } from '../components/RoommateCard';
import { WhyMatchModal } from '../components/WhyMatchModal';
import { ConnectModal } from '../components/ConnectModal';
import { isSupabaseConfigured } from '../lib/supabase';
import type { RoommateProfile, CompatibilityReport } from '../types';

export const MatchesPage: React.FC = () => {
  const { userProfile } = useAppStore();
  const { user, tokenBalance } = useAuthStore();

  const [minScore, setMinScore] = useState<number>(50);
  const [selectedGender, setSelectedGender] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<'score' | 'budget' | 'age'>('score');
  const [cityFilter, setCityFilter] = useState<string>('');
  const [showVerifiedOnly, setShowVerifiedOnly] = useState(false);

  // DB profiles state
  const [dbProfiles, setDbProfiles] = useState<RoommateProfile[]>([]);
  const [dbLoading, setDbLoading] = useState(false);
  const [dbError, setDbError] = useState<string | null>(null);

  // Modals
  const [inspectRoommate, setInspectRoommate] = useState<{
    roommate: RoommateProfile;
    report: CompatibilityReport;
  } | null>(null);
  const [connectRoommate, setConnectRoommate] = useState<RoommateProfile | null>(null);

  // Fetch real profiles from DB (if configured)
  useEffect(() => {
    if (!isSupabaseConfigured) return;

    const load = async () => {
      setDbLoading(true);
      setDbError(null);
      const { profiles, error } = await fetchRoommateProfiles(user?.id ?? null, {
        city: cityFilter || undefined,
        gender: selectedGender !== 'All' ? selectedGender : undefined,
        searchQuery: searchQuery || undefined,
        pageSize: 50,
      });
      if (error) setDbError(error);
      else setDbProfiles(profiles);
      setDbLoading(false);
    };
    load();
  }, [user?.id, cityFilter, selectedGender, searchQuery]);

  // Merge DB profiles (real) + DEMO_ROOMMATES (demo fallback/supplement)
  // Real profiles from DB come first; DEMO_ROOMMATES are appended as labeled demos
  const allProfiles = useMemo((): RoommateProfile[] => {
    if (isSupabaseConfigured && !dbLoading) {
      // DB real profiles + labeled demo profiles from in-memory seed
      const demoProfiles = DEMO_ROOMMATES.map(rm => ({
        ...rm,
        demoLabel: rm.demoLabel ?? 'AI-generated demo profile'
      }));
      return [...dbProfiles, ...demoProfiles];
    }
    // No Supabase: show only labeled demo profiles
    return DEMO_ROOMMATES.map(rm => ({
      ...rm,
      demoLabel: rm.demoLabel ?? 'AI-generated demo profile'
    }));
  }, [dbProfiles, dbLoading]);

  // Compute compatibility for all profiles
  const evaluatedProfiles = useMemo(() => {
    return allProfiles.map((rm) => {
      const report = calculateCompatibility(userProfile, rm);
      return { roommate: rm, report };
    });
  }, [allProfiles, userProfile]);

  // Apply filters
  const filteredProfiles = useMemo(() => {
    let result = evaluatedProfiles.filter(({ roommate, report }) => {
      if (report.score < minScore) return false;
      if (selectedGender !== 'All' && roommate.gender !== selectedGender) return false;
      if (showVerifiedOnly && roommate.demoLabel) return false; // exclude demo profiles
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = roommate.name.toLowerCase().includes(q);
        const matchesInst = roommate.institution.toLowerCase().includes(q);
        const matchesLoc = roommate.targetLocalities.some((l) => l.toLowerCase().includes(q));
        const matchesCity = roommate.city.toLowerCase().includes(q);
        if (!matchesName && !matchesInst && !matchesLoc && !matchesCity) return false;
      }
      return true;
    });

    if (sortBy === 'score') {
      result.sort((a, b) => {
        // Real profiles before demos at same score
        if (a.roommate.demoLabel && !b.roommate.demoLabel) return 1;
        if (!a.roommate.demoLabel && b.roommate.demoLabel) return -1;
        return b.report.score - a.report.score;
      });
    } else if (sortBy === 'budget') {
      result.sort((a, b) => a.roommate.budgetMin - b.roommate.budgetMin);
    } else if (sortBy === 'age') {
      result.sort((a, b) => a.roommate.age - b.roommate.age);
    }

    return result;
  }, [evaluatedProfiles, minScore, selectedGender, searchQuery, sortBy, showVerifiedOnly]);

  const realCount = filteredProfiles.filter(p => !p.roommate.demoLabel).length;
  const demoCount = filteredProfiles.filter(p => p.roommate.demoLabel).length;

  return (
    <div className="min-h-screen bg-[#FAF8F5] dark:bg-[#0A0D14] text-slate-900 dark:text-slate-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200/80 dark:border-slate-800 pb-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-100 dark:bg-teal-950 text-teal-800 dark:text-teal-300 text-xs font-bold mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Explainable Compatibility Matching</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold font-heading text-slate-900 dark:text-white">
              Find Your Roommate
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
              Matching based on your lifestyle profile. Real profiles come first — demo profiles are clearly labeled.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Token balance */}
            {user && tokenBalance && (
              <div className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl bg-teal-50 dark:bg-teal-950/40 border border-teal-200/60 dark:border-teal-800 text-xs font-bold text-teal-700 dark:text-teal-300">
                <Coins className="w-3.5 h-3.5" />
                <span>{tokenBalance.balance} of {tokenBalance.lifetime_granted} tokens</span>
              </div>
            )}
            <Link
              to="/onboarding"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 dark:bg-slate-800 hover:bg-teal-500 dark:hover:bg-teal-400 text-white dark:text-white hover:text-slate-950 dark:hover:text-slate-950 text-xs font-bold transition-all shadow-sm"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Update Lifestyle Quiz</span>
            </Link>
          </div>
        </div>

        {/* Profile count summary */}
        <div className="flex flex-wrap items-center gap-4 text-xs">
          {realCount > 0 && (
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-teal-50 dark:bg-teal-950/40 border border-teal-200/60 dark:border-teal-800 text-teal-700 dark:text-teal-300 font-semibold">
              <ShieldCheck className="w-3.5 h-3.5" />
              {realCount} real profile{realCount !== 1 ? 's' : ''}
            </span>
          )}
          {demoCount > 0 && (
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-50 dark:bg-amber-950/40 border border-amber-200/60 dark:border-amber-800 text-amber-700 dark:text-amber-300 font-semibold">
              <Bot className="w-3.5 h-3.5" />
              {demoCount} AI-generated demo profile{demoCount !== 1 ? 's' : ''}
            </span>
          )}
          {!isSupabaseConfigured && (
            <span className="text-slate-400 dark:text-slate-500">
              ⚠️ Backend not configured — showing demo profiles only
            </span>
          )}
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
              placeholder="Search by name, college, city..."
              className="w-full text-xs pl-9 pr-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border-none text-slate-900 dark:text-white outline-none"
              id="roommate-search-input"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs">
            {/* Gender filter */}
            <div className="flex items-center gap-1">
              <span className="text-slate-400 font-semibold mr-1">Gender:</span>
              {['All', 'Male', 'Female', 'Non-binary'].map((g) => (
                <button key={g} type="button" onClick={() => setSelectedGender(g)}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                    selectedGender === g
                      ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >{g}</button>
              ))}
            </div>

            {/* Min compatibility */}
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400 font-semibold">Min Match:</span>
              <select value={minScore} onChange={(e) => setMinScore(Number(e.target.value))}
                className="bg-slate-100 dark:bg-slate-800 px-2.5 py-1.5 rounded-lg text-slate-800 dark:text-slate-200 font-bold outline-none cursor-pointer"
                id="min-match-select"
              >
                <option value={40}>All (40%+)</option>
                <option value={60}>Moderate (60%+)</option>
                <option value={75}>High (75%+)</option>
                <option value={85}>Top (85%+)</option>
              </select>
            </div>

            {/* Sort */}
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400 font-semibold">Sort:</span>
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value as 'score' | 'budget' | 'age')}
                className="bg-slate-100 dark:bg-slate-800 px-2.5 py-1.5 rounded-lg text-slate-800 dark:text-slate-200 font-bold outline-none cursor-pointer"
              >
                <option value="score">Compatibility</option>
                <option value="budget">Budget</option>
                <option value="age">Age</option>
              </select>
            </div>

            {/* Verified only toggle */}
            <label className="flex items-center gap-1.5 cursor-pointer select-none">
              <input type="checkbox" checked={showVerifiedOnly} onChange={e => setShowVerifiedOnly(e.target.checked)}
                className="accent-teal-500 w-4 h-4 rounded" />
              <span className="text-slate-600 dark:text-slate-400 font-semibold">Real profiles only</span>
            </label>
          </div>
        </div>

        {/* Loading state */}
        {dbLoading && (
          <div className="flex items-center justify-center py-10 gap-3 text-sm text-slate-500 dark:text-slate-400">
            <div className="animate-spin w-5 h-5 border-2 border-teal-500/30 border-t-teal-500 rounded-full" />
            Loading real profiles...
          </div>
        )}

        {/* DB error */}
        {dbError && (
          <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-sm flex items-center gap-2">
            <Info className="w-4 h-4 shrink-0" />
            <span>Could not load profiles from server: {dbError}. Showing demo profiles.</span>
          </div>
        )}

        {/* Roommates Grid */}
        {filteredProfiles.length === 0 ? (
          <div className="p-12 text-center rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">No profiles match current filters</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Try setting Min Match to &ldquo;All&rdquo; or clearing filters.
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

        {/* Ethics & Algorithm Banner */}
        <div className="p-4 rounded-2xl bg-teal-50/70 dark:bg-teal-950/40 border border-teal-200/80 dark:border-teal-800/60 text-xs text-teal-900 dark:text-teal-200 flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-teal-600 dark:text-teal-400 shrink-0 mt-0.5" />
          <div>
            <strong className="font-bold block">Explainable Compatibility Commitment:</strong>
            <span>
              Scores use a transparent weighted formula: Σ(CategoryScore × UserWeight) / Σ(Weights). No black-box AI.
              Demo profiles are clearly labeled <Bot className="w-3 h-3 inline mx-0.5" /> and cannot receive real connections.
              Real profiles are added by consent-giving users only.
            </span>
          </div>
        </div>

        {/* Sign-up CTA for guests */}
        {!user && (
          <div className="p-6 rounded-2xl bg-gradient-to-r from-indigo-950 to-slate-900 border border-indigo-500/20 text-white text-center space-y-3">
            <h3 className="font-bold text-lg">Ready to connect with a real roommate?</h3>
            <p className="text-sm text-indigo-200">Create an account to use your 10 free connection tokens.</p>
            <Link to="/register"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-teal-400 hover:bg-teal-300 text-slate-950 font-bold text-sm transition-all">
              <Users className="w-4 h-4" />
              <span>Get Started Free</span>
            </Link>
          </div>
        )}
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
