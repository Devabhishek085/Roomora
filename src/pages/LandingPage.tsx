import React, { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Users,
  CheckCircle2,
  Building2,
  ChevronRight,
  Coins,
  Clock,
  BadgeCheck,
  Compass,
  Moon
} from 'lucide-react';
import { HeroScene } from '../components/3d/HeroScene';
import { useAppStore } from '../store/useAppStore';
import { useAuthStore } from '../store/useAuthStore';
import { generateDemoListings } from '../services/listings-generator';
import { calculateCompatibility } from '../services/compatibility';
import { fetchRoommateProfiles } from '../services/profiles';
import { RoommateProfileModal } from '../components/RoommateProfileModal';
import { ConnectModal } from '../components/ConnectModal';
import { UserAvatar } from '../components/UserAvatar';
import type { RoommateProfile } from '../types';

export const LandingPage: React.FC = () => {
  const { selectedLocation, userProfile } = useAppStore();
  const { user } = useAuthStore();
  const [realProfiles, setRealProfiles] = useState<RoommateProfile[]>([]);
  const [selectedRoommate, setSelectedRoommate] = useState<{ roommate: RoommateProfile; report: any } | null>(null);
  const [connectRoommate, setConnectRoommate] = useState<RoommateProfile | null>(null);

  useEffect(() => {
    let isCurrent = true;
    fetchRoommateProfiles(user?.id ?? null, { pageSize: 50 }).then(({ profiles }) => {
      if (isCurrent && profiles.length > 0) {
        setRealProfiles(profiles);
      }
    });
    return () => {
      isCurrent = false;
    };
  }, [user?.id]);

  // Top roommate match preview
  const topMatches = useMemo(() => {
    return realProfiles
      .map((rm) => ({
        roommate: rm,
        compat: calculateCompatibility(userProfile, rm)
      }))
      .sort((a, b) => b.compat.score - a.compat.score)
      .slice(0, 3);
  }, [realProfiles, userProfile]);

  // Featured listings for coliving preview
  const featuredListings = useMemo(() => {
    const list = generateDemoListings(selectedLocation.lat, selectedLocation.lng, 4);
    return list.slice(0, 3);
  }, [selectedLocation.lat, selectedLocation.lng]);

  const stats = useMemo(() => {
    return {
      registeredProfiles: realProfiles.length > 0 ? realProfiles.length : 48,
      verifiedRenters: '98%',
      avgCompatScore: '92%',
      brokerageCost: '₹0'
    };
  }, [realProfiles.length]);

  return (
    <div className="min-h-screen bg-[#FCFAF7] dark:bg-[#0B0F17] text-slate-900 dark:text-slate-100 transition-colors selection:bg-teal-500/20 selection:text-teal-900 dark:selection:text-teal-200">
      {/* Editorial Announcement Bar */}
      <div className="bg-slate-900 dark:bg-black text-slate-200 text-xs font-medium py-2.5 px-4 text-center border-b border-slate-800 flex items-center justify-center gap-2">
        <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        <span>Find your compatible flatmate, sign your lease and move on with life.</span>
      </div>

      {/* ═══════════════════════════════════════════════════
          CLEAN EDITORIAL HERO — HINGE & ZOLO MINIMALISM
          ═══════════════════════════════════════════════════ */}
      <section className="relative pt-16 pb-20 md:pt-24 md:pb-28 overflow-hidden">
        {/* Soft, warm background glows */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-gradient-to-b from-teal-500/10 via-amber-500/5 to-transparent rounded-full blur-3xl pointer-events-none -z-10" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            
            {/* Left Column: Clear Value Proposition */}
            <div className="lg:col-span-7 space-y-8 text-center lg:text-left">
              
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-stone-100 dark:bg-slate-900 border border-stone-200 dark:border-slate-800 text-stone-800 dark:text-stone-300 text-xs font-semibold tracking-wide shadow-xs">
                <Sparkles className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                <span>Compatibility-First Co-Living & Roommate Matching</span>
              </div>

              {/* Bold Editorial Headline */}
              <h1 className="font-editorial text-4xl sm:text-6xl lg:text-7xl font-normal tracking-tight text-slate-900 dark:text-white leading-[1.08]">
                Great flats are everywhere.<br />
                <span className="italic font-normal text-transparent bg-clip-text bg-gradient-to-r from-teal-600 via-emerald-600 to-teal-800 dark:from-teal-400 dark:via-emerald-300 dark:to-teal-200">
                  Great roommates
                </span>{' '}
                are matched.
              </h1>

              {/* Narrative Subhead */}
              <p className="text-lg sm:text-xl text-slate-600 dark:text-slate-300 max-w-xl mx-auto lg:mx-0 font-normal leading-relaxed">
                Roomora is built for college students and young professionals who want to skip the broker fees and the roommate horror stories. We match you by how you actually live — sleep schedules, chore standards, noise tolerance, and budget.
              </p>

              {/* Simple, Confident CTAs (No Searching Filter) */}
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
                <Link
                  to={user ? '/matches' : '/onboarding'}
                  className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-base shadow-lg hover:shadow-teal-600/20 flex items-center justify-center gap-2.5 transition-all active:scale-95 group"
                >
                  <Users className="w-5 h-5" />
                  <span>Find Your Flatmate</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>

                <Link
                  to="/explore"
                  className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-white dark:bg-slate-900 text-slate-800 dark:text-white border border-stone-200 dark:border-slate-800 font-bold text-base hover:border-teal-500 dark:hover:border-teal-500 shadow-sm transition-all flex items-center justify-center gap-2"
                >
                  <Building2 className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                  <span>Explore Coliving Flats</span>
                </Link>
              </div>

              {/* Zolo/Hinge Style Trust Row */}
              <div className="pt-4 border-t border-stone-200/70 dark:border-slate-800/80 flex flex-wrap items-center justify-center lg:justify-start gap-y-3 gap-x-6 text-xs text-slate-500 dark:text-slate-400">
                <div className="flex items-center gap-2 font-medium">
                  <BadgeCheck className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                  <span>100% Aadhaar Verified</span>
                </div>
                <div className="flex items-center gap-2 font-medium">
                  <Coins className="w-4 h-4 text-amber-500" />
                  <span>10 Free Connection Tokens</span>
                </div>
                <div className="flex items-center gap-2 font-medium">
                  
                </div>
              </div>
            </div>

            {/* Right Column: Sleek Visual Card / 3D Canvas */}
            <div className="lg:col-span-5 relative">
              <div className="relative rounded-3xl p-3 bg-white/70 dark:bg-slate-900/70 border border-stone-200/80 dark:border-slate-800 shadow-2xl backdrop-blur-md">
                
                {/* 3D Interactive WebGL Scene */}
                <div className="rounded-2xl overflow-hidden relative">
                  <HeroScene locationName={selectedLocation.name} isSearching={false} />
                </div>

                {/* Floating Hinge-style Compatibility Prompt Badge */}
                
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════
          SECTION 1: THE WEBSITE IDEA — WHY ROOMORA EXISTS
          ═══════════════════════════════════════════════════ */}
      <section className="py-20 bg-white dark:bg-slate-900/60 border-y border-stone-200/70 dark:border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-bold text-teal-600 dark:text-teal-400 uppercase tracking-widest">
              The Philosophy Behind Roomora
            </span>
            <h2 className="font-editorial text-3xl sm:text-5xl font-normal text-slate-900 dark:text-white mt-3">
              Roommate hunting shouldn&apos;t feel like Russian Roulette.
            </h2>
            <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 mt-4 leading-relaxed font-normal">
              Most people find flatmates through crowded WhatsApp groups, spammy broker posts, or blind luck. You sign a 12-month lease with a stranger, only to realize their 2 AM guitar solos or unwashed sink are driving you crazy by week two.
            </p>
          </div>

          {/* Comparison Cards: The Broken Old Way vs The Roomora Way */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
            
            {/* The Old Way */}
            <div className="p-8 sm:p-10 rounded-3xl bg-stone-50 dark:bg-slate-950/70 border border-stone-200/80 dark:border-slate-800 flex flex-col justify-between">
              <div>
                <span className="text-xs font-bold text-rose-500 uppercase tracking-wider block mb-3">
                  The Old Way
                </span>
                <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mb-6">
                  Stress, broker cuts, and mismatched habits
                </h3>
                
                <ul className="space-y-4 text-sm text-slate-600 dark:text-slate-400">
                  <li className="flex items-start gap-3">
                    <span className="text-rose-500 font-bold shrink-0">✕</span>
                    <span><strong>1 month rent lost to broker commissions</strong> with zero vetting or background checks.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-rose-500 font-bold shrink-0">✕</span>
                    <span><strong>Blind roommate pairings:</strong> You learn their sleep hours and cleanliness standards only after moving in.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-rose-500 font-bold shrink-0">✕</span>
                    <span><strong>Unverified identities:</strong> Strangers from Facebook groups asking for immediate deposit transfers.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-rose-500 font-bold shrink-0">✕</span>
                    <span><strong>Awkward living arrangements:</strong> Daily tension over dirty dishes, loud calls, and surprise overnight guests.</span>
                  </li>
                </ul>
              </div>

              <div className="mt-8 pt-6 border-t border-stone-200 dark:border-slate-800 text-xs font-medium text-slate-500">
                Result: Broken leases, lost security deposits, and stressful living.
              </div>
            </div>

            {/* The Roomora Way */}
            <div className="p-8 sm:p-10 rounded-3xl bg-teal-50/60 dark:bg-teal-950/20 border border-teal-200/70 dark:border-teal-800/40 flex flex-col justify-between relative overflow-hidden">
              <div className="absolute top-0 right-0 w-40 h-40 bg-teal-500/10 rounded-full blur-2xl pointer-events-none" />

              <div>
                <span className="text-xs font-bold text-teal-700 dark:text-teal-300 uppercase tracking-wider block mb-3">
                  The Roomora Way
                </span>
                <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mb-6">
                  Compatibility-first, verified and zero brokerage
                </h3>
                
                <ul className="space-y-4 text-sm text-slate-700 dark:text-slate-300">
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-teal-600 dark:text-teal-400 shrink-0 mt-0.5" />
                    <span><strong>100% Zero Brokerage:</strong> Connect directly with tenants and flatmates. Keep your hard-earned money.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-teal-600 dark:text-teal-400 shrink-0 mt-0.5" />
                    <span><strong>Explainable Compatibility Score:</strong> See the exact overlap in circadian rhythms, cleanliness, and guest rules.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-teal-600 dark:text-teal-400 shrink-0 mt-0.5" />
                    <span><strong>Aadhaar & Social Verification:</strong> Real profiles with authenticated photos, college/work badges.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-teal-600 dark:text-teal-400 shrink-0 mt-0.5" />
                    <span><strong>Find your fit. Feel at home:</strong> Connect with compatible roommates and build a more peaceful living experience.</span>
                  </li>
                </ul>
              </div>

              <div className="mt-8 pt-6 border-t border-teal-200/60 dark:border-teal-800/40 text-xs font-semibold text-teal-800 dark:text-teal-300">
                Result: A peaceful home, genuine friends, and drama-free living.
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* ═══════════════════════════════════════════════════
          SECTION 2: THE 4 PILLARS OF COMPATIBILITY (IDEA DEEP DIVE)
          ═══════════════════════════════════════════════════ */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <span className="text-xs font-bold text-teal-600 dark:text-teal-400 uppercase tracking-widest">
            The Science of Living Together
          </span>
          <h2 className="font-editorial text-3xl sm:text-5xl font-normal text-slate-900 dark:text-white mt-3">
            What we measure before you match.
          </h2>
          <p className="text-base text-slate-600 dark:text-slate-400 mt-3 font-normal">
            No guesswork. Our transparent matching engine evaluates the four dimensions that actually determine roommate peace.
          </p>
        </div>

        {/* 4 Pillars Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          
          {/* Pillar 1: Sleep */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-stone-200/80 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-950/60 flex items-center justify-center text-amber-600 dark:text-amber-400 mb-6">
              <Clock className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
              Circadian Rhythms
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Early birds stay with early birds; midnight coders stay with night owls. Nobody gets woken up by 6 AM blenders or 1 AM keyboard clatter.
            </p>
            <div className="mt-4 pt-4 border-t border-stone-100 dark:border-slate-800 text-[11px] font-semibold text-amber-600 dark:text-amber-400">
              Matched: Sleep & Wake Windows
            </div>
          </div>

          {/* Pillar 2: Cleanliness */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-stone-200/80 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-2xl bg-teal-100 dark:bg-teal-950/60 flex items-center justify-center text-teal-600 dark:text-teal-400 mb-6">
              <Sparkles className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
              Cleanliness Standards
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              From &ldquo;wash dishes immediately&rdquo; to &ldquo;casual weekend cleaning&rdquo; — we match people who share the exact same definition of clean.
            </p>
            <div className="mt-4 pt-4 border-t border-stone-100 dark:border-slate-800 text-[11px] font-semibold text-teal-600 dark:text-teal-400">
              Matched: Kitchen & Bathroom Chore Rhythm
            </div>
          </div>

          {/* Pillar 3: Social & Guests */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-stone-200/80 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-2xl bg-indigo-100 dark:bg-indigo-950/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-6">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
              Social Battery & Guests
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Do you treat home like a quiet sanctuary or love hosting weekend game nights? Set clear boundaries on guests and parties before you meet.
            </p>
            <div className="mt-4 pt-4 border-t border-stone-100 dark:border-slate-800 text-[11px] font-semibold text-indigo-600 dark:text-indigo-400">
              Matched: Weekend & Visitor Policy
            </div>
          </div>

          {/* Pillar 4: Budget & Commute */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-stone-200/80 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-6">
              <Coins className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
              Budget & Location
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Find partners with identical rent ceilings near your office or campus. Split utility bills without friction or hidden expenses.
            </p>
            <div className="mt-4 pt-4 border-t border-stone-100 dark:border-slate-800 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
              Matched: Exact Budget Brackets
            </div>
          </div>

        </div>
      </section>



      {/* ═══════════════════════════════════════════════════
          SECTION 4: HOW ROOMORA WORKS (3 SIMPLE STEPS)
          ═══════════════════════════════════════════════════ */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-xl mx-auto mb-16">
          <span className="text-xs font-bold text-teal-600 dark:text-teal-400 uppercase tracking-widest">
            Simple 3-Step Journey
          </span>
          <h2 className="font-editorial text-3xl sm:text-5xl font-normal text-slate-900 dark:text-white mt-3">
            How Roomora works.
          </h2>
          <p className="text-base text-slate-600 dark:text-slate-400 mt-3 font-normal">
            No credit card, no broker commissions, no endless back-and-forth.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          
          {/* Step 1 */}
          <div className="relative p-8 rounded-3xl bg-white dark:bg-slate-900 border border-stone-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between">
            <div>
              <div className="text-4xl font-editorial font-bold text-teal-600 dark:text-teal-400 mb-4">
                01
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">
                Tell Us How You Live
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-normal">
                Take a 2-minute lifestyle quiz. Tell us your sleep schedule, cleanliness preferences, work habits, and preferred locations.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-stone-100 dark:border-slate-800 text-xs font-medium text-slate-500">
              Free • Takes under 2 minutes
            </div>
          </div>

          {/* Step 2 */}
          <div className="relative p-8 rounded-3xl bg-white dark:bg-slate-900 border border-stone-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between">
            <div>
              <div className="text-4xl font-editorial font-bold text-teal-600 dark:text-teal-400 mb-4">
                02
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">
                Browse Explainable Matches
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-normal">
                See compatibility scores with transparent breakdowns. Know before you say hello whether you and your flatmate will vibe or clash.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-stone-100 dark:border-slate-800 text-xs font-medium text-slate-500">
              Transparent compatibility breakdown
            </div>
          </div>

          {/* Step 3 */}
          <div className="relative p-8 rounded-3xl bg-white dark:bg-slate-900 border border-stone-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between">
            <div>
              <div className="text-4xl font-editorial font-bold text-teal-600 dark:text-teal-400 mb-4">
                03
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">
                Connect & Move In Together
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-normal">
                Use your 10 free connection tokens to message verified roommates. Schedule physical or virtual tours, sign your lease !
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-stone-100 dark:border-slate-800 text-xs font-medium text-slate-500">
              10 free connection tokens included
            </div>
          </div>

        </div>

        <div className="mt-12 text-center">
          <Link
            to={user ? '/matches' : '/register'}
            className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-sm shadow-md transition-all active:scale-95"
          >
            <span>Start Matching Free</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════
          SECTION 5: LIVE COMPATIBILITY PREVIEWS
          ═══════════════════════════════════════════════════ */}
      <section className="py-20 bg-stone-100/60 dark:bg-slate-900/40 border-y border-stone-200/70 dark:border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-12">
            <div>
              <span className="text-xs font-bold text-teal-600 dark:text-teal-400 uppercase tracking-widest">
                Active Members
              </span>
              <h2 className="font-editorial text-3xl sm:text-4xl font-normal text-slate-900 dark:text-white mt-2">
                Real roommates looking in your area.
              </h2>
            </div>
            <Link
              to="/matches"
              className="inline-flex items-center gap-2 text-sm font-bold text-teal-600 dark:text-teal-400 hover:underline"
            >
              <span>See all active profiles</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {topMatches.map(({ roommate, compat }) => (
              <div
                key={roommate.id}
                onClick={() => setSelectedRoommate({ roommate, report: compat })}
                className="group p-6 rounded-3xl bg-white dark:bg-slate-900 border border-stone-200/80 dark:border-slate-800 shadow-sm hover:shadow-xl transition-all cursor-pointer flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <UserAvatar
                      src={roommate.avatarUrl}
                      name={roommate.name}
                      seed={roommate.id}
                      size="xl"
                      shape="rounded"
                      className="w-16 h-16 rounded-2xl border-2 border-stone-100 dark:border-slate-800 group-hover:scale-105 transition-transform"
                    />
                    <div className="text-right">
                      <div className="text-2xl font-bold font-editorial text-teal-600 dark:text-teal-400">
                        {compat.score}%
                      </div>
                      <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                        Compatibility
                      </span>
                    </div>
                  </div>

                  <h3 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
                    {roommate.name}, {roommate.age}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                    {roommate.occupation} • {roommate.city}
                  </p>

                  <div className="space-y-2 text-xs">
                    <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                      <span>Sleep Schedule:</span>
                      <strong className="text-slate-800 dark:text-slate-200">{roommate.sleepSchedule}</strong>
                    </div>
                    <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                      <span>Cleanliness:</span>
                      <strong className="text-slate-800 dark:text-slate-200">
                        {roommate.cleanliness ? `${roommate.cleanliness}/5 Cleanliness` : 'Balanced'}
                      </strong>
                    </div>
                    <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                      <span>Max Budget:</span>
                      <strong className="text-slate-800 dark:text-slate-200">₹{roommate.budgetMax?.toLocaleString()}/mo</strong>
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-stone-100 dark:border-slate-800 flex items-center justify-between text-xs font-bold text-teal-600 dark:text-teal-400">
                  <span>View Compatibility Report</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* ═══════════════════════════════════════════════════
          SECTION 6: ZOLOSTAYS-INSPIRED COLIVING HIGHLIGHTS
          ═══════════════════════════════════════════════════ */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="p-8 sm:p-14 rounded-3xl bg-slate-900 text-white relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
            <div className="lg:col-span-7 space-y-5">
              <span className="text-xs font-bold text-teal-400 uppercase tracking-widest">
                Zero Brokerage Co-Living
              </span>
              <h2 className="font-editorial text-3xl sm:text-4xl font-normal leading-tight text-white">
                Already have a flat or looking for one together?
              </h2>
              <p className="text-slate-300 text-base leading-relaxed font-normal">
                Roomora bridges the gap between verified flatmates and direct-to-owner coliving spaces. Whether you want to join an existing flat or team up with 2 compatible people to rent a 3BHK, we have you covered.
              </p>

              <div className="grid grid-cols-2 gap-4 pt-3">
                <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                  <p className="text-2xl font-bold font-editorial text-teal-300">₹0</p>
                  <p className="text-xs text-slate-400 mt-1">Brokerage on every listing</p>
                </div>
                <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                  <p className="text-2xl font-bold font-editorial text-amber-300">100%</p>
                  <p className="text-xs text-slate-400 mt-1">Direct owner & tenant connections</p>
                </div>
              </div>

              <div className="pt-4 flex flex-wrap gap-4">
                <Link
                  to="/explore"
                  className="px-6 py-3.5 rounded-2xl bg-teal-400 hover:bg-teal-300 text-slate-950 font-bold text-sm shadow-md transition-all active:scale-95"
                >
                  Explore PGs & Coliving Flats
                </Link>
                <Link
                  to="/matches"
                  className="px-6 py-3.5 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-sm transition-all"
                >
                  Find Roommates First
                </Link>
              </div>
            </div>

            {/* Coliving Preview Cards */}
            <div className="lg:col-span-5 space-y-4">
              {featuredListings.map((prop) => (
                <Link
                  key={prop.id}
                  to={`/property/${prop.id}`}
                  className="p-3.5 rounded-2xl bg-white/10 border border-white/10 flex items-center justify-between gap-4 hover:bg-white/15 transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={prop.images[0]}
                      alt={prop.title}
                      referrerPolicy="no-referrer"
                      className="w-14 h-14 rounded-xl object-cover shrink-0"
                    />
                    <div>
                      <h4 className="text-sm font-bold text-white group-hover:text-teal-300 transition-colors line-clamp-1">
                        {prop.title}
                      </h4>
                      <p className="text-xs text-slate-400 line-clamp-1">
                        {prop.address} • {prop.type}
                      </p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-sm font-bold text-teal-300">₹{prop.rent.toLocaleString()}/mo</div>
                    <span className="text-[11px] text-slate-400 group-hover:underline">View &rarr;</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════
          SECTION 7: LIVING SCENARIOS WE SOLVE (HONEST BETA FRAMING)
          ═══════════════════════════════════════════════════ */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <span className="text-xs font-bold text-teal-600 dark:text-teal-400 uppercase tracking-widest">
            Real-Life Living Scenarios
          </span>
          <h2 className="font-editorial text-3xl sm:text-5xl font-normal text-slate-900 dark:text-white mt-3">
            Built for how young India moves and lives.
          </h2>
          <p className="text-base text-slate-600 dark:text-slate-400 mt-3 font-normal">
            Roomora is engineered to solve the exact roommate frictions college students and young professionals encounter every day.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              icon: <Compass className="w-5 h-5 text-teal-600 dark:text-teal-400" />,
              scenario: 'Moving to a New City',
              tag: 'Out-of-State Relocation',
              title: 'Knowing zero people in a new metro',
              pain: 'Relocating to Gurugram, Bengaluru, or Delhi without a network forces you into blind flatmate pairings and paying 1-month broker fees.',
              solution: 'Connect with verified college peers or young professionals 2–4 weeks before moving. Tour flats together and split the deposit directly with zero brokerage.',
              badge: 'Pre-Move Matching'
            },
            {
              icon: <Moon className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />,
              scenario: 'Circadian Clash',
              tag: 'Night Owl vs Early Bird',
              title: 'Midnight coder vs 6 AM morning alarms',
              pain: 'Getting paired with someone whose blender wakes you up at 6:30 AM while you only went to bed at 3:00 AM after debugging code.',
              solution: 'Our matching algorithm aligns sleep and wake windows. Night owls room with night owls, and early risers room with early risers. Quiet hours respected from day one.',
              badge: 'Sleep Window Harmony'
            },
            {
              icon: <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />,
              scenario: 'Safety & Trust',
              tag: 'Zero Anonymous Bots',
              title: 'No creepy DMs or deposit scammers',
              pain: 'Browsing random Facebook groups where users hide behind fake avatars, ask for advance token transfers, or spam your personal phone number.',
              solution: '100% Aadhaar-verified profiles with institution checks. Use free in-app connection tokens to chat securely before ever sharing personal contact info.',
              badge: 'Aadhaar & In-App Chat'
            },
          ].map(({ icon, scenario, tag, title, pain, solution, badge }) => (
            <div
              key={title}
              className="p-8 rounded-3xl bg-white dark:bg-slate-900 border border-stone-200/80 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-stone-100 dark:bg-slate-800 flex items-center justify-center">
                      {icon}
                    </div>
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      {scenario}
                    </span>
                  </div>
                  <span className="text-[10px] font-bold text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/60 px-2.5 py-0.5 rounded-full border border-teal-200/50 dark:border-teal-800/40">
                    {badge}
                  </span>
                </div>

                <h3 className="font-editorial text-xl font-normal text-slate-900 dark:text-white leading-snug">
                  {title}
                </h3>

                <div className="p-3.5 rounded-2xl bg-rose-50/70 dark:bg-rose-950/20 border border-rose-200/60 dark:border-rose-900/30 text-xs text-rose-900 dark:text-rose-300 leading-relaxed">
                  <strong className="font-semibold block mb-1">The Friction:</strong>
                  {pain}
                </div>

                <div className="p-3.5 rounded-2xl bg-teal-50/70 dark:bg-teal-950/20 border border-teal-200/60 dark:border-teal-900/30 text-xs text-teal-900 dark:text-teal-300 leading-relaxed">
                  <strong className="font-semibold block mb-1 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                    How Roomora Solves It:
                  </strong>
                  {solution}
                </div>
              </div>

              <div className="pt-5 border-t border-stone-100 dark:border-slate-800 mt-6 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                <span>Core Pillar: {tag}</span>
                <Link to="/matches" className="text-teal-600 dark:text-teal-400 font-bold hover:underline flex items-center gap-1">
                  <span>Match Now</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════
          SECTION 8: MINIMAL, HIGH-CONVERTING FINAL CTA
          ═══════════════════════════════════════════════════ */}
      <section className="py-20 border-t border-stone-200/70 dark:border-slate-800/80">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800 text-teal-800 dark:text-teal-300 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
            <span>Ready for peaceful co-living?</span>
          </div>

          <h2 className="font-editorial text-4xl sm:text-6xl font-normal text-slate-900 dark:text-white leading-tight">
            Find your match today.<br />
            Shift tomorrow.
          </h2>

          <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-xl mx-auto font-normal">
            Take our 2-minute lifestyle quiz and claim your 10 free connection tokens. No credit card required.
          </p>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to={user ? '/matches' : '/register'}
              className="w-full sm:w-auto px-9 py-4 rounded-2xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-base shadow-xl hover:shadow-teal-600/25 transition-all active:scale-95 flex items-center justify-center gap-2 group"
            >
              <span>Get Started Free</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>

            <Link
              to="/explore"
              className="w-full sm:w-auto px-9 py-4 rounded-2xl bg-white dark:bg-slate-900 text-slate-800 dark:text-white border border-stone-200 dark:border-slate-800 font-bold text-base hover:border-teal-500 transition-all shadow-xs"
            >
              Browse Listings
            </Link>
          </div>

          <p className="text-xs text-slate-500 dark:text-slate-400 pt-2">
            Free forever for basic profiles • 10 free connection tokens on sign up
          </p>
        </div>
      </section>

      {/* Roommate Profile & Room Photos Pop-up Modal */}
      {selectedRoommate && (
        <RoommateProfileModal
          roommate={selectedRoommate.roommate}
          report={selectedRoommate.report}
          onClose={() => setSelectedRoommate(null)}
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
