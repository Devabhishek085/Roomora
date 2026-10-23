import React from 'react';
import { SlidersHorizontal, ArrowUpDown, Shield, Check, X } from 'lucide-react';
import type { GenderPolicy, AccommodationType } from '../types';

export interface FilterState {
  maxRent: number;
  radiusKm: number;
  type: string;
  genderPolicy: string;
  furnished: string;
  selectedAmenities: string[];
  sortBy: 'distance' | 'rent_asc' | 'rent_desc' | 'rating';
}

interface FilterBarProps {
  filters: FilterState;
  onChange: (newFilters: FilterState) => void;
  totalResults: number;
  onReset: () => void;
}

const COMMON_AMENITIES = [
  'High-Speed Wi-Fi',
  'Air Conditioning',
  'Power Backup',
  '3 Times Meals Included',
  'CCTV Security & Biometrics',
  'Washing Machine / Laundry'
];

export const FilterBar: React.FC<FilterBarProps> = ({
  filters,
  onChange,
  totalResults,
  onReset
}) => {
  const handleTypeChange = (t: string) => {
    onChange({ ...filters, type: t });
  };

  const handleGenderChange = (g: string) => {
    onChange({ ...filters, genderPolicy: g });
  };

  const toggleAmenity = (amenity: string) => {
    const next = filters.selectedAmenities.includes(amenity)
      ? filters.selectedAmenities.filter((a) => a !== amenity)
      : [...filters.selectedAmenities, amenity];
    onChange({ ...filters, selectedAmenities: next });
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-5">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-teal-600 dark:text-teal-400" />
          <span className="font-bold text-sm text-slate-900 dark:text-white">
            Filter Verified Places
          </span>
          <span className="px-2 py-0.5 rounded-full bg-teal-100 dark:bg-teal-950 text-teal-700 dark:text-teal-300 text-xs font-black">
            {totalResults} Found
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onReset}
            className="text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
          >
            Reset Filters
          </button>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-1.5 text-xs">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={filters.sortBy}
              onChange={(e) =>
                onChange({ ...filters, sortBy: e.target.value as FilterState['sortBy'] })
              }
              className="bg-slate-100 dark:bg-slate-800 border-none rounded-xl px-2.5 py-1.5 text-slate-800 dark:text-slate-200 font-semibold outline-none cursor-pointer"
            >
              <option value="distance">Distance: Nearest First</option>
              <option value="rent_asc">Rent: Low to High</option>
              <option value="rent_desc">Rent: High to Low</option>
              <option value="rating">Rating: Highest First</option>
            </select>
          </div>
        </div>
      </div>

      {/* Sliders Grid: Radius & Max Rent */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Radius Slider */}
        <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-800/80">
          <div className="flex justify-between items-center text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
            <span>Search Radius</span>
            <span className="text-teal-600 dark:text-teal-400 font-black">{filters.radiusKm} km</span>
          </div>
          <input
            type="range"
            min="1"
            max="12"
            step="1"
            value={filters.radiusKm}
            onChange={(e) => onChange({ ...filters, radiusKm: Number(e.target.value) })}
            className="w-full accent-teal-500 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-slate-400 mt-1">
            <span>1 km (walking)</span>
            <span>6 km</span>
            <span>12 km (transit)</span>
          </div>
        </div>

        {/* Max Rent Slider */}
        <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-800/80">
          <div className="flex justify-between items-center text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
            <span>Max Budget</span>
            <span className="text-teal-600 dark:text-teal-400 font-black">₹{filters.maxRent.toLocaleString()}/mo</span>
          </div>
          <input
            type="range"
            min="5000"
            max="26000"
            step="500"
            value={filters.maxRent}
            onChange={(e) => onChange({ ...filters, maxRent: Number(e.target.value) })}
            className="w-full accent-teal-500 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-slate-400 mt-1">
            <span>₹5,000</span>
            <span>₹15,000</span>
            <span>₹26,000</span>
          </div>
        </div>
      </div>

      {/* Accommodation Type Pills */}
      <div>
        <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
          Accommodation Type
        </label>
        <div className="flex flex-wrap gap-1.5">
          {['All', 'PG', 'Flat'].map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => handleTypeChange(t)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                filters.type === t
                  ? 'bg-teal-500 text-slate-950 shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Gender Policy Pills */}
      <div>
        <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
          Gender Policy
        </label>
        <div className="flex flex-wrap gap-1.5">
          {['All', 'Boys Only', 'Girls Only', 'Co-Living'].map((g) => (
            <button
              key={g}
              type="button"
              onClick={() => handleGenderChange(g)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                filters.genderPolicy === g
                  ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {g}
            </button>
          ))}
        </div>
      </div>

      {/* Amenities Checkbox Chips */}
      <div>
        <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
          Key Amenities
        </label>
        <div className="flex flex-wrap gap-2">
          {COMMON_AMENITIES.map((amenity) => {
            const isChecked = filters.selectedAmenities.includes(amenity);
            return (
              <button
                key={amenity}
                type="button"
                onClick={() => toggleAmenity(amenity)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${
                  isChecked
                    ? 'border-teal-500 bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300'
                    : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:border-slate-300'
                }`}
              >
                {isChecked && <Check className="w-3.5 h-3.5 text-teal-500" />}
                <span>{amenity}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
