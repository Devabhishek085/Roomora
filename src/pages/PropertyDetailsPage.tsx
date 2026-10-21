import React, { useMemo, useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  MapPin, 
  Star, 
  Heart, 
  ShieldCheck, 
  User, 
  CheckCircle2, 
  Send, 
  AlertTriangle,
  Zap
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useAppStore } from '../store/useAppStore';
import { generateDemoListings } from '../services/listings-generator';
import { fetchNearbyPOIs } from '../services/overpass';
import type { PointOfInterest, PropertyListing } from '../types';

export const PropertyDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { selectedLocation, savedProperties, toggleSaveProperty, addInquiry, userProfile } = useAppStore();

  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [pois, setPois] = useState<PointOfInterest[]>([]);
  const [inquiryName, setInquiryName] = useState(userProfile.name || '');
  const [inquiryPhone, setInquiryPhone] = useState('+91 98765 43210');
  const [inquiryMsg, setInquiryMsg] = useState('Hello! I would like to visit this property.');
  const [inquirySubmitted, setInquirySubmitted] = useState(false);

  // Retrieve or regenerate listing
  const property: PropertyListing | undefined = useMemo(() => {
    const lat = Number.isFinite(selectedLocation?.lat) ? selectedLocation.lat : 28.6923;
    const lng = Number.isFinite(selectedLocation?.lng) ? selectedLocation.lng : 77.2117;
    const list = generateDemoListings(lat, lng, 12);
    const found = list.find((p) => p.id === id);
    return found || list[0];
  }, [id, selectedLocation?.lat, selectedLocation?.lng]);

  useEffect(() => {
    if (property) {
      fetchNearbyPOIs(property.lat, property.lng, 2500).then(setPois);
    }
  }, [property]);

  if (!property) return null;

  const isSaved = savedProperties.includes(property.id);

  const handleInquirySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addInquiry({
      propertyId: property.id,
      propertyTitle: property.title,
      senderName: inquiryName,
      senderPhone: inquiryPhone,
      senderEmail: 'aarav.sharma@gmail.com',
      message: inquiryMsg,
      moveInDate: property.availableFrom
    });
    setInquirySubmitted(true);
    try {
      confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 } });
    } catch {}
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] dark:bg-[#0A0D14] text-slate-900 dark:text-slate-100 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Back navigation */}
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-teal-600 dark:hover:text-teal-400 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Explore</span>
        </button>

        {/* Gallery */}
        <div className="rounded-3xl overflow-hidden bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md">
          <div className="relative h-72 sm:h-96 w-full">
            <img
              src={property.images[activeImageIdx]}
              alt={property.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute top-4 left-4 flex gap-2">
              <span className="px-3 py-1 rounded-full bg-slate-900/80 backdrop-blur-md text-white text-xs font-bold">
                {property.type}
              </span>
              <span className="px-3 py-1 rounded-full bg-teal-500 text-slate-950 text-xs font-black">
                {property.occupancy}
              </span>
            </div>
            <button
              onClick={() => toggleSaveProperty(property.id)}
              className="absolute top-4 right-4 p-2.5 rounded-full bg-white/90 dark:bg-slate-900/90 text-slate-600 dark:text-slate-300 shadow-md"
            >
              <Heart className={`w-5 h-5 ${isSaved ? 'text-rose-500 fill-rose-500' : 'text-slate-400'}`} />
            </button>
          </div>

          <div className="flex gap-2 p-3 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800">
            {property.images.map((img, idx) => (
              <button
                key={idx}
                onClick={() => setActiveImageIdx(idx)}
                className={`h-16 w-24 rounded-xl overflow-hidden border-2 ${
                  idx === activeImageIdx ? 'border-teal-500' : 'border-transparent opacity-60'
                }`}
              >
                <img src={img} alt="thumb" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-3">
              <h1 className="text-3xl font-extrabold font-heading text-slate-900 dark:text-white">
                {property.title}
              </h1>
              <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                <MapPin className="w-4 h-4 text-teal-500" />
                <span>{property.address}</span>
                <span>•</span>
                <span className="font-bold text-teal-600 dark:text-teal-400">{property.distanceKm} km from center</span>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed pt-2">
                {property.description}
              </p>
            </div>

            {/* Amenities & Rules */}
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-4">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Amenities & Services
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                {property.amenities.map((a, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                    <CheckCircle2 className="w-4 h-4 text-teal-500" />
                    <span>{a}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Nearby POIs */}
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-4">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Zap className="w-4 h-4 text-teal-500" />
                <span>Nearby Essentials via Overpass API</span>
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {pois.map((poi) => (
                  <div key={poi.id} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-xs">
                    <p className="font-bold text-slate-900 dark:text-white truncate">{poi.name}</p>
                    <p className="text-teal-600 dark:text-teal-400 font-semibold text-[11px] mt-0.5">{poi.distanceMeters}m away • {poi.type}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Pricing & Inquiry Card */}
          <div className="space-y-6">
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-md space-y-4">
              <div>
                <span className="text-xs text-slate-400 block font-semibold">Monthly Rent</span>
                <span className="text-3xl font-black text-slate-900 dark:text-white font-heading">
                  ₹{property.rent.toLocaleString()}
                </span>
                <span className="text-xs text-slate-400">/mo</span>
              </div>

              <div className="text-xs space-y-2 py-3 border-y border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-300">
                <div className="flex justify-between">
                  <span>Security Deposit</span>
                  <strong>₹{property.deposit.toLocaleString()}</strong>
                </div>
                <div className="flex justify-between">
                  <span>Electricity</span>
                  <strong>{property.electricityCharges}</strong>
                </div>
                <div className="flex justify-between">
                  <span>Furnishing</span>
                  <strong>{property.furnished}</strong>
                </div>
              </div>

              {/* Inquiry form */}
              {inquirySubmitted ? (
                <div className="p-3 rounded-xl bg-teal-100 dark:bg-teal-950 text-teal-800 dark:text-teal-200 text-xs font-semibold">
                  Inquiry sent! Saved to Dashboard.
                </div>
              ) : (
                <form onSubmit={handleInquirySubmit} className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                      Your Name
                    </label>
                    <input
                      type="text"
                      required
                      value={inquiryName}
                      onChange={(e) => setInquiryName(e.target.value)}
                      className="w-full text-xs p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                      Phone
                    </label>
                    <input
                      type="tel"
                      required
                      value={inquiryPhone}
                      onChange={(e) => setInquiryPhone(e.target.value)}
                      className="w-full text-xs p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs shadow-md"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Send Inquiry</span>
                  </button>
                </form>
              )}
            </div>

            {/* Safety tip */}
            <div className="p-5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-xs text-amber-900 dark:text-amber-200 space-y-1">
              <strong className="font-bold flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                Anti-Scam Reminder
              </strong>
              <p>Never transfer a security deposit before visiting in person and validating student ID/rent agreement.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
