import React, { useState, useEffect } from 'react';
import { 
  X, 
  Heart, 
  Star, 
  MapPin, 
  ShieldCheck, 
  Phone, 
  User, 
  CheckCircle2, 
  AlertTriangle, 
  Calendar, 
  Send, 
  ChevronLeft, 
  ChevronRight,
  Zap,
  Coffee,
  School,
  Bus,
  Sparkles
} from 'lucide-react';
import confetti from 'canvas-confetti';
import type { PropertyListing, PointOfInterest } from '../types';
import { useAppStore } from '../store/useAppStore';

interface PropertyModalProps {
  property: PropertyListing | null;
  pois: PointOfInterest[];
  onClose: () => void;
}

export const PropertyModal: React.FC<PropertyModalProps> = ({
  property,
  pois,
  onClose
}) => {
  const { savedProperties, toggleSaveProperty, addInquiry, userProfile } = useAppStore();
  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [inquiryName, setInquiryName] = useState(userProfile.name || '');
  const [inquiryPhone, setInquiryPhone] = useState('+91 98765 43210');
  const [inquiryEmail, setInquiryEmail] = useState('aarav.sharma@gmail.com');
  const [inquiryMsg, setInquiryMsg] = useState('Hi, I am interested in visiting this place. Is it available for immediate move-in?');
  const [inquirySubmitted, setInquirySubmitted] = useState(false);

  useEffect(() => {
    const orig = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = orig;
    };
  }, []);

  if (!property) return null;

  const isSaved = savedProperties.includes(property.id);

  const handleInquirySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addInquiry({
      propertyId: property.id,
      propertyTitle: property.title,
      senderName: inquiryName,
      senderPhone: inquiryPhone,
      senderEmail: inquiryEmail,
      message: inquiryMsg,
      moveInDate: property.availableFrom
    });
    setInquirySubmitted(true);

    // Fire celebration confetti
    try {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 }
      });
    } catch {}
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        data-lenis-prevent="true"
        className="relative w-full max-w-4xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col"
      >
        {/* Modal Header & Close Button */}
        <div className="sticky top-0 z-20 flex items-center justify-between p-4 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold">
              {property.type}
            </span>
            <span className="px-2.5 py-1 rounded-full bg-teal-100 dark:bg-teal-950 text-teal-700 dark:text-teal-300 text-xs font-bold">
              {property.genderPolicy}
            </span>
            <span className="px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-[11px] font-bold">
              Verified Host
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => toggleSaveProperty(property.id)}
              className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
              title="Save to favorites"
            >
              <Heart
                className={`w-5 h-5 ${isSaved ? 'text-rose-500 fill-rose-500' : 'text-slate-400'}`}
              />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body (Scrollable) */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6">
          {/* Photo Gallery Lightbox */}
          <div className="space-y-2">
            <div className="relative h-64 sm:h-80 w-full rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800">
              <img
                src={property.images[activeImageIdx]}
                alt={property.title}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover transition-all duration-300"
              />

              {/* Prev / Next buttons */}
              {property.images.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={() =>
                      setActiveImageIdx((prev) =>
                        prev === 0 ? property.images.length - 1 : prev - 1
                      )
                    }
                    className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-slate-900/70 hover:bg-slate-900 text-white backdrop-blur-sm transition-all"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setActiveImageIdx((prev) =>
                        prev === property.images.length - 1 ? 0 : prev + 1
                      )
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-slate-900/70 hover:bg-slate-900 text-white backdrop-blur-sm transition-all"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </>
              )}

              <div className="absolute bottom-3 right-3 px-2.5 py-1 rounded-lg bg-slate-900/80 backdrop-blur-md text-white text-xs font-bold">
                {activeImageIdx + 1} / {property.images.length}
              </div>
            </div>

            {/* Thumbnail selector */}
            <div className="flex gap-2">
              {property.images.map((img, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setActiveImageIdx(idx)}
                  className={`relative h-16 w-24 rounded-xl overflow-hidden border-2 transition-all ${
                    idx === activeImageIdx
                      ? 'border-teal-500 scale-95'
                      : 'border-transparent opacity-60 hover:opacity-100'
                  }`}
                >
                  <img src={img} alt="thumb" referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>

          {/* Title, Address & Pricing Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
            <div className="md:col-span-2 space-y-2">
              <h2 className="text-2xl font-bold font-heading text-slate-900 dark:text-white">
                {property.title}
              </h2>
              <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                <MapPin className="w-3.5 h-3.5 text-teal-500" />
                <span>{property.address}</span>
                <span>•</span>
                <span className="font-bold text-teal-600 dark:text-teal-400">{property.distanceKm} km from center</span>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed pt-2">
                {property.description}
              </p>
            </div>

            {/* Price Box */}
            <div className="p-5 rounded-2xl bg-teal-50/60 dark:bg-slate-800/80 border border-teal-200/60 dark:border-slate-700 space-y-2">
              <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold block">Monthly Rent</span>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-black text-slate-900 dark:text-white font-heading">
                  ₹{property.rent.toLocaleString()}
                </span>
                <span className="text-xs text-slate-400">/ month</span>
              </div>
              <div className="text-xs text-slate-600 dark:text-slate-300 space-y-1 pt-2 border-t border-teal-100 dark:border-slate-700">
                <p>Deposit: <strong>₹{property.deposit.toLocaleString()}</strong></p>
                <p>Electricity: <strong>{property.electricityCharges}</strong></p>
                <p>Available: <strong className="text-teal-600 dark:text-teal-400">{property.availableFrom}</strong></p>
              </div>
            </div>
          </div>

          {/* Amenities & House Rules Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-100 dark:border-slate-800">
            {/* Amenities */}
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white mb-3">
                Property Amenities
              </h3>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {property.amenities.map((a, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                    <CheckCircle2 className="w-3.5 h-3.5 text-teal-500 shrink-0" />
                    <span>{a}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Rules */}
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white mb-3">
                House Guidelines
              </h3>
              <ul className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                {property.rules.map((rule, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-teal-500 font-bold">•</span>
                    <span>{rule}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Nearby Essentials via Overpass API */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white mb-3 flex items-center gap-2">
              <Zap className="w-4 h-4 text-teal-500" />
              <span>Nearby Essentials (Overpass Real POIs)</span>
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {pois.slice(0, 6).map((poi) => (
                <div
                  key={poi.id}
                  className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-xs"
                >
                  <p className="font-bold text-slate-900 dark:text-white truncate">
                    {poi.name}
                  </p>
                  <p className="text-[11px] text-teal-600 dark:text-teal-400 font-semibold mt-0.5">
                    {poi.distanceMeters}m away • {poi.type}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Owner Info & Safety Tip */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-100 dark:border-slate-800">
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-teal-500 text-slate-950 font-bold flex items-center justify-center">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                    {property.ownerName}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {property.ownerType} • {property.ownerPhone}
                  </p>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-teal-100 dark:bg-teal-950 text-teal-700 dark:text-teal-300">
                Direct Host
              </span>
            </div>

            {/* Safety Alert */}
            <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 flex items-start gap-3 text-xs text-amber-900 dark:text-amber-200">
              <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div>
                <strong className="font-bold block mb-0.5">Student Safety Advisory</strong>
                <span>Never pay deposit or booking tokens online before inspecting the room in person and checking student credentials.</span>
              </div>
            </div>
          </div>

          {/* Inquiry Form */}
          <div className="p-6 rounded-2xl bg-slate-100/70 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Send Booking Inquiry & Schedule Visit
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Direct message to {property.ownerName} • Saved to your Dashboard
                </p>
              </div>
            </div>

            {inquirySubmitted ? (
              <div className="p-4 rounded-xl bg-teal-100 dark:bg-teal-950 text-teal-800 dark:text-teal-200 text-xs font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-teal-600" />
                <span>Inquiry saved to your Dashboard! The host will contact you shortly.</span>
              </div>
            ) : (
              <form onSubmit={handleInquirySubmit} className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                      Your Name
                    </label>
                    <input
                      type="text"
                      required
                      value={inquiryName}
                      onChange={(e) => setInquiryName(e.target.value)}
                      className="w-full text-xs p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      required
                      value={inquiryPhone}
                      onChange={(e) => setInquiryPhone(e.target.value)}
                      className="w-full text-xs p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      required
                      value={inquiryEmail}
                      onChange={(e) => setInquiryEmail(e.target.value)}
                      className="w-full text-xs p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Message
                  </label>
                  <textarea
                    rows={2}
                    value={inquiryMsg}
                    onChange={(e) => setInquiryMsg(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                </div>

                <button
                  type="submit"
                  className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs transition-all shadow-md active:scale-95"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send Free Inquiry</span>
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
