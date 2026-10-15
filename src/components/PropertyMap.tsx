import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { MapPin, Navigation, ExternalLink, School, Bus, Hospital, Coffee, CreditCard, RefreshCw } from 'lucide-react';
import type { PropertyListing, PointOfInterest, LocationCoordinates } from '../types';

interface PropertyMapProps {
  center: LocationCoordinates;
  radiusKm: number;
  listings: PropertyListing[];
  pois: PointOfInterest[];
  selectedListingId: string | null;
  hoveredListingId: string | null;
  onSelectListing: (property: PropertyListing) => void;
  onSearchThisArea: (newCenter: { lat: number; lng: number }) => void;
  showPois?: boolean;
}

// Controller component to smoothly fly the map when center changes
function MapFlyController({ center }: { center: LocationCoordinates }) {
  const map = useMap();

  useEffect(() => {
    if (center.lat && center.lng) {
      map.flyTo([center.lat, center.lng], 14, {
        duration: 1.5,
        easeLinearity: 0.25
      });
    }
  }, [center.lat, center.lng, map]);

  return null;
}

// Listener for user panning/dragging the map
function MapPanListener({ onPanEnd }: { onPanEnd: (coords: { lat: number; lng: number }) => void }) {
  useMapEvents({
    dragend: (e) => {
      const center = e.target.getCenter();
      onPanEnd({ lat: center.lat, lng: center.lng });
    }
  });
  return null;
}

