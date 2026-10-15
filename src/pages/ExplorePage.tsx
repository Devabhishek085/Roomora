import React, { useState, useEffect, useMemo } from 'react';
import { 
  MapPin, 
  Sliders, 
  Map as MapIcon, 
  ListFilter, 
  Layers, 
  AlertCircle, 
  RefreshCw,
  Sparkles,
  Info
} from 'lucide-react';
import { LocationSearchBar } from '../components/LocationSearchBar';
import { PropertyCard } from '../components/PropertyCard';
import { PropertyMap } from '../components/PropertyMap';
import { FilterBar, type FilterState } from '../components/FilterBar';
import { PropertyModal } from '../components/PropertyModal';
import { useAppStore } from '../store/useAppStore';
import { generateDemoListings } from '../services/listings-generator';
import { fetchNearbyPOIs } from '../services/overpass';
import { reverseGeocode } from '../services/geocoding';
import type { PropertyListing, PointOfInterest, LocationCoordinates } from '../types';

export const ExplorePage: React.FC = () => {
  const { selectedLocation, setSelectedLocation, radiusKm, setRadiusKm } = useAppStore();

  const [activeTabMobile, setActiveTabMobile] = useState<'list' | 'map'>('list');
  const [showFiltersModal, setShowFiltersModal] = useState(false);
  const [hoveredListingId, setHoveredListingId] = useState<string | null>(null);
  const [selectedProperty, setSelectedProperty] = useState<PropertyListing | null>(null);
  const [pois, setPois] = useState<PointOfInterest[]>([]);
  const [showPoisOnMap, setShowPoisOnMap] = useState(true);

  // Filter state
  const [filters, setFilters] = useState<FilterState>({
    maxRent: 20000,
    radiusKm: radiusKm || 6,
    type: 'All',
    genderPolicy: 'All',
    furnished: 'All',
    selectedAmenities: [],
    sortBy: 'distance'
  });

  // Sync radius with store
  useEffect(() => {
    setRadiusKm(filters.radiusKm);
  }, [filters.radiusKm, setRadiusKm]);

  // Fetch POIs when selected location changes
  useEffect(() => {
    let isMounted = true;
    fetchNearbyPOIs(selectedLocation.lat, selectedLocation.lng, filters.radiusKm * 1000).then((data) => {
      if (isMounted) setPois(data);
    });
    return () => {
      isMounted = false;
    };
  }, [selectedLocation.lat, selectedLocation.lng, filters.radiusKm]);

  // Generate deterministic listings around currently selected coordinates
  const rawListings = useMemo(() => {
    return generateDemoListings(selectedLocation.lat, selectedLocation.lng, filters.radiusKm);
  }, [selectedLocation.lat, selectedLocation.lng, filters.radiusKm]);

  // Apply filters and sorting
  const filteredListings = useMemo(() => {
    let result = rawListings.filter((item) => {
      // Rent filter
      if (item.rent > filters.maxRent) return false;
      // Distance filter
      if (item.distanceKm > filters.radiusKm) return false;
      // Type filter
      if (filters.type !== 'All' && item.type !== filters.type) return false;
      // Gender policy filter
      if (filters.genderPolicy !== 'All' && item.genderPolicy !== filters.genderPolicy) return false;
      // Furnished filter
      if (filters.furnished !== 'All' && item.furnished !== filters.furnished) return false;
      // Amenities filter
      if (filters.selectedAmenities.length > 0) {
        const hasAll = filters.selectedAmenities.every((a) => item.amenities.includes(a));
        if (!hasAll) return false;
      }
      return true;
    });

    // Sorting
    if (filters.sortBy === 'distance') {
      result.sort((a, b) => a.distanceKm - b.distanceKm);
    } else if (filters.sortBy === 'rent_asc') {
      result.sort((a, b) => a.rent - b.rent);
    } else if (filters.sortBy === 'rent_desc') {
      result.sort((a, b) => b.rent - a.rent);
    } else if (filters.sortBy === 'rating') {
      result.sort((a, b) => b.rating - a.rating);
    }

    return result;
  }, [rawListings, filters]);

  const handleSearchThisArea = async (coords: { lat: number; lng: number }) => {
    const resolved = await reverseGeocode(coords.lat, coords.lng);
    setSelectedLocation(resolved);
  };

  const handleResetFilters = () => {
    setFilters({
      maxRent: 22000,
      radiusKm: 6,
      type: 'All',
      genderPolicy: 'All',
      furnished: 'All',
      selectedAmenities: [],
      sortBy: 'distance'
    });
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] dark:bg-[#0A0D14] text-slate-900 dark:text-slate-100 flex flex-col">
      {/* Top Banner Notice */}
      <div className="bg-teal-700 dark:bg-teal-950 text-white text-xs font-semibold py-2 px-4 flex items-center justify-between border-b border-teal-600">
        <div className="flex items-center gap-2">
          <Info className="w-3.5 h-3.5 text-teal-300" />
          <span>Listings are generated around your selected location — distances reflect real geography.</span>
        </div>
        <span className="hidden sm:inline text-teal-200 text-[11px]">
          Radius: {filters.radiusKm} km • {filteredListings.length} matching places
        </span>
      </div>

      {/* Main Exploration Split View */}
      <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col">
        {/* Top Control Bar: Search + Filters trigger + View toggle */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 mb-6">
          <div className="flex-1 max-w-xl">
            <LocationSearchBar compact />
          </div>

          <div className="flex items-center gap-2.5 justify-end">
            {/* Toggle POIs button */}
            <button
              type="button"
              onClick={() => setShowPoisOnMap(!showPoisOnMap)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
                showPoisOnMap
                  ? 'bg-teal-50 dark:bg-teal-950/60 border-teal-500 text-teal-700 dark:text-teal-300'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Overpass POIs</span>
            </button>

            {/* Mobile View Toggle */}
            <div className="md:hidden flex rounded-xl bg-slate-200 dark:bg-slate-800 p-1">
              <button
                type="button"
                onClick={() => setActiveTabMobile('list')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeTabMobile === 'list'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                List ({filteredListings.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTabMobile('map')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeTabMobile === 'map'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                Map
              </button>
            </div>
          </div>
        </div>

        {/* Split Grid */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Filter Bar & Property Cards List */}
          <div
            className={`lg:col-span-6 xl:col-span-7 space-y-6 ${
              activeTabMobile === 'map' ? 'hidden lg:block' : 'block'
            }`}
          >
            {/* Filter Bar */}
            <FilterBar
              filters={filters}
              onChange={setFilters}
              totalResults={filteredListings.length}
              onReset={handleResetFilters}
            />

            {/* Listings Grid */}
            {filteredListings.length === 0 ? (
              <div className="p-12 text-center rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="w-12 h-12 mx-auto rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                  <AlertCircle className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  No places match current filters
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                  Try widening your radius slider to 8–10 km, raising the budget limit, or clearing specific amenities.
                </p>
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="px-4 py-2 rounded-xl bg-teal-500 text-slate-950 text-xs font-bold shadow-sm"
                >
                  Reset All Filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {filteredListings.map((prop) => (
                  <PropertyCard
                    key={prop.id}
                    property={prop}
                    isHovered={hoveredListingId === prop.id}
                    onHover={setHoveredListingId}
                    onOpenDetails={(item) => setSelectedProperty(item)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Right Column: Sticky Interactive Leaflet Map */}
          <div
            className={`lg:col-span-6 xl:col-span-5 h-[500px] lg:h-[calc(100vh-160px)] lg:sticky lg:top-24 ${
              activeTabMobile === 'list' ? 'hidden lg:block' : 'block'
            }`}
          >
            <PropertyMap
              center={selectedLocation}
              radiusKm={filters.radiusKm}
              listings={filteredListings}
              pois={pois}
              selectedListingId={selectedProperty?.id || null}
              hoveredListingId={hoveredListingId}
              onSelectListing={(prop) => setSelectedProperty(prop)}
              onSearchThisArea={handleSearchThisArea}
              showPois={showPoisOnMap}
            />
          </div>
        </div>
      </div>

      {/* Property Details Modal */}
      <PropertyModal
        property={selectedProperty}
        pois={pois}
        onClose={() => setSelectedProperty(null)}
      />
    </div>
  );
};
