import React, { useState, useMemo, useEffect } from 'react';
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
  Coins,
  Bot,
  Search
} from 'lucide-react';
import { HeroScene } from '../components/3d/HeroScene';
import { LocationSearchBar } from '../components/LocationSearchBar';
import { useAppStore } from '../store/useAppStore';
import { useAuthStore } from '../store/useAuthStore';
import { generateDemoListings } from '../services/listings-generator';
import { calculateCompatibility } from '../services/compatibility';
import { fetchRoommateProfiles } from '../services/profiles';
import { RoommateProfileModal } from '../components/RoommateProfileModal';
import { ConnectModal } from '../components/ConnectModal';
import type { RoommateProfile } from '../types';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { selectedLocation, userProfile, savedProperties, toggleSaveProperty } = useAppStore();
  const { user, tokenBalance } = useAuthStore();
  const [isSearching, setIsSearching] = useState(false);
  const [budgetFilter, setBudgetFilter] = useState<number>(12000);
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

  // Top roommate match preview (roommate-first hero section)
  const topMatches = useMemo(() => {
    return realProfiles.map((rm) => ({
      roommate: rm,
      compat: calculateCompatibility(userProfile, rm)
    }))
      .sort((a, b) => b.compat.score - a.compat.score)
      .slice(0, 3);
  }, [realProfiles, userProfile]);


  // Generate listings around currently selected location (secondary section)
  const featuredListings = useMemo(() => {
    const list = generateDemoListings(selectedLocation.lat, selectedLocation.lng, 6);
    return list.slice(0, 4);
  }, [selectedLocation.lat, selectedLocation.lng]);

  const stats = useMemo(() => {
    const all = generateDemoListings(selectedLocation.lat, selectedLocation.lng, 10);
    const avgRent = Math.round(all.reduce((acc, curr) => acc + curr.rent, 0) / all.length);
    return {
      totalPlaces: all.length * 4,
      avgRent,
      registeredProfiles: realProfiles.length,
    };
  }, [selectedLocation.lat, selectedLocation.lng, realProfiles.length]);

  return (
    <div className="min-h-screen bg-[#FAF8F5] dark:bg-[#0A0D14] text-slate-900 dark:text-slate-100 transition-colors">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-teal-700 to-emerald-700 text-white text-xs font-semibold py-2 px-4 text-center">
        <span>🏡 Roomora — Find a roommate you'll actually like. Compatibility-first, zero brokerage.</span>
      </div>

      {/* ═══════════════════════════════════════════════════
          HERO — ROOMMATE MATCHING IS THE PRIMARY FOCUS
          ═══════════════════════════════════════════════════ */}
      <section className="relative pt-12 pb-20 md:pt-16 md:pb-28 overflow-hidden">
        <div className="absolute top-10 left-1/4 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-40 right-10 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left: Headline + Roommate Search */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left z-10">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-teal-100/80 dark:bg-teal-950/70 border border-teal-200 dark:border-teal-800 text-teal-800 dark:text-teal-300 text-xs font-bold tracking-wide">
                <Sparkles className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                <span>Compatibility-First Roommate Matching</span>
              </div>

              <h1 className="font-editorial text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-[1.1]">
                Find a Roommate<br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-600 via-emerald-500 to-teal-400">
                  You'll Actually Like.
                </span>
              </h1>

              <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-xl mx-auto lg:mx-0 font-normal leading-relaxed">
                Our compatibility engine matches you on sleep schedule, cleanliness, noise tolerance and budget — not just location. Find your perfect flatmate near <span className="font-semibold text-slate-900 dark:text-white underline decoration-teal-500">{selectedLocation.name}</span>.
              </p>

              {/* Roommate Search Card */}
              <div className="p-3 sm:p-4 rounded-3xl bg-white dark:bg-slate-900/90 shadow-2xl border border-slate-200/80 dark:border-slate-800 backdrop-blur-md max-w-2xl mx-auto lg:mx-0">
                <div className="mb-3">
                  <LocationSearchBar onLocationSelected={() => setIsSearching((prev) => !prev)} />
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                  <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                    <Sliders className="w-3.5 h-3.5 text-teal-500" />
                    <span>Max Budget: <strong className="text-slate-800 dark:text-slate-200">₹{budgetFilter.toLocaleString()}/mo</strong></span>
                  </div>
                  <input
                    type="range" min="4000" max="30000" step="500"
                    value={budgetFilter}
                    onChange={(e) => setBudgetFilter(Number(e.target.value))}
                    className="accent-teal-500 h-1.5 w-full sm:w-44 bg-slate-200 dark:bg-slate-700 rounded-lg cursor-pointer"
                  />
                  <button
                    onClick={() => navigate('/matches')}
                    className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold transition-all shadow-md active:scale-95 whitespace-nowrap"
                  >
                    <Users className="w-3.5 h-3.5" />
                    <span>Find Roommates</span>
                  </button>
                </div>
              </div>

              {/* Primary + Secondary CTAs */}
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 pt-2">
                <Link
                  to="/matches"
                  className="px-6 py-3.5 rounded-2xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-sm shadow-lg flex items-center gap-2 group transition-all active:scale-95"
                >
                  <Users className="w-4 h-4" />
                  <span>Find My Roommate</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>

                <Link
                  to="/explore"
                  className="px-6 py-3.5 rounded-2xl bg-white dark:bg-slate-800/90 text-slate-800 dark:text-white border border-slate-200 dark:border-slate-700 font-bold text-sm hover:border-teal-500 transition-all shadow-sm flex items-center gap-2"
                >
                  <Building2 className="w-4 h-4 text-teal-500" />
                  <span>Browse PGs & Flats</span>
                </Link>
              </div>

              {/* Token info for guests */}
              {!user && (
                <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                  <Coins className="w-4 h-4 text-teal-500" />
                  <span>New accounts get <strong className="text-teal-600 dark:text-teal-400">10 free connection tokens</strong> — no credit card required</span>
                </div>
              )}
              {user && tokenBalance && (
                <div className="flex items-center gap-2 text-xs text-teal-600 dark:text-teal-400 font-semibold">
                  <Coins className="w-4 h-4" />
                  <span>{tokenBalance.balance} of {tokenBalance.lifetime_granted} free connections remaining</span>
                </div>
              )}
            </div>

            {/* Right: 3D WebGL Canvas */}
            <div className="lg:col-span-5 relative">
              <div className="relative rounded-3xl p-2 bg-gradient-to-b from-teal-500/10 to-indigo-500/5 border border-slate-200/60 dark:border-slate-800 shadow-2xl backdrop-blur-sm">
                <HeroScene locationName={selectedLocation.name} isSearching={isSearching} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════
          ROOMMATE MATCH PREVIEW — PRIMARY CONTENT SECTION
          ═══════════════════════════════════════════════════ */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="p-8 sm:p-12 rounded-3xl bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-950 text-white relative overflow-hidden border border-indigo-500/20 shadow-2xl">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-7 space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-bold">
                <Users className="w-3.5 h-3.5" />
                <span>Explainable Compatibility Engine</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold font-heading tracking-tight leading-tight">
                Never End Up with a Nightmare Roommate Again.
              </h2>
              <p className="text-sm sm:text-base text-indigo-200/90 leading-relaxed max-w-xl">
                Our weighted algorithm compares circadian sleep schedules, chore standards, noise tolerance, and budget. Fully transparent — see exactly <em>why</em> someone is a 92% match.
              </p>
              <div className="pt-2 flex flex-wrap gap-4">
                <Link to={user ? '/matches' : '/register'}
                  className="px-6 py-3 rounded-2xl bg-teal-400 hover:bg-teal-300 text-slate-950 font-bold text-sm shadow-md transition-all active:scale-95">
                  {user ? 'Browse All Roommates' : 'Get Started Free'}
                </Link>
                <Link to="/onboarding"
                  className="px-6 py-3 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-sm transition-all">
                  Take Lifestyle Quiz
                </Link>
              </div>
            </div>

            {/* Top Match Preview Cards */}
            <div className="lg:col-span-5 space-y-3">
              <div className="text-xs font-bold text-indigo-300 uppercase tracking-wider mb-1">
                Top Roommate Matches
              </div>
              {topMatches.length === 0 ? (
                <div className="p-6 rounded-2xl bg-white/5 border border-white/10 text-center text-xs text-indigo-200">
                  Join Roomora and complete your quiz to see your top compatibility matches!
                </div>
              ) : (
                topMatches.map(({ roommate, compat }) => (
                  <div key={roommate.id}
                    onClick={() => setSelectedRoommate({ roommate, report: compat })}
                    className="p-3.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 flex items-center justify-between gap-3 hover:bg-white/15 transition-all cursor-pointer group"
                    title="Click to view roommate profile and room photos">
                    <div className="flex items-center gap-3">
                      <img src={roommate.avatarUrl} alt={roommate.name}
                        className="w-12 h-12 rounded-xl object-cover border border-teal-400/40 shrink-0" />
                      <div>
                        <h4 className="text-sm font-bold text-white flex items-center gap-1.5 group-hover:text-teal-300 transition-colors">
                          {roommate.name}
                          <span className="text-[10px] text-teal-300 bg-teal-950/60 px-1.5 py-0.5 rounded">{roommate.age}y</span>
                          {roommate.flatImages && roommate.flatImages.length > 0 && (
                            <span className="text-[10px] text-teal-300 bg-teal-900/60 px-1.5 py-0.5 rounded font-bold">
                              {roommate.flatImages.length} photos
                            </span>
                          )}
                        </h4>
                        <p className="text-xs text-indigo-200 line-clamp-1">{roommate.occupation} • {roommate.sleepSchedule}</p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-lg font-black text-teal-300 font-heading">{compat.score}%</div>
                      <span className="text-[10px] text-indigo-200 group-hover:underline">View &rarr;</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Marquee Banner */}
      <div className="border-y border-slate-200/80 dark:border-slate-800/80 bg-white/50 dark:bg-slate-900/50 py-3.5 overflow-hidden">
        <div className="animate-marquee items-center gap-8 text-xs font-semibold text-slate-500 dark:text-slate-400">
          <span>🤝 Zero Brokerage</span><span>•</span>
          <span>⚡ Compatibility Scoring</span><span>•</span>
          <span>🔒 Secure Messaging</span><span>•</span>
          <span>🛡️ Anti-Scam Safety Center</span><span>•</span>
          <span>🏡 Real-Time Room Search</span><span>•</span>
          <span>🎯 Lifestyle Matching</span><span>•</span>
          <span>📍 Metro-Adjacent Rooms</span><span>•</span>
          <span>🤝 10 Free Connections</span><span>•</span>
          <span>⚡ High-Speed Wi-Fi</span><span>•</span>
          <span>🔒 Biometric Security</span>
        </div>
      </div>

      {/* Stats Row */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800 shadow-sm">
            <p className="text-3xl font-black text-teal-600 dark:text-teal-400 font-heading">10</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">Free Connection Tokens</p>
          </div>
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800 shadow-sm">
            <p className="text-3xl font-black text-slate-900 dark:text-white font-heading">{stats.registeredProfiles}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">Registered Roommates</p>
          </div>
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800 shadow-sm">
            <p className="text-3xl font-black text-slate-900 dark:text-white font-heading">₹{stats.avgRent.toLocaleString()}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">Avg. Local Budget</p>
          </div>
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800 shadow-sm">
            <p className="text-3xl font-black text-emerald-500 font-heading">0%</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">Brokerage / Hidden Fees</p>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 border-t border-slate-200/80 dark:border-slate-800/80">
        <div className="text-center max-w-xl mx-auto mb-12">
          <span className="text-xs font-bold text-teal-600 dark:text-teal-400 uppercase tracking-wider">Simple 3-Step Process</span>
          <h2 className="text-3xl font-extrabold font-heading text-slate-900 dark:text-white mt-1">How Roomora Works</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { n: '1', title: 'Create Your Profile', desc: 'Answer 2-minute lifestyle quiz — sleep schedule, budget, chore habits. Completely free, no card required.' },
            { n: '2', title: 'Browse Compatible Matches', desc: 'See compatibility scores with transparent explanations. Filter by city, budget, lifestyle, and move-in date.' },
            { n: '3', title: 'Connect & Move In', desc: 'Use 1 free token to connect. Message your match for free. Schedule visits and sign a lease together.' },
          ].map(({ n, title, desc }) => (
            <div key={n} className="text-center space-y-3 p-6 rounded-2xl bg-white/60 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800">
              <div className="w-12 h-12 mx-auto rounded-full bg-teal-500 text-slate-950 font-black text-lg flex items-center justify-center">{n}</div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">{title}</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Feature Bento */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-3xl font-extrabold font-heading text-slate-900 dark:text-white">Built by renters who got burned</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">Every feature exists because we experienced the problem — bad brokers, broken leases, mismatched flatmates.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { icon: <Users className="w-6 h-6" />, color: 'teal', title: 'Compatibility Matching', desc: 'No black-box AI. See precisely why someone is an 88% match: matching sleep hours, identical chore standards, verified budget overlap.' },
            { icon: <Zap className="w-6 h-6" />, color: 'indigo', title: 'Token-Based Connections', desc: '10 free connections. Every token = one new roommate relationship. Messages within connections are always free.' },
            { icon: <ShieldCheck className="w-6 h-6" />, color: 'rose', title: 'Safety Center', desc: 'Anti-scam checklists, block/report tools, and Aadhaar identity verification to keep the community trustworthy.' },
          ].map(({ icon, color, title, desc }) => (
            <div key={title} className="p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
              <div className={`w-12 h-12 rounded-2xl bg-${color}-100 dark:bg-${color}-950/80 flex items-center justify-center text-${color}-600 dark:text-${color}-400 mb-6`}>{icon}</div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">{title}</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════
          SECONDARY SECTION: PG & FLAT DISCOVERY
          ═══════════════════════════════════════════════════ */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 border-t border-slate-200/80 dark:border-slate-800/80">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-teal-600 dark:text-teal-400 uppercase tracking-wider mb-2">
              <MapPin className="w-3.5 h-3.5" />
              <span>Near {selectedLocation.name} — Demo Listings</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold font-heading text-slate-900 dark:text-white">PGs & Flats in Your Area</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Demo listings seeded around your location — accurate distances via Haversine formula</p>
          </div>
          <Link to="/explore" className="inline-flex items-center gap-1.5 text-sm font-bold text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300">
            <span>Interactive Map View</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {featuredListings.map((prop) => {
            const isSaved = savedProperties.includes(prop.id);
            return (
              <div key={prop.id} className="group rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 flex flex-col">
                <div className="relative h-48 overflow-hidden bg-slate-200 dark:bg-slate-800">
                  <img src={prop.images[0]} alt={prop.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-teal-600/90 backdrop-blur-md text-white text-[10px] font-bold tracking-wide border border-teal-400/30">✓ Demo Listing</div>
                  <button onClick={() => toggleSaveProperty(prop.id)} className="absolute top-3 right-3 p-2 rounded-full bg-white/90 dark:bg-slate-900/90 hover:scale-110 transition-transform shadow-md">
                    <Heart className={`w-4 h-4 ${isSaved ? 'text-rose-500 fill-rose-500' : 'text-slate-500'}`} />
                  </button>
                  <div className="absolute bottom-3 left-3 px-2 py-0.5 rounded-lg bg-teal-500/95 text-slate-950 font-bold text-[11px] shadow-sm">{prop.distanceKm} km away</div>
                </div>
                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1.5">
                      <span className="font-semibold text-teal-600 dark:text-teal-400">{prop.type}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1 text-amber-500"><Star className="w-3 h-3 fill-amber-500" />{prop.rating}</span>
                    </div>
                    <h3 className="font-bold text-base text-slate-900 dark:text-white line-clamp-1 mb-1">{prop.title}</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 mb-4">{prop.address}</p>
                  </div>
                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <div>
                      <span className="text-lg font-black text-slate-900 dark:text-white">₹{prop.rent.toLocaleString()}</span>
                      <span className="text-[11px] text-slate-400">/mo</span>
                    </div>
                    <Link to={`/property/${prop.id}`} className="px-3.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-teal-500 hover:text-slate-950 dark:hover:bg-teal-400 dark:hover:text-slate-950 text-xs font-bold transition-colors">View</Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Testimonials */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="p-8 rounded-3xl bg-slate-100/70 dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-800">
          <div className="mb-8">
            <h2 className="text-2xl font-bold font-heading text-slate-900 dark:text-white">What people are saying</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Early users from our closed beta — illustrative testimonials</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { quote: 'Found a twin-sharing PG within 1 km of North Campus in under 20 minutes. The compatibility score saved me from a terrible match.', author: 'Siddharth M. • DU Economics \'27' },
              { quote: 'The compatibility engine paired me with a fellow night owl coder. We work on hackathons together and haven\'t argued once over quiet hours.', author: 'Tanvi S. • NSUT ECE \'26' },
              { quote: 'Zero brokerage, and the safety checklist prevented my parents from paying advance money to an unregistered broker.', author: 'Karan P. • DU North Campus' },
            ].map(({ quote, author }) => (
              <div key={author} className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800">
                <div className="flex text-amber-400 mb-3">{'★'.repeat(5)}</div>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed italic mb-4">&ldquo;{quote}&rdquo;</p>
                <div className="text-xs font-bold text-slate-900 dark:text-white">{author}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      {!user && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="p-10 rounded-3xl bg-gradient-to-r from-teal-600 to-emerald-600 text-white text-center space-y-5">
            <h2 className="text-3xl font-extrabold font-heading">Ready to find your ideal roommate?</h2>
            <p className="text-teal-100 max-w-lg mx-auto">Create a free account. Answer the lifestyle quiz. Get matched. Start with 10 free connections — no credit card needed.</p>
            <div className="flex justify-center gap-4 flex-wrap">
              <Link to="/register" className="px-8 py-3.5 rounded-2xl bg-white text-teal-700 font-black text-sm shadow-lg hover:shadow-xl transition-all active:scale-95 flex items-center gap-2">
                <Users className="w-4 h-4" />
                <span>Get Started Free</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link to="/matches" className="px-8 py-3.5 rounded-2xl bg-white/20 hover:bg-white/30 border border-white/30 text-white font-bold text-sm transition-all">
                Browse Roommates
              </Link>
            </div>
            <p className="text-teal-200 text-xs">Includes 10 free connection tokens. Upgrade anytime at ₹199/month.</p>
          </div>
        </section>
      )}

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