export const PropertyMap: React.FC<PropertyMapProps> = ({
  center,
  radiusKm,
  listings,
  pois,
  selectedListingId,
  hoveredListingId,
  onSelectListing,
  onSearchThisArea,
  showPois = true
}) => {
  const [mapPannedCoords, setMapPannedCoords] = useState<{ lat: number; lng: number } | null>(null);

  // Center Marker (Glowing Student Campus Pin)
  const centerPinIcon = L.divIcon({
    className: 'custom-center-pin',
    html: `
      <div style="position: relative; width: 36px; height: 36px; display: flex; items-center; justify-content: center;">
        <div style="position: absolute; inset: 0; border-radius: 9999px; background-color: rgba(20, 184, 166, 0.35); animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
        <div style="width: 24px; height: 24px; border-radius: 9999px; background-color: #0f766e; border: 3px solid #ffffff; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.3); display: flex; align-items: center; justify-content: center; color: white; font-size: 11px; font-weight: bold; margin: auto;">
          📍
        </div>
      </div>
    `,
    iconSize: [36, 36],
    iconAnchor: [18, 18]
  });

  // Create custom DivIcon for Property Listings with Price Pills
  const createListingIcon = (prop: PropertyListing, isHighlighted: boolean) => {
    const bgClass = isHighlighted ? '#14b8a6' : '#0f172a';
    const textClass = '#ffffff';
    const scale = isHighlighted ? 'transform: scale(1.15); z-index: 1000;' : '';

    return L.divIcon({
      className: 'custom-property-pin',
      html: `
        <div style="display: flex; align-items: center; justify-content: center; transition: all 0.2s ease; ${scale}">
          <div style="background-color: ${bgClass}; color: ${textClass}; padding: 4px 8px; border-radius: 9999px; font-size: 11px; font-weight: 800; font-family: sans-serif; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.3); border: 2px solid #ffffff; white-space: nowrap;">
            ₹${(prop.rent / 1000).toFixed(1)}k
          </div>
        </div>
      `,
      iconSize: [50, 24],
      iconAnchor: [25, 12]
    });
  };

  // POI Icon helper
  const createPoiIcon = (type: PointOfInterest['type']) => {
    let emoji = '🏫';
    let color = '#3b82f6';
    if (type === 'transit') {
      emoji = '🚌';
      color = '#eab308';
    } else if (type === 'hospital') {
      emoji = '🏥';
      color = '#ef4444';
    } else if (type === 'food') {
      emoji = '☕';
      color = '#f97316';
    } else if (type === 'atm') {
      emoji = '🏧';
      color = '#10b981';
    }

    return L.divIcon({
      className: 'custom-poi-pin',
      html: `
        <div style="width: 24px; height: 24px; border-radius: 8px; background-color: ${color}; color: white; display: flex; align-items: center; justify-content: center; font-size: 11px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.2); border: 1.5px solid white;">
          ${emoji}
        </div>
      `,
      iconSize: [24, 24],
      iconAnchor: [12, 12]
    });
  };

  const handlePanEnd = (coords: { lat: number; lng: number }) => {
    // Only show button if moved noticeably away (> 0.008 deg)
    const dist = Math.sqrt(
      Math.pow(coords.lat - center.lat, 2) + Math.pow(coords.lng - center.lng, 2)
    );
    if (dist > 0.008) {
      setMapPannedCoords(coords);
    }
  };

  return (
    <div className="relative w-full h-full min-h-[450px] rounded-3xl overflow-hidden border border-slate-200/80 dark:border-slate-800 shadow-xl">
      <MapContainer
        center={[center.lat, center.lng]}
        zoom={14}
        scrollWheelZoom={true}
        className="w-full h-full z-0"
      >
        <MapFlyController center={center} />
        <MapPanListener onPanEnd={handlePanEnd} />

        {/* Clean OpenStreetMap CartoDB Positron / OSM tiles */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={19}
        />

        {/* Radius Search Circle */}
        <Circle
          center={[center.lat, center.lng]}
          radius={radiusKm * 1000}
          pathOptions={{
            color: '#14b8a6',
            fillColor: '#14b8a6',
            fillOpacity: 0.08,
            weight: 2,
            dashArray: '6, 6'
          }}
        />

        {/* Center "You Are Here" Marker */}
        <Marker position={[center.lat, center.lng]} icon={centerPinIcon}>
          <Popup>
            <div className="p-3">
              <div className="flex items-center gap-1.5 text-xs font-bold text-teal-600 mb-1">
                <Navigation className="w-3.5 h-3.5" />
                <span>Search Origin</span>
              </div>
              <p className="font-bold text-sm text-slate-900">{center.name}</p>
              <p className="text-xs text-slate-500 mt-0.5">{radiusKm} km search radius active</p>
            </div>
          </Popup>
        </Marker>

        {/* Property Listing Markers */}
        {listings.map((prop) => {
          const isHighlighted =
            prop.id === hoveredListingId || prop.id === selectedListingId;

          return (
            <Marker
              key={prop.id}
              position={[prop.lat, prop.lng]}
              icon={createListingIcon(prop, isHighlighted)}
            >
              <Popup>
                <div className="w-64 p-0">
                  <div className="relative h-28 w-full">
                    <img
                      src={prop.images[0]}
                      alt={prop.title}
                      className="w-full h-full object-cover rounded-t-xl"
                    />
                    <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-slate-900/80 text-white text-[10px] font-bold">
                      {prop.type}
                    </div>
                  </div>
                  <div className="p-3">
                    <h4 className="font-bold text-sm text-slate-900 truncate">
                      {prop.title}
                    </h4>
                    <p className="text-xs text-slate-500 truncate mb-2">
                      {prop.distanceKm} km from campus • {prop.genderPolicy}
                    </p>
                    <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                      <span className="font-extrabold text-sm text-slate-900">
                        ₹{prop.rent.toLocaleString()}/mo
                      </span>
                      <button
                        type="button"
                        onClick={() => onSelectListing(prop)}
                        className="px-2.5 py-1 rounded-lg bg-teal-500 hover:bg-teal-400 text-slate-950 text-xs font-bold transition-colors"
                      >
                        Inspect
                      </button>
                    </div>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}

        {/* POI Layer from Overpass API */}
        {showPois &&
          pois.map((poi) => (
            <Marker
              key={poi.id}
              position={[poi.lat, poi.lng]}
              icon={createPoiIcon(poi.type)}
            >
              <Popup>
                <div className="p-2.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-teal-600 block mb-0.5">
                    Essential • {poi.type}
                  </span>
                  <p className="text-xs font-bold text-slate-900">{poi.name}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {poi.distanceMeters}m from current center
                  </p>
                </div>
              </Popup>
            </Marker>
          ))}
      </MapContainer>

      {/* Floating "Search This Area" Button on Pan */}
      {mapPannedCoords && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 animate-in fade-in slide-in-from-top-3">
          <button
            type="button"
            onClick={() => {
              onSearchThisArea(mapPannedCoords);
              setMapPannedCoords(null);
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-slate-900 text-white hover:bg-teal-500 hover:text-slate-950 font-bold text-xs shadow-2xl border border-white/20 transition-all active:scale-95"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Search This Area</span>
          </button>
        </div>
      )}

      {/* Floating Map Legend */}
      <div className="absolute bottom-4 right-4 z-20 hidden sm:flex items-center gap-3 px-3 py-1.5 rounded-2xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-slate-200 dark:border-slate-800 text-[11px] text-slate-700 dark:text-slate-300 shadow-md">
        <span className="flex items-center gap-1 font-semibold">
          <span className="w-2.5 h-2.5 rounded-full bg-teal-500" /> Places
        </span>
        <span className="flex items-center gap-1">
          <span>🎓</span> Colleges
        </span>
        <span className="flex items-center gap-1">
          <span>🚌</span> Transit
        </span>
        <span className="flex items-center gap-1">
          <span>🏥</span> Medical
        </span>
      </div>
    </div>
  );
};
