import React, { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Sparkles, 
  ArrowRight, 
  MapPin, 
  ShieldCheck, 
  Sliders, 
  Users, 
  CheckCircle2, 
  Star, 
  Building2, 
  Zap, 
  Heart,
  ChevronRight,
  Info
} from 'lucide-react';
import { HeroScene } from '../components/3d/HeroScene';
import { LocationSearchBar } from '../components/LocationSearchBar';
import { useAppStore } from '../store/useAppStore';
import { generateDemoListings } from '../services/listings-generator';
import { DEMO_ROOMMATES, calculateCompatibility } from '../services/compatibility';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { selectedLocation, userProfile, savedProperties, toggleSaveProperty } = useAppStore();
  const [isSearching, setIsSearching] = useState(false);
  const [budgetFilter, setBudgetFilter] = useState<number>(12000);

  // Generate listings around currently selected location
  const featuredListings = useMemo(() => {
    const list = generateDemoListings(selectedLocation.lat, selectedLocation.lng, 6);
    return list.slice(0, 4);
  }, [selectedLocation.lat, selectedLocation.lng]);

  // Compute stats dynamically from the app's real local data
  const stats = useMemo(() => {
    const all = generateDemoListings(selectedLocation.lat, selectedLocation.lng, 10);
    const avgRent = Math.round(all.reduce((acc, curr) => acc + curr.rent, 0) / all.length);
    return {
      totalPlaces: all.length * 4,
      avgRent: avgRent,
      studentMatches: DEMO_ROOMMATES.length,
      safetyChecks: '100% Demo Checked'
    };
  }, [selectedLocation.lat, selectedLocation.lng]);

  // Top roommate match preview
  const topMatches = useMemo(() => {
    return DEMO_ROOMMATES.map((rm) => ({
      roommate: rm,
      compat: calculateCompatibility(userProfile, rm)
    }))
      .sort((a, b) => b.compat.score - a.compat.score)
      .slice(0, 3);
  }, [userProfile]);

  return (
    <div className="min-h-screen bg-[#FAF8F5] dark:bg-[#0A0D14] text-slate-900 dark:text-slate-100 transition-colors">
      {/* Community Tagline Banner */}
      <div className="bg-gradient-to-r from-teal-700 to-emerald-700 text-white text-xs font-semibold py-2 px-4 text-center">
        <span>🏡 Built by students, for students — Zero brokerage. Zero middlemen. Real lifestyle matching.</span>
      </div>

      {/* Hero Section */}
      <section className="relative pt-12 pb-20 md:pt-16 md:pb-28 overflow-hidden">
        {/* Subtle background ambient blur spheres */}
        <div className="absolute top-10 left-1/4 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-40 right-10 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Column: Editorial Headline & Search */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left z-10">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-teal-100/80 dark:bg-teal-950/70 border border-teal-200 dark:border-teal-800 text-teal-800 dark:text-teal-300 text-xs font-bold tracking-wide">
                <Sparkles className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                <span>Next-Gen College Housing & Roommate Discovery</span>
              </div>

              <h1 className="font-editorial text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-[1.1]">
                Find Your Place.<br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-600 via-emerald-500 to-teal-400">
                  Find Your People.
                </span>
              </h1>

              <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-xl mx-auto lg:mx-0 font-normal leading-relaxed">
                Skip the shady broker and the nightmare flatmate lottery. Find verified rooms near <span className="font-semibold text-slate-900 dark:text-white underline decoration-teal-500">{selectedLocation.name}</span> and connect with people who actually share your sleep schedule.
              </p>

              {/* Location & Quick Search Card */}
              <div className="p-3 sm:p-4 rounded-3xl bg-white dark:bg-slate-900/90 shadow-2xl border border-slate-200/80 dark:border-slate-800 backdrop-blur-md max-w-2xl mx-auto lg:mx-0">
                <div className="mb-3">
                  <LocationSearchBar
                    onLocationSelected={() => setIsSearching((prev) => !prev)}
                  />
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                  <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                    <Sliders className="w-3.5 h-3.5 text-teal-500" />
                    <span>Max Rent: <strong className="text-slate-800 dark:text-slate-200">₹{budgetFilter.toLocaleString()}/mo</strong></span>
                  </div>
                  <input
                    type="range"
                    min="4000"
                    max="22000"
                    step="500"
                    value={budgetFilter}
                    onChange={(e) => setBudgetFilter(Number(e.target.value))}
                    className="accent-teal-500 h-1.5 w-full sm:w-44 bg-slate-200 dark:bg-slate-700 rounded-lg cursor-pointer"
                  />
                  <button
                    onClick={() => navigate('/explore')}
                    className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold transition-all shadow-md active:scale-95 whitespace-nowrap"
                  >
                    <span>Search Map</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* CTAs */}
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 pt-2">
                <Link
                  to="/explore"
                  className="px-6 py-3.5 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-sm hover:opacity-95 shadow-lg flex items-center gap-2 group transition-all"
                >
                  <Building2 className="w-4 h-4 text-teal-400 dark:text-teal-600" />
                  <span>Explore PGs & Flats</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>

                <Link
                  to="/matches"
                  className="px-6 py-3.5 rounded-2xl bg-white dark:bg-slate-800/90 text-slate-800 dark:text-white border border-slate-200 dark:border-slate-700 font-bold text-sm hover:border-teal-500 transition-all shadow-sm flex items-center gap-2"
                >
                  <Users className="w-4 h-4 text-teal-500" />
                  <span>Find My Roommate</span>
                </Link>
              </div>
            </div>

            {/* Right Column: 3D WebGL Canvas */}
            <div className="lg:col-span-5 relative">
              <div className="relative rounded-3xl p-2 bg-gradient-to-b from-teal-500/10 to-indigo-500/5 border border-slate-200/60 dark:border-slate-800 shadow-2xl backdrop-blur-sm">
                <HeroScene
                  locationName={selectedLocation.name}
                  isSearching={isSearching}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Marquee Banner of Campus Amenities */}
      <div className="border-y border-slate-200/80 dark:border-slate-800/80 bg-white/50 dark:bg-slate-900/50 py-3.5 overflow-hidden">
        <div className="animate-marquee items-center gap-8 text-xs font-semibold text-slate-500 dark:text-slate-400">
          <span>⚡ High-Speed Wi-Fi</span>
          <span>•</span>
          <span>🔒 Biometric Security</span>
          <span>•</span>
          <span>🍲 3-Times Homestyle Meals</span>
          <span>•</span>
          <span>🧹 Daily Housekeeping</span>
          <span>•</span>
          <span>❄️ AC & Power Backup</span>
          <span>•</span>
          <span>🚶 Metro-Adjacent Rooms</span>
          <span>•</span>
          <span>⚖️ Lifestyle Compatibility Match</span>
          <span>•</span>
          <span>🛡️ Scam Prevention Checklist</span>
          <span>•</span>
          <span>⚡ High-Speed Wi-Fi</span>
          <span>•</span>
          <span>🔒 Secure Entry & CCTV</span>
          <span>•</span>
          <span>🍲 Home-Style Meals Optional</span>
          <span>•</span>
          <span>🧹 Daily Housekeeping</span>
          <span>•</span>
          <span>❄️ AC & Power Backup</span>
          <span>•</span>
          <span>🤝 Zero Brokerage Always</span>
        </div>
      </div>

      {/* Dynamic Stats Row (computed from local deterministic data) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800 shadow-sm">
            <p className="text-3xl font-black text-slate-900 dark:text-white font-heading">
              {stats.totalPlaces}+
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
              Demo Rooms in radius
            </p>
          </div>
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800 shadow-sm">
            <p className="text-3xl font-black text-teal-600 dark:text-teal-400 font-heading">
              ₹{stats.avgRent.toLocaleString()}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
              Avg. Monthly Budget
            </p>
          </div>
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800 shadow-sm">
            <p className="text-3xl font-black text-slate-900 dark:text-white font-heading">
              {stats.studentMatches}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
              Seeded Roommate Profiles
            </p>
          </div>
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800 shadow-sm">
            <p className="text-3xl font-black text-emerald-500 font-heading">
              0%
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
              Brokerage / Hidden Fees
            </p>
          </div>
        </div>
      </section>

      {/* Featured Places Showcase */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-teal-600 dark:text-teal-400 uppercase tracking-wider mb-2">
              <MapPin className="w-3.5 h-3.5" />
              <span>Near {selectedLocation.name}</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold font-heading text-slate-900 dark:text-white">
              Featured Verified Places
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Listings seeded around your selected neighbourhood — distances are accurate
            </p>
          </div>

          <Link
            to="/explore"
            className="inline-flex items-center gap-1.5 text-sm font-bold text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300"
          >
            <span>View All on Interactive Map</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {featuredListings.map((prop) => {
            const isSaved = savedProperties.includes(prop.id);
            return (
              <div
                key={prop.id}
                className="group rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 flex flex-col"
              >
                {/* Image */}
                <div className="relative h-48 overflow-hidden bg-slate-200 dark:bg-slate-800">
                  <img
                    src={prop.images[0]}
                    alt={prop.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  {/* Verified Badge */}
                  <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-teal-600/90 backdrop-blur-md text-white text-[10px] font-bold tracking-wide border border-teal-400/30">
                    ✓ Verified
                  </div>
                  {/* Heart save */}
                  <button
                    onClick={() => toggleSaveProperty(prop.id)}
                    className="absolute top-3 right-3 p-2 rounded-full bg-white/90 dark:bg-slate-900/90 hover:scale-110 transition-transform shadow-md"
                  >
                    <Heart
                      className={`w-4 h-4 ${isSaved ? 'text-rose-500 fill-rose-500' : 'text-slate-500'}`}
                    />
                  </button>
                  {/* Distance badge */}
                  <div className="absolute bottom-3 left-3 px-2 py-0.5 rounded-lg bg-teal-500/95 text-slate-950 font-bold text-[11px] shadow-sm">
                    {prop.distanceKm} km away
                  </div>
                </div>

                {/* Content */}
                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1.5">
                      <span className="font-semibold text-teal-600 dark:text-teal-400">{prop.type}</span>
                      <span>•</span>
                      <span>{prop.genderPolicy}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1 text-amber-500">
                        <Star className="w-3 h-3 fill-amber-500" />
                        {prop.rating}
                      </span>
                    </div>

                    <h3 className="font-bold text-base text-slate-900 dark:text-white line-clamp-1 mb-1">
                      {prop.title}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 mb-4">
                      {prop.address}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <div>
                      <span className="text-lg font-black text-slate-900 dark:text-white">
                        ₹{prop.rent.toLocaleString()}
                      </span>
                      <span className="text-[11px] text-slate-400">/mo</span>
                    </div>

                    <Link
                      to={`/property/${prop.id}`}
                      className="px-3.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-teal-500 hover:text-slate-950 dark:hover:bg-teal-400 dark:hover:text-slate-950 text-xs font-bold transition-colors"
                    >
                      View Details
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Roommate Matching Spotlight Teaser */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="p-8 sm:p-12 rounded-3xl bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-950 text-white relative overflow-hidden border border-indigo-500/20 shadow-2xl">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-7 space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-bold">
                <Users className="w-3.5 h-3.5" />
                <span>Deterministic Compatibility Engine</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold font-heading tracking-tight leading-tight">
                Never End Up with a Nightmare Roommate Again.
              </h2>
              <p className="text-sm sm:text-base text-indigo-200/90 leading-relaxed max-w-xl">
                Our weighted algorithm compares circadian sleep schedules, chore standards, noise tolerance, and budget without bias or discriminatory proxies. Fully transparent with a &ldquo;Why This Match?&rdquo; breakdown.
              </p>
              <div className="pt-2 flex flex-wrap gap-4">
                <Link
                  to="/onboarding"
                  className="px-6 py-3 rounded-2xl bg-teal-400 hover:bg-teal-300 text-slate-950 font-bold text-sm shadow-md transition-all active:scale-95"
                >
                  Take 2-Min Lifestyle Quiz
                </Link>
                <Link
                  to="/matches"
                  className="px-6 py-3 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-sm transition-all"
                >
                  Browse 20 Seeded Profiles
                </Link>
              </div>
            </div>

            {/* Top Match Preview Cards */}
            <div className="lg:col-span-5 space-y-3">
              <div className="text-xs font-bold text-indigo-300 uppercase tracking-wider mb-1">
                Top Matches For You ({userProfile.institution})
              </div>
              {topMatches.map(({ roommate, compat }) => (
                <div
                  key={roommate.id}
                  className="p-3.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 flex items-center justify-between gap-3 hover:bg-white/15 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={roommate.avatarUrl}
                      alt={roommate.name}
                      className="w-12 h-12 rounded-xl object-cover border border-teal-400/40"
                    />
                    <div>
                      <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                        {roommate.name}
                        <span className="text-[10px] text-teal-300 bg-teal-950/60 px-1.5 py-0.5 rounded">
                          {roommate.age}y
                        </span>
                      </h4>
                      <p className="text-xs text-indigo-200 line-clamp-1">
                        {roommate.occupation} • {roommate.sleepSchedule}
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="text-lg font-black text-teal-300 font-heading">
                      {compat.score}%
                    </div>
                    <span className="text-[10px] text-indigo-200">Compatibility</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Bento-Grid Feature Layout */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-3xl font-extrabold font-heading text-slate-900 dark:text-white">
            Built by renters who got burned
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
            Every feature exists because we personally experienced the problem — bad brokers, broken leases, and mismatched flatmates.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Bento Card 1 */}
          <div className="p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-2xl bg-teal-100 dark:bg-teal-950/80 flex items-center justify-center text-teal-600 dark:text-teal-400 mb-6">
              <MapPin className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
              Overpass API Local Essentials
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Real nearby bus stands, hospitals, ATMs, and cafes queried live from OpenStreetMap to verify true commute times to campus.
            </p>
          </div>

          {/* Bento Card 2 */}
          <div className="p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-2xl bg-indigo-100 dark:bg-indigo-950/80 flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-6">
              <Zap className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
              Explainable Compatibility
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              No black-box percentages. You see precisely why someone is an 88% match: matching sleep hours, identical chore standards, and verified budget overlap.
            </p>
          </div>

          {/* Bento Card 3 */}
          <div className="p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-950/80 flex items-center justify-center text-rose-600 dark:text-rose-400 mb-6">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
              Anti-Scam Safety Center
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Interactive red-flag checklists warning you never to transfer advance tokens before physical room inspection and verification.
            </p>
          </div>
        </div>
      </section>

      {/* 3-Step How It Works Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 border-t border-slate-200/80 dark:border-slate-800/80">
        <div className="text-center max-w-xl mx-auto mb-12">
          <span className="text-xs font-bold text-teal-600 dark:text-teal-400 uppercase tracking-wider">
            Simple 3-Step Process
          </span>
          <h2 className="text-3xl font-extrabold font-heading text-slate-900 dark:text-white mt-1">
            How Roommate.com Works
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center space-y-3 p-6 rounded-2xl bg-white/60 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800">
            <div className="w-12 h-12 mx-auto rounded-full bg-teal-500 text-slate-950 font-black text-lg flex items-center justify-center">
              1
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Pick Campus Location
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Search your campus or neighbourhood — North Campus, Koramangala, Sector 62 — to centre the map and set your commute radius.
            </p>
          </div>

          <div className="text-center space-y-3 p-6 rounded-2xl bg-white/60 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800">
            <div className="w-12 h-12 mx-auto rounded-full bg-teal-500 text-slate-950 font-black text-lg flex items-center justify-center">
              2
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Answer Lifestyle Habits
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Complete the 2-minute questionnaire: night owl or early bird, cleanliness tolerance, and visitor rules.
            </p>
          </div>

          <div className="text-center space-y-3 p-6 rounded-2xl bg-white/60 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800">
            <div className="w-12 h-12 mx-auto rounded-full bg-teal-500 text-slate-950 font-black text-lg flex items-center justify-center">
              3
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Connect & Move In
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Send free inquiries to PG owners, message matched roommates, schedule a physical visit, and split your rent.
            </p>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="p-8 rounded-3xl bg-slate-100/70 dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-800">
          <div className="mb-8">
            <h2 className="text-2xl font-bold font-heading text-slate-900 dark:text-white">
              What people are saying
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Early users from our closed beta
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800">
              <div className="flex text-amber-400 mb-3">
                {'★'.repeat(5)}
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed italic mb-4">
                &ldquo;Found a twin-sharing PG within 1 km of North Campus in under 20 minutes. The distance filter and map view saved me two days of walking in the heat.&rdquo;
              </p>
              <div className="text-xs font-bold text-slate-900 dark:text-white">
                Siddharth M. • DU Economics &apos;27
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800">
              <div className="flex text-amber-400 mb-3">
                {'★'.repeat(5)}
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed italic mb-4">
                &ldquo;The compatibility engine paired me with a fellow night owl coder. We work on hackathons together and haven&apos;t argued once over quiet hours.&rdquo;
              </p>
              <div className="text-xs font-bold text-slate-900 dark:text-white">
                Tanvi S. • NSUT ECE &apos;26
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800">
              <div className="flex text-amber-400 mb-3">
                {'★'.repeat(5)}
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed italic mb-4">
                &ldquo;Zero brokerage, and the red flag checklist prevented my parents from paying advance money to an unregistered broker. Truly student-first.&rdquo;
              </p>
              <div className="text-xs font-bold text-slate-900 dark:text-white">
                Karan P. • DU North Campus
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
