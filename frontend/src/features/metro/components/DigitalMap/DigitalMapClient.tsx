"use client";

import { useEffect, useRef, useState } from "react";
import {
  CircleMarker,
  MapContainer,
  Marker,
  Polyline,
  Popup,
  TileLayer,
  Tooltip,
  useMap,
  useMapEvents,
} from "react-leaflet";
import L from "leaflet";

import { AmenityMap, BusStopMap, MapInitData, StationMap } from "@/types/map";
import { MapService } from "../../services/MapService";
import { FilterBar } from "./FilterBar";
import { AmenityPopup } from "./AmenityPopup";
import { BusStopPopup } from "./BusStopPopup";

delete (L.Icon.Default.prototype as { _getIconUrl?: unknown })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

const AMENITY_ICONS: Record<string, { color: string; path: string }> = {
  cafe: {
    color: "#D97706",
    path: '<path d="M18 8h1a4 4 0 0 1 0 8h-1"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/><line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/>',
  },
  restaurant: {
    color: "#059669",
    path: '<path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"/>',
  },
  shopping: {
    color: "#DB2777",
    path: '<path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/>',
  },
  hotel: {
    color: "#2563EB",
    path: '<path d="M2 4v16"/><path d="M2 8h18a2 2 0 0 1 2 2v10"/><path d="M2 17h20"/><path d="M6 8v9"/>',
  },
  service: {
    color: "#475569",
    path: '<path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7"/><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4"/><path d="M2 7h20"/><path d="M22 7v3a2 2 0 0 1-2 2v0a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 16 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 12 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 8 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 4 10V7"/>',
  },
};

const createAmenityIcon = (categorySlug: string) => {
  const config = AMENITY_ICONS[categorySlug] || {
    color: "#2563EB",
    path: '<circle cx="12" cy="12" r="10"/>',
  };

  return L.divIcon({
    html: `
      <div style="
        background-color: ${config.color};
        width: 32px;
        height: 32px;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        display: flex;
        align-items: center;
        justify-content: center;
        border: 2px solid white;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
      ">
        <svg xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="white"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          style="transform: rotate(45deg); width: 18px; height: 18px;">
          ${config.path}
        </svg>
      </div>
    `,
    className: "",
    iconSize: [32, 32],
    iconAnchor: [16, 32],
  });
};

const createBusIcon = (color: string, glow = false) =>
  L.divIcon({
    html: `
      <div style="
        background-color: ${color};
        width: 32px;
        height: 32px;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg) ${glow ? "scale(1.12)" : ""};
        display: flex;
        align-items: center;
        justify-content: center;
        border: 2px solid white;
        box-shadow: ${glow ? "0 0 14px rgba(8,145,178,0.5)" : "0 2px 4px rgba(0,0,0,0.3)"};
      ">
        <svg xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="white"
          stroke-width="1.8"
          stroke-linecap="round"
          stroke-linejoin="round"
          style="transform: rotate(45deg); width: 18px; height: 18px;">
          <path d="M8 6v6"/>
          <path d="M15 6v6"/>
          <path d="M2 12h19.6"/>
          <path d="M18 18h3s.5-1.7.8-2.8c.1-.4.2-.8.2-1.2 0-.4-.1-.8-.2-1.2l-1.4-5C20.1 6.8 19.1 6 18 6H4a2 2 0 0 0-2 2v10h3"/>
          <circle cx="7" cy="18" r="2"/>
          <path d="M9 18h5"/>
          <circle cx="16" cy="18" r="2"/>
        </svg>
      </div>
    `,
    className: "",
    iconSize: [32, 32],
    iconAnchor: [16, 32],
  });

const busIcon = createBusIcon("#0891B2");
const busIconActive = createBusIcon("#06B6D4", true);

