import React, { useState, useMemo, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Users,
  Sparkles,
  SlidersHorizontal,
  ShieldCheck,
  Search,
  Bot,
  Coins,
  Info,
  MapPin,
  ArrowUpDown,
  RotateCcw
} from 'lucide-react';
import { LocationSearchBar } from '../components/LocationSearchBar';
import { useAppStore } from '../store/useAppStore';
import { useAuthStore } from '../store/useAuthStore';
import { calculateCompatibility } from '../services/compatibility';
import { fetchRoommateProfiles } from '../services/profiles';
import { RoommateCard } from '../components/RoommateCard';
import { RoommateProfileModal } from '../components/RoommateProfileModal';
import { ConnectModal } from '../components/ConnectModal';
import { isSupabaseConfigured } from '../lib/supabase';
import type { RoommateProfile, CompatibilityReport } from '../types';

const MATCH_CITY_PILLS = [
  { id: '', label: 'All Cities' },
  { id: 'Delhi', label: 'Delhi NCR' },
  { id: 'Bengaluru', label: 'Bengaluru' },
  { id: 'Mumbai', label: 'Mumbai' },
  { id: 'Pune', label: 'Pune' },
  { id: 'Hyderabad', label: 'Hyderabad' }
];

export const MatchesPage: React.FC = () => {
  const { userProfile, selectedLocation } = useAppStore();
  const { user, tokenBalance } = useAuthStore();
  const [searchParams, setSearchParams] = useSearchParams();

  const [minScore, setMinScore] = useState<number>(40);
  const [selectedGender, setSelectedGender] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>(searchParams.get('search') || '');
  const [sortBy, setSortBy] = useState<'score' | 'budget_asc' | 'budget_desc' | 'age'>('score');
  const [cityFilter, setCityFilter] = useState<string>(searchParams.get('city') || '');
  const [maxBudget, setMaxBudget] = useState<number>(20000);

  useEffect(() => {
    const urlCity = searchParams.get('city');
    if (urlCity !== null && urlCity !== cityFilter) {
      setCityFilter(urlCity);
    }
    const urlSearch = searchParams.get('search');
    if (urlSearch !== null && urlSearch !== searchQuery) {
      setSearchQuery(urlSearch);
    }
  }, [searchParams]);

  const handleResetFilters = () => {
    setMaxBudget(20000);
    setSortBy('score');
    setMinScore(40);
    setSelectedGender('All');
    setSearchQuery('');
    setCityFilter('');
    const next = new URLSearchParams(searchParams);
    next.delete('city');
    next.delete('search');
    setSearchParams(next);
  };

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
        pageSize: 100,
      });
      if (error) setDbError(error);
      else setDbProfiles(profiles);
      setDbLoading(false);
    };
    load();
  }, [user?.id]);

  // Only real registered profiles created with email IDs
  const allProfiles = useMemo((): RoommateProfile[] => {
    return dbProfiles;
  }, [dbProfiles]);

  // Compute compatibility for all profiles
  const evaluatedProfiles = useMemo(() => {
    return allProfiles.map((rm) => {
      const report = calculateCompatibility(userProfile, rm);
      return { roommate: rm, report };
    });
  }, [allProfiles, userProfile]);

  // Apply filters (location, budget, radius, gender, score, search)
  const filteredProfiles = useMemo(() => {
    const locCity = (selectedLocation.city || '').toLowerCase().trim();
    const locName = (selectedLocation.name || '').toLowerCase().trim();
    const activeCity = (cityFilter || '').toLowerCase().trim();

    let result = evaluatedProfiles.filter(({ roommate, report }) => {
      // 1. Min compatibility score
      if (report.score < minScore) return false;

      // 2. Gender filter
      if (selectedGender !== 'All' && roommate.gender !== selectedGender) return false;

      // 3. Max Budget filter (roommate's budgetMin must be within maxBudget)
      if (roommate.budgetMin > maxBudget) return false;

      // 4. City pill filter (if specified)
      if (activeCity) {
        const rmCity = (roommate.city || '').toLowerCase();
        if (!rmCity.includes(activeCity) && !activeCity.includes(rmCity)) {
          return false;
        }
      } else if (locCity || locName) {
        // 5. Selected location filter from LocationSearchBar
        const rmCity = (roommate.city || '').toLowerCase();
        const matchesCity = rmCity && (locCity.includes(rmCity) || locName.includes(rmCity) || rmCity.includes(locCity));
        const matchesLocality = roommate.targetLocalities?.some((loc) => {
          const l = loc.toLowerCase();
          return locName.includes(l) || l.includes(locName) || (locCity && (locCity.includes(l) || l.includes(locCity)));
        });
        if (!matchesCity && !matchesLocality && locCity !== '') {
          return false;
        }
      }

      // 6. Text search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = roommate.name.toLowerCase().includes(q);
        const matchesInst = roommate.institution.toLowerCase().includes(q);
        const matchesLoc = roommate.targetLocalities.some((l) => l.toLowerCase().includes(q));
        const matchesCity = roommate.city.toLowerCase().includes(q);
        if (!matchesName && !matchesInst && !matchesLoc && !matchesCity) return false;
      }

      return true;
    });

    // Sort
    result.sort((a, b) => {
      if (sortBy === 'score') return b.report.score - a.report.score;
      if (sortBy === 'budget_asc') return a.roommate.budgetMin - b.roommate.budgetMin;
      if (sortBy === 'budget_desc') return b.roommate.budgetMax - a.roommate.budgetMax;
      if (sortBy === 'age') return a.roommate.age - b.roommate.age;
      return b.report.score - a.report.score;
    });

    return result;
  }, [evaluatedProfiles, minScore, selectedGender, maxBudget, cityFilter, selectedLocation, searchQuery, sortBy]);

  return (
    <div className="min-h-screen bg-[#FAF8F5] dark:bg-[#0A0D14] text-slate-900 dark:text-slate-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-[1600px] mx-auto space-y-6">
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
              Matching based on your lifestyle profile. Showing genuine registered roommates.
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

        {/* Location Search Bar with Clear & GPS Near Me */}
        <div className="w-full">
          <LocationSearchBar compact />
        </div>

        {/* Filter Box with Search Radius, Max Budget, Found count, Reset, and Sort */}
        <div className="bg-white dark:bg-[#0B101B] border border-slate-200/80 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-sm space-y-5">
          {/* Top Header */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800/80 pb-3">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-teal-600 dark:text-teal-400" />
              <span className="font-bold text-sm text-slate-900 dark:text-white">
                Filter Verified Roommates
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-teal-100 dark:bg-teal-950/80 border border-teal-500/30 text-teal-700 dark:text-teal-300 text-xs font-black">
                {filteredProfiles.length} Found
              </span>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleResetFilters}
                className="text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset Filters</span>
              </button>

              {/* Sort Dropdown */}
              <div className="flex items-center gap-1.5 text-xs">
                <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="bg-slate-100 dark:bg-slate-800/90 border-none rounded-xl px-2.5 py-1.5 text-slate-800 dark:text-slate-200 font-semibold outline-none cursor-pointer"
                >
                  <option value="score">Compatibility: Top Match</option>
                  <option value="budget_asc">Rent: Low to High</option>
                  <option value="budget_desc">Rent: High to Low</option>
                  <option value="age">Age: Youngest First</option>
                </select>
              </div>
            </div>
          </div>

          {/* Max Budget Slider Card */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/70 border border-slate-100 dark:border-slate-800/80">
            <div className="flex justify-between items-center text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
              <span>Max Budget</span>
              <span className="text-teal-600 dark:text-teal-400 font-black">₹{maxBudget.toLocaleString()}/mo</span>
            </div>
            <input
              type="range"
              min="5000"
              max="26000"
              step="500"
              value={maxBudget}
              onChange={(e) => setMaxBudget(Number(e.target.value))}
              className="w-full accent-teal-500 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400 mt-1 font-medium">
              <span>₹5,000</span>
              <span>₹15,000</span>
              <span>₹26,000</span>
            </div>
          </div>

          {/* Quick City Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-100 dark:border-slate-800/80 text-xs">
            <span className="font-semibold text-slate-400 mr-1 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-teal-500" /> Quick City:
            </span>
            {MATCH_CITY_PILLS.map((c) => {
              const isActive = (cityFilter.toLowerCase() === c.id.toLowerCase());
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => {
                    setCityFilter(c.id);
                    const next = new URLSearchParams(searchParams);
                    if (c.id) next.set('city', c.id);
                    else next.delete('city');
                    setSearchParams(next);
                  }}
                  className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
                    isActive
                      ? 'bg-slate-900 dark:bg-teal-400 text-white dark:text-slate-950 shadow-sm'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {c.label}
                </button>
              );
            })}
          </div>

          {/* Secondary Controls: Search input, Gender, Min Match */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800/80">
            {/* Search box */}
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name, college, locality..."
                className="w-full text-xs pl-9 pr-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800/90 border-none text-slate-900 dark:text-white outline-none"
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
                        ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-sm'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >{g}</button>
                ))}
              </div>

              {/* Min compatibility */}
              <div className="flex items-center gap-1.5">
                <span className="text-slate-400 font-semibold">Min Match:</span>
                <select value={minScore} onChange={(e) => setMinScore(Number(e.target.value))}
                  className="bg-slate-100 dark:bg-slate-800/90 px-2.5 py-1.5 rounded-lg text-slate-800 dark:text-slate-200 font-bold outline-none cursor-pointer"
                  id="min-match-select"
                >
                  <option value={40}>All (40%+)</option>
                  <option value={60}>Moderate (60%+)</option>
                  <option value={75}>High (75%+)</option>
                  <option value={85}>Top (85%+)</option>
                </select>
              </div>
            </div>
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
            <span>Could not load profiles from server: {dbError}</span>
          </div>
        )}

        {/* Roommates Grid */}
        {filteredProfiles.length === 0 ? (
          <div className="p-12 text-center rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 max-w-lg mx-auto">
            <div className="w-12 h-12 mx-auto rounded-2xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center">
              <MapPin className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              No roommates match current location or budget filters
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Try increasing your Max Budget, setting Min Match to &ldquo;All&rdquo;, or resetting filters to view all verified roommates.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <button
                onClick={handleResetFilters}
                className="px-4 py-2 rounded-xl bg-teal-500 text-slate-950 font-bold text-xs hover:bg-teal-400 transition-colors"
              >
                Reset Filters
              </button>
              <Link
                to="/onboarding"
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              >
                Complete Quiz &amp; Register
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProfiles.map(({ roommate, report }) => (
              <RoommateCard
                key={roommate.id}
                roommate={roommate}
                report={report}
                onViewProfile={(rm, rep) => setInspectRoommate({ roommate: rm, report: rep })}
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
              Scores use a transparent weighted formula: Σ(CategoryScore × UserWeight) / Σ(Weights).
              Only registered user profiles are displayed — synthetic AI profiles and unverified accounts without details are excluded.
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

      {/* Roommate Profile & Room Photos Pop-up Modal */}
      {inspectRoommate && (
        <RoommateProfileModal
          roommate={inspectRoommate.roommate}
          report={inspectRoommate.report}
          onClose={() => setInspectRoommate(null)}
          onConnect={(rm) => setConnectRoommate(rm)}
        />
      )}

      {/* Connect Modal */}
      {connectRoommate && (
        <ConnectModal
          roommate={connectRoommate}
          onClose={() => setConnectRoommate(null)}
        />
      )}
    </div>
  );
};
