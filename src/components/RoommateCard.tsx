import React, { useRef, useState } from 'react';
import { Heart, Sparkles, MapPin, CheckCircle2, UserCheck, MessageSquare, Info, Bot, ShieldCheck, Home } from 'lucide-react';
import type { RoommateProfile, CompatibilityReport } from '../types';
import { useAppStore } from '../store/useAppStore';

interface RoommateCardProps {
  roommate: RoommateProfile;
  report: CompatibilityReport;
  onWhyMatch: (roommate: RoommateProfile, report: CompatibilityReport) => void;
  onConnect: (roommate: RoommateProfile) => void;
}

export const RoommateCard: React.FC<RoommateCardProps> = ({
  roommate,
  report,
  onWhyMatch,
  onConnect
}) => {
  const { savedRoommates, toggleSaveRoommate } = useAppStore();
  const cardRef = useRef<HTMLDivElement>(null);
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);
  const [glarePosition, setGlarePosition] = useState({ x: 50, y: 50, opacity: 0 });

  const isSaved = savedRoommates.includes(roommate.id);

  // 3D Perspective Tilt on Mouse Move
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotX = -((y - centerY) / centerY) * 10;
    const rotY = ((x - centerX) / centerX) * 10;

    setRotateX(rotX);
    setRotateY(rotY);
    setGlarePosition({
      x: (x / rect.width) * 100,
      y: (y / rect.height) * 100,
      opacity: 0.2
    });
  };

  const handleMouseLeave = () => {
    setRotateX(0);
    setRotateY(0);
    setGlarePosition({ x: 50, y: 50, opacity: 0 });
  };

  const scoreColor =
    report.score >= 85
      ? 'bg-emerald-500 text-white'
      : report.score >= 70
      ? 'bg-teal-500 text-slate-950'
      : report.score >= 55
      ? 'bg-amber-400 text-slate-950'
      : 'bg-slate-400 text-white';

  return (
    <div
      style={{ perspective: '1000px' }}
      className="h-full"
    >
      <div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{
          transform: `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`,
          transition: rotateX === 0 ? 'transform 0.5s ease' : 'none'
        }}
        className="relative h-full rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-md hover:shadow-2xl transition-all duration-300 flex flex-col justify-between overflow-hidden group"
      >
        {/* Dynamic Light Glare overlay */}
        <div
          className="pointer-events-none absolute inset-0 z-20 rounded-3xl transition-opacity duration-300"
          style={{
            background: `radial-gradient(circle at ${glarePosition.x}% ${glarePosition.y}%, rgba(255,255,255,0.4) 0%, transparent 60%)`,
            opacity: glarePosition.opacity
          }}
        />

        {/* Top Card Image & Compatibility Pill */}
        <div className="p-5 pb-0">
          <div className="relative h-48 w-full rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800">
            <img
              src={roommate.avatarUrl}
              alt={roommate.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />

            {/* Compatibility Score Orb */}
            <div className="absolute top-3 left-3 flex items-center gap-1.5 px-3 py-1 rounded-full backdrop-blur-md bg-slate-950/80 border border-white/20 text-white shadow-lg">
              <span className={`w-2.5 h-2.5 rounded-full ${scoreColor}`} />
              <span className="font-heading font-black text-sm">{report.score}%</span>
              <span className="text-[10px] text-slate-300 font-semibold">Match</span>
            </div>

            {/* Heart Save button */}
            <button
              onClick={() => toggleSaveRoommate(roommate.id)}
              className="absolute top-3 right-3 p-2 rounded-full bg-white/90 dark:bg-slate-900/90 shadow-md hover:scale-110 active:scale-95 transition-all z-10"
              title="Save roommate"
            >
              <Heart className={`w-4 h-4 ${isSaved ? 'text-rose-500 fill-rose-500' : 'text-slate-400'}`} />
            </button>

            {/* Flat Pictures Indicator Badge */}
            {roommate.flatImages && roommate.flatImages.length > 0 && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onWhyMatch(roommate, report);
                }}
                className="absolute top-3 right-12 flex items-center gap-1 px-2.5 py-1 rounded-full backdrop-blur-md bg-teal-950/85 border border-teal-500/40 text-teal-300 hover:text-white hover:bg-teal-900 text-[10px] font-bold shadow-md transition-all active:scale-95 z-10"
                title="View flat and room photos"
              >
                <Home className="w-3 h-3 text-teal-400" />
                <span>{roommate.flatImages.length} Photos</span>
              </button>
            )}

            {/* Demo label badge — clearly visible */}
            {roommate.demoLabel && (
              <div className="absolute bottom-3 left-3 flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-500/90 text-slate-950 text-[10px] font-bold shadow-sm">
                <Bot className="w-3 h-3" />
                <span>AI Demo</span>
              </div>
            )}

            {/* Bottom Target Localities badge */}
            <div className={`absolute ${roommate.demoLabel ? 'bottom-3 right-3' : 'bottom-3 left-3 right-3'} flex items-center justify-between text-xs text-white`}>
              {!roommate.demoLabel && (
                <span className="px-2.5 py-1 rounded-xl bg-slate-950/75 backdrop-blur-md font-semibold text-[11px] truncate max-w-[70%]">
                  📍 {roommate.targetLocalities.join(', ')}
                </span>
              )}
              <span className="px-2 py-1 rounded-xl bg-teal-500/90 text-slate-950 font-black text-[10px]">{roommate.age} yrs</span>
            </div>
          </div>
        </div>

        {/* Body Info */}
        <div className="p-5 space-y-4 flex-1 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2 mb-1">
              <h3 className="text-lg font-bold font-heading text-slate-900 dark:text-white truncate flex items-center gap-1.5">
                {roommate.name}
                {roommate.isAadhaarVerified && (
                  <span title="Aadhaar Verified" className="inline-flex items-center">
                    <ShieldCheck className="w-4 h-4 text-teal-500 shrink-0" />
                  </span>
                )}
              </h3>
              <span className="text-xs font-black text-teal-600 dark:text-teal-400 shrink-0">
                ₹{roommate.budgetMin / 1000}k - ₹{roommate.budgetMax / 1000}k
              </span>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
              {roommate.occupation} • {roommate.institution}
            </p>

            {roommate.demoLabel && (
              <p className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold mt-0.5 flex items-center gap-1">
                <Bot className="w-3 h-3" />{roommate.demoLabel}
              </p>
            )}

            <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 mt-2 leading-relaxed">
              &ldquo;{roommate.bio}&rdquo;
            </p>

            {/* Lifestyle Badges */}
            <div className="flex flex-wrap gap-1.5 mt-3">
              <span className="px-2 py-0.5 rounded-md bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 text-[10px] font-semibold border border-teal-200/50 dark:border-teal-800/40">
                🌙 {roommate.sleepSchedule}
              </span>
              <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] font-semibold">
                ✨ Cleanliness {roommate.cleanliness}/5
              </span>
              <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] font-semibold">
                🥗 {roommate.foodPreference}
              </span>
            </div>

            {/* Flat photos direct link */}
            {roommate.flatImages && roommate.flatImages.length > 0 && (
              <button
                type="button"
                onClick={() => onWhyMatch(roommate, report)}
                className="w-full flex items-center justify-between px-3 py-1.5 rounded-xl bg-teal-50/80 dark:bg-teal-950/40 border border-teal-200/60 dark:border-teal-800/60 text-teal-700 dark:text-teal-300 text-[11px] font-bold hover:bg-teal-100 dark:hover:bg-teal-900/40 transition mt-2.5"
              >
                <span className="flex items-center gap-1.5">
                  <Home className="w-3.5 h-3.5 text-teal-500" />
                  <span>{roommate.flatImages.length} Flat &amp; Room Pictures</span>
                </span>
                <span className="text-[10px] font-semibold underline">View &rarr;</span>
              </button>
            )}
          </div>

          {/* Action Row */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => onWhyMatch(roommate, report)}
              className="flex items-center gap-1 text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-teal-600 dark:hover:text-teal-400 transition-colors"
            >
              <Info className="w-3.5 h-3.5" />
              <span>Why this match?</span>
            </button>

            <button
              type="button"
              onClick={() => onConnect(roommate)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs transition-all shadow-sm active:scale-95"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Connect</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