function MapEvents({ onBoundsChanged }: { onBoundsChanged: (bounds: L.LatLngBounds) => void }) {
  useMapEvents({
    moveend: (event: L.LeafletEvent) => {
      onBoundsChanged(event.target.getBounds());
    },
  });
  return null;
}

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
  const [busStops, setBusStops] = useState<BusStopMap[]>([]);
  const [selectedStation, setSelectedStation] = useState<StationMap | null>(null);
  const [mapCenter, setMapCenter] = useState<[number, number] | undefined>(undefined);
  const [refreshTick, setRefreshTick] = useState(0);
  const boundsRef = useRef<L.LatLngBounds | null>(null);

  useEffect(() => {
    let active = true;
    MapService.getInitData().then((data) => {
      if (active) {
        setInitData(data);
      }
    });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!initData) return;

    const timer = setTimeout(async () => {
      try {
        if (selectedCategory === "bus") {
          setAmenities([]);
          return;
        }

        const bounds = boundsRef.current;
        const sw = bounds?.getSouthWest();
        const ne = bounds?.getNorthEast();

        const data = await MapService.getAmenities({
          category: selectedCategory,
          station: selectedStation?.code,
          sw_lat: sw?.lat,
          sw_lng: sw?.lng,
          ne_lat: ne?.lat,
          ne_lng: ne?.lng,
        });
        setAmenities(data);
      } catch (error) {
        console.error("Failed to fetch amenities", error);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [initData, refreshTick, selectedCategory, selectedStation]);

  useEffect(() => {
    if (!initData) return;

    const bounds = boundsRef.current;
    const sw = bounds?.getSouthWest();
    const ne = bounds?.getNorthEast();

    MapService.getBusStops({
      station: selectedStation?.code,
      sw_lat: sw?.lat,
      sw_lng: sw?.lng,
      ne_lat: ne?.lat,
      ne_lng: ne?.lng,
    })
      .then((stops) => {
        setBusStops(stops);
      })
      .catch((error) => {
        console.error("Failed to fetch bus stops", error);
      });
  }, [initData, refreshTick, selectedStation]);

  useEffect(() => {
    if (selectedStation?.latitude && selectedStation?.longitude) {
      setMapCenter([Number(selectedStation.latitude), Number(selectedStation.longitude)]);
    }
  }, [selectedStation]);

  const handleBoundsChanged = (bounds: L.LatLngBounds) => {
    boundsRef.current = bounds;
    setRefreshTick((value) => value + 1);
  };

  const handleStationClick = (station: StationMap) => {
    setSelectedStation(station);
  };

  if (!initData) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-slate-50">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-primary" />
      </div>
    );
  }

  const defaultCenter: [number, number] = [10.795, 106.74];

  return (
    <div className="relative h-[calc(100vh-80px)] w-full overflow-hidden bg-slate-50">
      <FilterBar
        categories={initData.categories}
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
      />

      <MapContainer
        center={defaultCenter}
        zoom={13}
        style={{ height: "100%", width: "100%", zIndex: 0 }}
        zoomControl
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        />

        <MapEvents onBoundsChanged={handleBoundsChanged} />
        {mapCenter ? <MapController center={mapCenter} /> : null}

        {initData.lines.map((line) => {
          if (!line.geojson_coordinates) return null;
          
          // Hỗ trợ cả mảng trực tiếp hoặc object GeoJSON {type: "LineString", coordinates: [...]}
          const coords = Array.isArray(line.geojson_coordinates) 
            ? line.geojson_coordinates 
            : line.geojson_coordinates.coordinates;
            
          if (!Array.isArray(coords)) return null;
          
          const positions: [number, number][] = coords.map((coordinate: any) => [coordinate[1], coordinate[0]]);
          return (
            <div key={line.id}>
              <Polyline
                positions={positions}
                pathOptions={{ color: line.color_hex || "#0066CC", weight: (line.stroke_weight || 5) + 4, opacity: 0.3 }}
              />
              <Polyline
                positions={positions}
                pathOptions={{ color: line.color_hex || "#0066CC", weight: line.stroke_weight || 5 }}
              />
            </div>
          );
        })}

        {initData.stations.map((station) => {
          if (!station.latitude || !station.longitude) return null;
          return (
            <CircleMarker
              key={station.id}
              center={[Number(station.latitude), Number(station.longitude)]}
              pathOptions={{ fillColor: "#ffffff", fillOpacity: 1, color: "#0055A5", weight: 3 }}
              radius={6}
              eventHandlers={{ click: () => handleStationClick(station) }}
            >
              <Tooltip direction="top" offset={[0, -10]} opacity={1}>
                {station.name}
              </Tooltip>
            </CircleMarker>
          );
        })}

        {busStops.map((stop) => {
          if (!stop.latitude || !stop.longitude) return null;
          return (
            <Marker
              key={stop.id}
              position={[Number(stop.latitude), Number(stop.longitude)]}
              icon={selectedCategory === "bus" ? busIconActive : busIcon}
            >
              <Popup closeButton minWidth={300} className="amenity-custom-popup">
                <BusStopPopup stop={stop} />
              </Popup>
              <Tooltip direction="top" offset={[0, -10]}>
                {stop.name}
              </Tooltip>
            </Marker>
          );
        })}

        {amenities.map((amenity) => {
          if (!amenity.latitude || !amenity.longitude) return null;
          return (
            <Marker
              key={amenity.id}
              position={[Number(amenity.latitude), Number(amenity.longitude)]}
              icon={createAmenityIcon(amenity.category_slug)}
            >
              <Popup closeButton minWidth={300} className="amenity-custom-popup">
                <AmenityPopup amenity={amenity} />
              </Popup>
              <Tooltip direction="top" offset={[0, -10]}>
                {amenity.name}
              </Tooltip>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}
