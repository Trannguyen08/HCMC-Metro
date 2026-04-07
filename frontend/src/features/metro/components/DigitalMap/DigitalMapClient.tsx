"use client";

import { useEffect, useState, useRef } from "react";
import { MapContainer, TileLayer, Polyline, CircleMarker, Marker, Popup, useMap, useMapEvents, Tooltip } from "react-leaflet";
import L from "leaflet";
import { AmenityMap, BusStopCacheMap, MapInitData, StationMap } from "@/types/map";
import { MapService } from "../../services/MapService";
import { SearchBar } from "./SearchBar";
import { FilterBar } from "./FilterBar";
import { AmenityPopup } from "./AmenityPopup"; 

// Fix Leaflet Default Icon issue in Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Helpers
const createAmenityIcon = (categorySlug: string) => {
  const color = categorySlug ? '#D97706' : '#2563EB';
  const html = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="${color}" stroke="white" stroke-width="2"><circle cx="12" cy="12" r="10"/></svg>`;
  return L.divIcon({
    html,
    className: '',
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
};

const busIcon = L.divIcon({
  html: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#0891B2" stroke="white" stroke-width="1.5"><path d="M8 6v6"/><path d="M15 6v6"/><path d="M2 12h19.6"/><path d="M18 18h3s.5-1.7.8-2.8c.1-.4.2-.8.2-1.2 0-.4-.1-.8-.2-1.2l-1.4-5C20.1 6.8 19.1 6 18 6H4a2 2 0 0 0-2 2v10h3"/><circle cx="7" cy="18" r="2"/><path d="M9 18h5"/><circle cx="16" cy="18" r="2"/></svg>`,
  className: '',
  iconSize: [28, 28],
  iconAnchor: [14, 14],
});

// A component to catch map movement
function MapEvents({ onBoundsChanged }: { onBoundsChanged: (bounds: L.LatLngBounds) => void }) {
  useMapEvents({
    moveend: (e: L.LeafletEvent) => {
      onBoundsChanged(e.target.getBounds());
    }
  });
  return null;
}

// A component to pan map
function MapController({ center }: { center?: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.setView(center, 16);
    }
  }, [center, map]);
  return null;
}

