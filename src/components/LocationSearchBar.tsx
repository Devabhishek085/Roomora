import React, { useState, useEffect, useRef } from 'react';
import { Search, MapPin, Navigation, Loader2, Sparkles, X } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { searchLocations, getCurrentBrowserLocation, reverseGeocode, CURATED_INDIAN_HUBS } from '../services/geocoding';
import type { LocationCoordinates } from '../types';

interface LocationSearchBarProps {
  onLocationSelected?: (loc: LocationCoordinates) => void;
  className?: string;
  autoFocus?: boolean;
  compact?: boolean;
}

export const LocationSearchBar: React.FC<LocationSearchBarProps> = ({
  onLocationSelected,
  className = '',
  autoFocus = false,
  compact = false
}) => {
  const { selectedLocation, setSelectedLocation, recentSearches } = useAppStore();
  const [inputValue, setInputValue] = useState(selectedLocation.name || '');
  const [suggestions, setSuggestions] = useState<LocationCoordinates[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isGpsLocating, setIsGpsLocating] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const debounceTimerRef = useRef<any>(null);

  useEffect(() => {
    setInputValue(selectedLocation.name || '');
  }, [selectedLocation.name]);

  // Click outside to close suggestions
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInputValue(val);
    setFeedbackMsg(null);

    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);

    if (!val.trim()) {
      setSuggestions([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setIsOpen(true);

    debounceTimerRef.current = setTimeout(async () => {
      try {
        const results = await searchLocations(val);
        setSuggestions(results);
      } catch (err) {
        console.warn('Geocoding search error:', err);
      } finally {
        setIsLoading(false);
      }
    }, 400); // 400ms debounce
  };

  const handleSelect = (loc: LocationCoordinates) => {
    setInputValue(loc.name);
    setSelectedLocation(loc);
    setIsOpen(false);
    setFeedbackMsg(`Centered on ${loc.name}`);
    setTimeout(() => setFeedbackMsg(null), 3000);
    if (onLocationSelected) {
      onLocationSelected(loc);
    }
  };

  const handleUseCurrentLocation = async () => {
    setIsGpsLocating(true);
    setFeedbackMsg('Requesting GPS location...');
    try {
      const coords = await getCurrentBrowserLocation();
      const resolved = await reverseGeocode(coords.lat, coords.lng);
      handleSelect(resolved);
      setFeedbackMsg('Found your location!');
    } catch (err: any) {
      setFeedbackMsg(err.message || 'Location access error');
      setTimeout(() => setFeedbackMsg(null), 4000);
    } finally {
      setIsGpsLocating(false);
    }
  };

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      {/* Search Input Bar */}
      <div className={`relative flex items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-lg transition-all duration-200 focus-within:ring-2 focus-within:ring-teal-500/50 focus-within:border-teal-500 ${compact ? 'p-1.5' : 'p-2 sm:p-2.5'}`}>
        <div className="pl-3 pr-2 text-teal-600 dark:text-teal-400">
          <MapPin className={`${compact ? 'w-4 h-4' : 'w-5 h-5'} animate-bounce`} />
        </div>

        <input
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onFocus={() => setIsOpen(true)}
          autoFocus={autoFocus}
          placeholder="Search neighborhood, campus, or metro (e.g. North Campus, Koramangala, Sector 62, Powai)..."
          className="w-full bg-transparent text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 text-sm sm:text-base outline-none font-medium pr-2"
        />

        {inputValue && (
          <button
            type="button"
            onClick={() => {
              setInputValue('');
              setSuggestions([]);
            }}
            className="p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 mr-1"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        {/* GPS Button */}
        <button
          type="button"
          onClick={handleUseCurrentLocation}
          disabled={isGpsLocating}
          title="Use GPS current location"
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-teal-50 dark:bg-teal-950/60 hover:bg-teal-100 dark:hover:bg-teal-900/60 text-teal-700 dark:text-teal-300 text-xs font-semibold whitespace-nowrap transition-colors border border-teal-200/60 dark:border-teal-800/40"
        >
          {isGpsLocating ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Navigation className="w-3.5 h-3.5" />
          )}
          <span className="hidden sm:inline">Near Me</span>
        </button>
      </div>

      {/* Status feedback pill */}
      {feedbackMsg && (
        <div className="absolute top-full left-2 mt-1.5 z-40 text-xs px-2.5 py-1 rounded-lg bg-teal-900 text-teal-200 border border-teal-700 shadow-md">
          {feedbackMsg}
        </div>
      )}

      {/* Autocomplete Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl z-50 overflow-hidden divide-y divide-slate-100 dark:divide-slate-800 animate-in fade-in slide-in-from-top-2 duration-150">
          {/* Loading state skeleton */}
          {isLoading && (
            <div className="p-4 space-y-2.5">
              <div className="flex items-center gap-2 text-xs text-teal-600 dark:text-teal-400 font-medium">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Searching OpenStreetMap Nominatim...</span>
              </div>
              <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded animate-pulse w-3/4" />
              <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded animate-pulse w-1/2" />
            </div>
          )}

          {/* Real-time search suggestions */}
          {!isLoading && suggestions.length > 0 && (
            <div className="max-h-64 overflow-y-auto p-1.5">
              <div className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Search Results
              </div>
              {suggestions.map((item, idx) => (
                <button
                  key={`sug-${idx}`}
                  type="button"
                  onClick={() => handleSelect(item)}
                  className="w-full text-left flex items-start gap-3 p-2.5 rounded-xl hover:bg-teal-50 dark:hover:bg-slate-800 transition-colors group"
                >
                  <MapPin className="w-4 h-4 mt-0.5 text-teal-500 shrink-0 group-hover:scale-110 transition-transform" />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                      {item.name}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                      {item.displayName || item.city}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Quick curated hubs pills */}
          <div className="p-3 bg-slate-50/70 dark:bg-slate-950/50">
            <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
              <Sparkles className="w-3 h-3 text-teal-500" />
              <span>Popular Student Hubs</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {CURATED_INDIAN_HUBS.slice(0, 5).map((hub) => (
                <button
                  key={hub.name}
                  type="button"
                  onClick={() => handleSelect(hub)}
                  className="px-2.5 py-1 text-xs font-medium rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-teal-500 dark:hover:border-teal-400 text-slate-700 dark:text-slate-300 hover:text-teal-600 dark:hover:text-teal-300 transition-all shadow-sm"
                >
                  {hub.name}
                </button>
              ))}
            </div>
          </div>

          {/* Recent searches */}
          {recentSearches.length > 0 && (
            <div className="p-3">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5">
                Recent Searches
              </div>
              <div className="space-y-1">
                {recentSearches.slice(0, 3).map((item, idx) => (
                  <button
                    key={`rec-${idx}`}
                    type="button"
                    onClick={() => handleSelect(item)}
                    className="w-full text-left flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    <span className="truncate">{item.name}</span>
                    <span className="text-[10px] text-slate-400 shrink-0">Recent</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
