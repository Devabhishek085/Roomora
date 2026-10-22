import React from 'react';
import { Heart, Star, MapPin, Check, ShieldCheck, ChevronRight, Eye } from 'lucide-react';
import type { PropertyListing } from '../types';
import { useAppStore } from '../store/useAppStore';

interface PropertyCardProps {
  property: PropertyListing;
  isHovered?: boolean;
  onHover?: (id: string | null) => void;
  onOpenDetails: (property: PropertyListing) => void;
}

export const PropertyCard: React.FC<PropertyCardProps> = ({
  property,
  isHovered = false,
  onHover,
  onOpenDetails
}) => {
  const { savedProperties, toggleSaveProperty } = useAppStore();
  const isSaved = savedProperties.includes(property.id);

  return (
    <div
      onClick={() => onOpenDetails(property)}
      onMouseEnter={() => onHover && onHover(property.id)}
      onMouseLeave={() => onHover && onHover(null)}
      className={`group relative rounded-3xl bg-white dark:bg-slate-900 border transition-all duration-200 flex flex-col overflow-hidden shadow-sm hover:shadow-xl cursor-pointer ${
        isHovered
          ? 'ring-2 ring-teal-500 border-teal-500 shadow-teal-500/10 dark:shadow-teal-900/30'
          : 'border-slate-200/80 dark:border-slate-800'
      }`}
    >
      {/* Top Image & Overlays */}
      <div className="relative h-48 w-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
        <img
          src={property.images[0]}
          alt={property.title}
          loading="lazy"
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />

        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
          <span className="px-2.5 py-1 rounded-full bg-slate-900/85 backdrop-blur-md text-emerald-400 text-[10px] font-bold tracking-wide border border-emerald-400/20 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            Verified
          </span>
          <span className="px-2.5 py-1 rounded-full bg-teal-500 text-slate-950 text-[10px] font-black tracking-wide">
            {property.occupancy}
          </span>
        </div>

        {/* Favorite Save Button */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            toggleSaveProperty(property.id);
          }}
          className="absolute top-3 right-3 p-2 rounded-full bg-white/90 dark:bg-slate-900/90 text-slate-600 dark:text-slate-300 hover:scale-110 active:scale-95 transition-all shadow-md z-10"
          title={isSaved ? 'Remove from favorites' : 'Save to favorites'}
        >
          <Heart
            className={`w-4 h-4 ${isSaved ? 'text-rose-500 fill-rose-500' : 'text-slate-500'}`}
          />
        </button>

        {/* Bottom Distance & Rating */}
        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-xs text-white">
          <span className="px-2.5 py-1 rounded-xl bg-slate-950/75 backdrop-blur-md font-semibold text-[11px] flex items-center gap-1">
            <MapPin className="w-3 h-3 text-teal-400" />
            {property.distanceKm} km from center
          </span>
          <span className="px-2 py-1 rounded-xl bg-slate-950/75 backdrop-blur-md font-bold text-[11px] flex items-center gap-1 text-amber-300">
            <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
            {property.rating} ({property.reviewCount})
          </span>
        </div>
      </div>

      {/* Body Details */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mb-1">
            <span className="font-semibold text-teal-600 dark:text-teal-400">{property.type}</span>
            <span>•</span>
            <span className="font-medium">{property.genderPolicy}</span>
            <span>•</span>
            <span>{property.furnished}</span>
          </div>

          <h3 className="font-bold text-base text-slate-900 dark:text-white line-clamp-1 group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
            {property.title}
          </h3>

          <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
            {property.address}
          </p>

          {/* Amenities Preview */}
          <div className="flex flex-wrap gap-1.5 mt-3">
            {property.amenities.slice(0, 3).map((amenity, idx) => (
              <span
                key={idx}
                className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10px] font-medium"
              >
                {amenity}
              </span>
            ))}
            {property.amenities.length > 3 && (
              <span className="px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500 text-[10px]">
                +{property.amenities.length - 3}
              </span>
            )}
          </div>
        </div>

        {/* Rent & Action Buttons */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div>
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-black text-slate-900 dark:text-white font-heading">
                ₹{property.rent.toLocaleString()}
              </span>
              <span className="text-xs text-slate-400">/mo</span>
            </div>
            <p className="text-[10px] text-slate-400">Deposit: ₹{property.deposit.toLocaleString()}</p>
          </div>

          <button
            type="button"
            onClick={() => onOpenDetails(property)}
            className="flex items-center gap-1 px-4 py-2 rounded-xl bg-slate-900 dark:bg-slate-800 hover:bg-teal-500 dark:hover:bg-teal-400 text-white dark:text-white hover:text-slate-950 dark:hover:text-slate-950 text-xs font-bold transition-all shadow-sm active:scale-95"
          >
            <span>Details</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