export default function DigitalMapClient() {
  const [initData, setInitData] = useState<MapInitData | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [amenities, setAmenities] = useState<AmenityMap[]>([]);
  const [busStops, setBusStops] = useState<BusStopCacheMap[]>([]);
  
  const [selectedStation, setSelectedStation] = useState<StationMap | null>(null);
  const [selectedAmenity, setSelectedAmenity] = useState<AmenityMap | null>(null);
  const [mapCenter, setMapCenter] = useState<[number, number] | undefined>(undefined);
  const boundsRef = useRef<L.LatLngBounds | null>(null);

  useEffect(() => {
    let active = true;
    MapService.getInitData().then(data => {
      if (active) setInitData(data);
    });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!initData) return;
    
    let debounceTimer = setTimeout(async () => {
      try {
        const bounds = boundsRef.current;
        const sw = bounds?.getSouthWest();
        const ne = bounds?.getNorthEast();
        
        const data = await MapService.getAmenities({
          category: selectedCategory,
          sw_lat: sw?.lat,
          sw_lng: sw?.lng,
          ne_lat: ne?.lat,
          ne_lng: ne?.lng,
          station: selectedStation ? selectedStation.code : undefined
        });
        setAmenities(data);
      } catch (err) {
        console.error("Failed to fetch amenities", err);
      }
    }, 500);

    return () => clearTimeout(debounceTimer);
  }, [selectedCategory, selectedStation, initData, boundsRef.current]);

  useEffect(() => {
    if (!selectedStation) {
      setBusStops([]);
      return;
    }
    
    MapService.getBusStops(selectedStation.id).then(stops => {
      setBusStops(stops);
    });
    
    if (selectedStation.latitude && selectedStation.longitude) {
      setMapCenter([Number(selectedStation.latitude), Number(selectedStation.longitude)]);
    }
  }, [selectedStation]);


  const handleBoundsChanged = (bounds: L.LatLngBounds) => {
    boundsRef.current = bounds;
    // We force re-render by calling a dummy state or just rely on ref 
    // In strict react, we might want to store bounds object in state but it causes too many renders.
    // Instead we can use a small counter or just let it be if we want it to trigger the effect.
    // However, since `useEffect` deps has `boundsRef.current`, it won't retrigger unless state changes.
    // Let's use a small counter to trigger refresh
    setRefreshTick(t => t + 1);
  };
  const [refreshTick, setRefreshTick] = useState(0);

  const handleStationClick = (station: StationMap) => {
    setSelectedStation(station);
    setSelectedAmenity(null);
  };

  const handleAmenityClick = (amenity: AmenityMap) => {
    setSelectedAmenity(amenity);
    if (amenity.latitude && amenity.longitude) {
      setMapCenter([Number(amenity.latitude), Number(amenity.longitude)]);
    }
  };

  if (!initData) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // HCM Center
  const defaultCenter: [number, number] = [10.795, 106.74];

  return (
    <div className="relative w-full h-[calc(100vh-80px)] overflow-hidden bg-slate-50">
      
      <FilterBar 
        categories={initData.categories} 
        selectedCategory={selectedCategory} 
        onSelectCategory={setSelectedCategory} 
      />
      
      <SearchBar onSelectStation={handleStationClick} />

      <MapContainer 
        center={defaultCenter} 
        zoom={13} 
        style={{ height: '100%', width: '100%', zIndex: 0 }}
        zoomControl={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        />

        <MapEvents onBoundsChanged={handleBoundsChanged} />
        {mapCenter && <MapController center={mapCenter} />}

        {/* Lines */}
        {initData.lines.map(line => {
          if (!line.geojson_coordinates) return null;
          const positions: [number, number][] = line.geojson_coordinates.map(c => [c[1], c[0]]);
          return (
            <div key={line.id}>
              {/* Glow */}
              <Polyline 
                positions={positions} 
                pathOptions={{ color: line.color_hex || '#0066CC', weight: (line.stroke_weight || 5) + 4, opacity: 0.3 }} 
              />
              {/* Main Line */}
              <Polyline 
                positions={positions} 
                pathOptions={{ color: line.color_hex || '#0066CC', weight: line.stroke_weight || 5 }} 
              />
            </div>
          );
        })}

        {/* Stations */}
        {initData.stations.map(station => {
          if (!station.latitude || !station.longitude) return null;
          return (
            <CircleMarker
              key={station.id}
              center={[Number(station.latitude), Number(station.longitude)]}
              pathOptions={{ fillColor: '#ffffff', fillOpacity: 1, color: '#0055A5', weight: 3 }}
              radius={6}
              eventHandlers={{ click: () => handleStationClick(station) }}
            >
              <Tooltip direction="top" offset={[0, -10]} opacity={1}>
                {station.name}
              </Tooltip>
            </CircleMarker>
          );
        })}

        {/* Bus Stops */}
        {busStops.map(stop => {
          if (!stop.latitude || !stop.longitude) return null;
          return (
            <Marker
              key={stop.id}
              position={[Number(stop.latitude), Number(stop.longitude)]}
              icon={busIcon}
            >
              <Tooltip direction="top" offset={[0, -10]}>
                {stop.name}
              </Tooltip>
            </Marker>
          );
        })}

        {/* Amenities */}
        {amenities.map(amenity => {
          if (!amenity.latitude || !amenity.longitude) return null;
          return (
            <Marker
              key={amenity.id}
              position={[Number(amenity.latitude), Number(amenity.longitude)]}
              icon={createAmenityIcon(amenity.category_slug)}
              eventHandlers={{ click: () => handleAmenityClick(amenity) }}
            >
              <Tooltip direction="top" offset={[0, -10]}>
                {amenity.name}
              </Tooltip>
            </Marker>
          );
        })}
      </MapContainer>

      {/* Floating Amenity Panel */}
      {selectedAmenity && (
        <AmenityPopup 
          amenity={selectedAmenity} 
          onClose={() => setSelectedAmenity(null)} 
        />
      )}
    </div>
  );
}
