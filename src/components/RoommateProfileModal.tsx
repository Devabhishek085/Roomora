import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  MapPin,
  Calendar,
  Briefcase,
  GraduationCap,
  Home,
  Heart,
  MessageSquare,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Moon,
  Sun,
  Volume2,
  Utensils,
  Cigarette,
  Users,
  Lock,
  Eye,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Tag,
  DollarSign
} from 'lucide-react';
import type { RoommateProfile, CompatibilityReport } from '../types';
import { useAppStore } from '../store/useAppStore';

interface RoommateProfileModalProps {
  roommate: RoommateProfile | null;
  report: CompatibilityReport | null;
  onClose: () => void;
  onConnect?: (roommate: RoommateProfile) => void;
  initialTab?: 'profile' | 'compatibility';
}

export const RoommateProfileModal: React.FC<RoommateProfileModalProps> = ({
  roommate,
  report,
  onClose,
  onConnect,
  initialTab = 'profile'
}) => {
  const { savedRoommates, toggleSaveRoommate } = useAppStore();
  const [activeTab, setActiveTab] = useState<'profile' | 'compatibility'>(initialTab);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number>(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState<boolean>(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Pause Lenis smooth scroll while modal is open so mouse wheel scrolls the modal smoothly
  useEffect(() => {
    const lenis = (window as any).__lenis;
    if (lenis && typeof lenis.stop === 'function') {
      lenis.stop();
    }
    const prevBodyOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      if (lenis && typeof lenis.start === 'function') {
        lenis.start();
      }
      document.body.style.overflow = prevBodyOverflow;
    };
  }, []);

  if (!roommate) return null;

  const isSaved = savedRoommates.includes(roommate.id);
  const photos = roommate.flatImages || [];
  const hasPhotos = photos.length > 0;

  const score = report?.score ?? 0;
  const scoreBadgeBg =
    score >= 85
      ? 'bg-emerald-500 text-white'
      : score >= 70
      ? 'bg-teal-500 text-slate-950'
      : score >= 55
      ? 'bg-amber-400 text-slate-950'
      : 'bg-slate-500 text-white';

  const handlePrevPhoto = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!hasPhotos) return;
    setSelectedPhotoIndex((prev) => (prev === 0 ? photos.length - 1 : prev - 1));
  };

  const handleNextPhoto = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!hasPhotos) return;
    setSelectedPhotoIndex((prev) => (prev === photos.length - 1 ? 0 : prev + 1));
  };

  const handleForwardWheel = (e: React.WheelEvent) => {
    e.stopPropagation();
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop += e.deltaY;
    }
  };

  return (
    <>
      <div
        data-lenis-prevent="true"
        className="fixed inset-0 z-50 overflow-y-auto overscroll-contain bg-slate-950/75 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200"
        onClick={onClose}
      >
        <div
          data-lenis-prevent="true"
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col overscroll-contain"
        >
          {/* ════════════ HEADER BAR ════════════ */}
          <div
            onWheel={handleForwardWheel}
            className="relative p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800/80 bg-gradient-to-r from-slate-50 via-teal-50/20 to-white dark:from-slate-950 dark:via-teal-950/10 dark:to-slate-900"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <img
                    src={roommate.avatarUrl}
                    alt={roommate.name}
                    className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover border-2 border-teal-500/80 shadow-md ring-4 ring-teal-500/10"
                  />
                  {roommate.isAadhaarVerified && (
                    <div
                      title="Aadhaar Verified Roommate"
                      className="absolute -bottom-1 -right-1 bg-teal-500 text-slate-950 p-1 rounded-full shadow-md"
                    >
                      <ShieldCheck className="w-3.5 h-3.5" />
                    </div>
                  )}
                </div>

                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-xl sm:text-2xl font-black font-heading text-slate-900 dark:text-white">
                      {roommate.name}
                    </h2>
                    <span className="px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs">
                      {roommate.age} yrs • {roommate.gender}
                    </span>
                    {roommate.isAadhaarVerified && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-teal-100 dark:bg-teal-950/80 text-teal-700 dark:text-teal-300 text-[11px] font-bold border border-teal-200 dark:border-teal-800/60">
                        <ShieldCheck className="w-3 h-3 text-teal-600 dark:text-teal-400" />
                        Aadhaar Verified
                      </span>
                    )}
                  </div>

                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
                    <span className="flex items-center gap-1">
                      <Briefcase className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                      {roommate.occupation}
                    </span>
                    {roommate.institution && (
                      <>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <GraduationCap className="w-3.5 h-3.5 text-slate-400" />
                          {roommate.institution}
                        </span>
                      </>
                    )}
                  </p>

                  <div className="flex items-center gap-2 mt-1.5 text-xs text-slate-500 dark:text-slate-400">
                    <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      {roommate.targetLocalities.length > 0 ? roommate.targetLocalities.join(', ') : roommate.city || 'India'}
                    </span>
                    {roommate.city && <span className="text-slate-400">({roommate.city})</span>}
                  </div>
                </div>
              </div>

              {/* Top right actions */}
              <div className="flex items-center gap-2">
                {report && (
                  <div className={`px-3 py-1.5 rounded-2xl flex items-center gap-1.5 font-heading font-black text-xs shadow-sm ${scoreBadgeBg}`}>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{report.score}% Match</span>
                  </div>
                )}
                <button
                  type="button"
                  onClick={onClose}
                  className="p-2 rounded-full hover:bg-slate-200/80 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
                  aria-label="Close modal"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center gap-2 mt-4 pt-3 border-t border-slate-200/60 dark:border-slate-800/60">
              <button
                type="button"
                onClick={() => setActiveTab('profile')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  activeTab === 'profile'
                    ? 'bg-teal-500 text-slate-950 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Home className="w-3.5 h-3.5" />
                <span>About &amp; Room Photos</span>
                {hasPhotos && (
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                    activeTab === 'profile' ? 'bg-slate-950/20 text-slate-950' : 'bg-teal-100 dark:bg-teal-950 text-teal-700 dark:text-teal-300'
                  }`}>
                    {photos.length}
                  </span>
                )}
              </button>

              {report && (
                <button
                  type="button"
                  onClick={() => setActiveTab('compatibility')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                    activeTab === 'compatibility'
                      ? 'bg-teal-500 text-slate-950 shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Why This Match? ({report.score}%)</span>
                </button>
              )}
            </div>
          </div>

          {/* ════════════ SCROLLABLE CONTENT BODY ════════════ */}
          <div
            ref={scrollContainerRef}
            data-lenis-prevent="true"
            onWheel={(e) => e.stopPropagation()}
            className="p-5 sm:p-6 overflow-y-auto overscroll-contain space-y-6 flex-1 min-h-0 text-slate-800 dark:text-slate-200 touch-pan-y"
          >
            {activeTab === 'profile' ? (
              <>
                {/* ── SECTION 1: PHOTOS OF ROOM / FLAT ── */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs sm:text-sm font-extrabold font-heading text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                      <Home className="w-4 h-4 text-teal-500" />
                      <span>Photos of Room / Flat</span>
                    </h3>
                    {hasPhotos ? (
                      <span className="text-xs font-bold text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/60 px-2.5 py-1 rounded-full border border-teal-200/50 dark:border-teal-800/40">
                        {photos.length} {photos.length === 1 ? 'photo' : 'photos'} uploaded
                      </span>
                    ) : (
                      <span className="text-xs text-slate-400 font-medium">Not uploaded</span>
                    )}
                  </div>

                  {hasPhotos ? (
                    <div className="rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-950/5 dark:bg-slate-950/50 p-2 sm:p-3 space-y-2.5">
                      {/* Main Featured Photo Box */}
                      <div
                        onClick={() => setIsLightboxOpen(true)}
                        className="relative w-full h-56 sm:h-72 rounded-xl overflow-hidden bg-slate-900 cursor-pointer group shadow-inner"
                      >
                        <img
                          src={photos[selectedPhotoIndex]}
                          alt={`${roommate.name}'s flat photo ${selectedPhotoIndex + 1}`}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />

                        {/* Prev / Next controls */}
                        {photos.length > 1 && (
                          <>
                            <button
                              type="button"
                              onClick={handlePrevPhoto}
                              className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-slate-950/70 hover:bg-slate-950/90 text-white backdrop-blur-md shadow-lg transition-transform hover:scale-110 active:scale-95 z-10"
                              title="Previous image"
                            >
                              <ChevronLeft className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={handleNextPhoto}
                              className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-slate-950/70 hover:bg-slate-950/90 text-white backdrop-blur-md shadow-lg transition-transform hover:scale-110 active:scale-95 z-10"
                              title="Next image"
                            >
                              <ChevronRight className="w-4 h-4" />
                            </button>
                          </>
                        )}

                        {/* Top Overlay Badge */}
                        <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-slate-950/80 backdrop-blur-md border border-white/20 text-white text-[11px] font-bold flex items-center gap-1.5 shadow-md">
                          <Home className="w-3.5 h-3.5 text-teal-400" />
                          <span>Photo {selectedPhotoIndex + 1} of {photos.length}</span>
                        </div>

                        {/* Expand prompt on hover */}
                        <div className="absolute bottom-3 right-3 px-3 py-1.5 rounded-xl bg-slate-950/80 backdrop-blur-md text-white text-xs font-bold flex items-center gap-1.5 opacity-90 group-hover:opacity-100 group-hover:bg-slate-950 transition-all shadow-md">
                          <Maximize2 className="w-3.5 h-3.5 text-teal-400" />
                          <span>Click to enlarge</span>
                        </div>
                      </div>

                      {/* Thumbnail Strip */}
                      {photos.length > 1 && (
                        <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 pt-1">
                          {photos.map((imgUrl, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => setSelectedPhotoIndex(idx)}
                              className={`relative aspect-video rounded-lg overflow-hidden border-2 transition-all ${
                                selectedPhotoIndex === idx
                                  ? 'border-teal-500 ring-2 ring-teal-500/30 scale-95'
                                  : 'border-transparent opacity-70 hover:opacity-100 hover:scale-[1.02]'
                              }`}
                            >
                              <img
                                src={imgUrl}
                                alt={`Thumbnail ${idx + 1}`}
                                className="w-full h-full object-cover"
                              />
                              <span className="absolute bottom-0.5 right-0.5 px-1 rounded bg-slate-950/80 text-[9px] font-bold text-white">
                                #{idx + 1}
                              </span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    /* No photos placeholder card */
                    <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-dashed border-slate-200 dark:border-slate-800 text-center space-y-2">
                      <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
                        <Home className="w-6 h-6" />
                      </div>
                      <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        No Room Photos Uploaded Yet
                      </h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                        {roommate.name.split(' ')[0]} hasn&apos;t added photos of their flat or room yet. You can connect with them to request pictures directly.
                      </p>
                    </div>
                  )}
                </div>

                {/* ── SECTION 2: BIO / ABOUT ── */}
                {roommate.bio && (
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 space-y-1.5">
                    <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      About {roommate.name.split(' ')[0]}
                    </h4>
                    <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed italic">
                      &ldquo;{roommate.bio}&rdquo;
                    </p>
                  </div>
                )}

                {/* ── SECTION 3: KEY DETAILS GRID ── */}
                <div className="space-y-3">
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Budget &amp; Housing Preferences
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                        Rent Budget
                      </span>
                      <span className="text-sm font-black text-teal-600 dark:text-teal-400">
                        ₹{roommate.budgetMin.toLocaleString()} - ₹{roommate.budgetMax.toLocaleString()}
                      </span>
                      <span className="text-[10px] text-slate-400 block mt-0.5">/ month</span>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                        Move-in Date
                      </span>
                      <span className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200">
                        {roommate.moveInDate || 'Flexible'}
                      </span>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                        Looking For
                      </span>
                      <span className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200">
                        {roommate.accommodationType}
                      </span>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                        Room Sharing
                      </span>
                      <span className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200">
                        {roommate.sharingPreference}
                      </span>
                    </div>
                  </div>
                </div>

                {/* ── SECTION 4: LIFESTYLE & HABITS ── */}
                <div className="space-y-3">
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Living Habits &amp; Daily Routine
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                    <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 flex items-center gap-2.5">
                      <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 shrink-0">
                        <Moon className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block font-semibold">Sleep Schedule</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200">{roommate.sleepSchedule}</span>
                      </div>
                    </div>

                    <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 flex items-center gap-2.5">
                      <div className="p-2 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 shrink-0">
                        <Sparkles className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block font-semibold">Cleanliness</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200">{roommate.cleanliness} / 5 Rating</span>
                      </div>
                    </div>

                    <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 flex items-center gap-2.5">
                      <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 shrink-0">
                        <Utensils className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block font-semibold">Food Habit</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200">{roommate.foodPreference}</span>
                      </div>
                    </div>

                    <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 flex items-center gap-2.5">
                      <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 shrink-0">
                        <Cigarette className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block font-semibold">Smoke / Drink</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200">{roommate.smokingDrinking}</span>
                      </div>
                    </div>

                    <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 flex items-center gap-2.5">
                      <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 shrink-0">
                        <Volume2 className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block font-semibold">Noise Level</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200">{roommate.noiseTolerance}</span>
                      </div>
                    </div>

                    <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 flex items-center gap-2.5">
                      <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 shrink-0">
                        <Users className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block font-semibold">Guest Policy</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200">{roommate.guestPolicy}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* ── SECTION 5: HOBBIES & INTERESTS ── */}
                {roommate.hobbies && roommate.hobbies.length > 0 && (
                  <div className="space-y-2.5">
                    <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Hobbies &amp; Interests
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {roommate.hobbies.map((h, i) => (
                        <span
                          key={i}
                          className="px-3 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold"
                        >
                          ✨ {h}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              /* ── COMPATIBILITY TAB CONTENT ── */
              report && (
                <div className="space-y-6">
                  {/* Summary Box */}
                  <div className="p-4 rounded-2xl bg-teal-50/70 dark:bg-teal-950/40 border border-teal-200/80 dark:border-teal-800/60 text-teal-900 dark:text-teal-100 flex items-start gap-3">
                    <Sparkles className="w-5 h-5 text-teal-600 dark:text-teal-400 shrink-0 mt-0.5" />
                    <div>
                      <strong className="block font-bold text-xs uppercase tracking-wider text-teal-700 dark:text-teal-300 mb-0.5">
                        Compatibility Verdict ({report.score}%)
                      </strong>
                      <p className="text-xs leading-relaxed">{report.summaryText}</p>
                    </div>
                  </div>

                  {/* Hard Constraint Status */}
                  <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                    <span className="font-bold text-xs text-slate-700 dark:text-slate-300">
                      Hard Budget &amp; Policy Alignment
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

                  {/* Category Breakdown */}
                  <div className="space-y-3">
                    <h4 className="font-bold text-xs uppercase tracking-wider text-slate-400">
                      Weighted Factor Breakdown
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
                          <CheckCircle2 className="w-3.5 h-3.5" /> Core Synergies
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
                          <AlertCircle className="w-3.5 h-3.5" /> Good to Discuss
                        </h5>
                        <ul className="space-y-1 text-xs text-amber-900 dark:text-amber-200">
                          {report.considerations.map((c, idx) => (
                            <li key={idx}>• {c}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              )
            )}
          </div>

          {/* ════════════ FOOTER ACTION BAR ════════════ */}
          <div
            onWheel={handleForwardWheel}
            className="p-4 sm:p-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/70 flex items-center justify-between gap-3"
          >
            <button
              type="button"
              onClick={() => toggleSaveRoommate(roommate.id)}
              className={`px-4 py-2.5 rounded-2xl font-bold text-xs transition-all flex items-center gap-2 border ${
                isSaved
                  ? 'bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-800'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-750'
              }`}
            >
              <Heart className={`w-4 h-4 ${isSaved ? 'text-rose-500 fill-rose-500' : 'text-slate-400'}`} />
              <span>{isSaved ? 'Saved Roommate' : 'Save'}</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-2xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                Close
              </button>

              {onConnect && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onConnect(roommate);
                  }}
                  className="px-6 py-2.5 rounded-2xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs transition-all shadow-md active:scale-95 flex items-center gap-2"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Connect with {roommate.name.split(' ')[0]}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ════════════ LIGHTBOX FULLSCREEN PREVIEW ════════════ */}
      {isLightboxOpen && hasPhotos && (
        <div
          onClick={() => setIsLightboxOpen(false)}
          className="fixed inset-0 z-[60] bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-5xl max-h-[92vh] w-full bg-slate-900 rounded-3xl overflow-hidden shadow-2xl border border-slate-700 flex flex-col"
          >
            {/* Lightbox header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-950/80">
              <span className="font-bold text-sm text-white flex items-center gap-2">
                <Home className="w-4 h-4 text-teal-400" />
                <span>{roommate.name}&apos;s Room / Flat Photo ({selectedPhotoIndex + 1} of {photos.length})</span>
              </span>
              <button
                type="button"
                onClick={() => setIsLightboxOpen(false)}
                className="p-1.5 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Lightbox main image */}
            <div className="relative p-2 flex items-center justify-center overflow-auto max-h-[80vh] bg-black/40">
              <img
                src={photos[selectedPhotoIndex]}
                alt="Enlarged Room Preview"
                className="max-w-full max-h-[75vh] object-contain rounded-xl shadow-lg"
              />

              {photos.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={handlePrevPhoto}
                    className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-slate-950/80 hover:bg-slate-950 text-white backdrop-blur-md shadow-xl transition hover:scale-110 active:scale-95"
                    title="Previous"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    type="button"
                    onClick={handleNextPhoto}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-slate-950/80 hover:bg-slate-950 text-white backdrop-blur-md shadow-xl transition hover:scale-110 active:scale-95"
                    title="Next"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
