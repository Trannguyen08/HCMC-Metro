"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Bus, MapPin, Navigation, Ticket, Train, X } from "lucide-react";
import {
  CircleMarker,
  MapContainer,
  Marker,
  TileLayer,
  Tooltip,
  useMap,
  useMapEvents,
} from "react-leaflet";
import L from "leaflet";

import { AmenityMap, BusStopMap, MapInitData, StationMap } from "@/types/map";
import { MapService } from "../../services/MapService";
import TrackingService, { LiveTrain } from "../../services/TrackingService";
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

const busIcon = createBusIcon("#0891B2", true);
const busIconActive = createBusIcon("#0284C7", true);

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const createStationIcon = (sequenceOrder: number, stationName: string, isSelected = false) =>
  L.divIcon({
    html: `
      <div style="position: relative; width: 34px; height: 34px;">
        <div style="
          position: absolute;
          bottom: 40px;
          left: 50%;
          transform: translateX(-50%);
          white-space: nowrap;
          background: ${isSelected ? "#0055A5" : "rgba(255, 255, 255, 0.96)"};
          color: ${isSelected ? "#FFFFFF" : "#0F172A"};
          font-size: 11px;
          font-weight: 700;
          line-height: 1.2;
          padding: 3px 8px;
          border-radius: 9999px;
          border: 1.5px solid ${isSelected ? "#FFFFFF" : "#1D4ED8"};
          box-shadow: 0 2px 8px rgba(15, 23, 42, 0.22);
          pointer-events: auto;
        ">Ga ${escapeHtml(stationName)}</div>
        <div style="
          position: relative;
          background: ${isSelected ? "#0F172A" : "#1D4ED8"};
          width: 34px;
          height: 34px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 2.5px solid #FFFFFF;
          box-shadow: ${isSelected ? "0 0 0 4px rgba(37,99,235,0.45), 0 4px 10px rgba(0,0,0,0.4)" : "0 3px 8px rgba(15,23,42,0.45)"};
        ">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="width: 18px; height: 18px;">
            <rect width="16" height="16" x="4" y="3" rx="2"/>
            <path d="M4 11h16"/>
            <path d="M12 3v8"/>
            <path d="m8 19-2 3"/>
            <path d="m18 22-2-3"/>
            <circle cx="8.5" cy="15" r="1" fill="white"/>
            <circle cx="15.5" cy="15" r="1" fill="white"/>
          </svg>
          <span style="
            position: absolute;
            top: -7px;
            right: -7px;
            background: #F59E0B;
            color: #111827;
            font-size: 10px;
            font-weight: 800;
            line-height: 1;
            padding: 2px 4px;
            border-radius: 9999px;
            border: 1.5px solid white;
            box-shadow: 0 1px 3px rgba(0,0,0,0.3);
          ">${sequenceOrder}</span>
        </div>
      </div>
    `,
    className: "",
    iconSize: [34, 34],
    iconAnchor: [17, 17],
  });

const createTrainIcon = (direction: "outbound" | "inbound") =>
  L.divIcon({
    html: `
      <div style="
        background-color: ${direction === "outbound" ? "#2563EB" : "#059669"};
        width: 28px;
        height: 28px;
        border-radius: 9999px;
        display: flex;
        align-items: center;
        justify-content: center;
        border: 2px solid white;
        box-shadow: 0 0 10px ${direction === "outbound" ? "rgba(37,99,235,0.6)" : "rgba(5,150,105,0.6)"};
      ">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: 15px; height: 15px;">
          <rect width="16" height="16" x="4" y="3" rx="2"/><path d="M4 11h16"/><path d="M12 3v8"/><path d="m8 19-2 3"/><path d="m18 22-2-3"/><path d="M8 15h.01"/><path d="M16 15h.01"/>
        </svg>
      </div>
    `,
    className: "",
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });

const outboundTrainIcon = createTrainIcon("outbound");
const inboundTrainIcon = createTrainIcon("inbound");

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

type SelectedMapItem =
  | { type: "bus"; data: BusStopMap }
  | { type: "station"; data: StationMap }
  | { type: "amenity"; data: AmenityMap }
  | null;

export default function DigitalMapClient() {
  const [initData, setInitData] = useState<MapInitData | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [amenities, setAmenities] = useState<AmenityMap[]>([]);
  const [busStops, setBusStops] = useState<BusStopMap[]>([]);
  const [liveTrains, setLiveTrains] = useState<LiveTrain[]>([]);
  const [selectedStation, setSelectedStation] = useState<StationMap | null>(null);
  const [selectedItem, setSelectedItem] = useState<SelectedMapItem>(null);
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
    const unsubscribe = TrackingService.subscribeToLiveTrains((trains) => {
      if (active) setLiveTrains(trains);
    });
    return () => {
      active = false;
      unsubscribe();
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
    setSelectedItem({ type: "station", data: station });
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
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapEvents onBoundsChanged={handleBoundsChanged} />
        {mapCenter ? <MapController center={mapCenter} /> : null}

        {initData.stations.map((station) => {
          if (!station.latitude || !station.longitude) return null;
          const isSelected = selectedStation?.id === station.id;
          return (
            <Marker
              key={station.id}
              position={[Number(station.latitude), Number(station.longitude)]}
              icon={createStationIcon(station.sequence_order, station.name, isSelected)}
              zIndexOffset={isSelected ? 1500 : 1000}
              eventHandlers={{ click: () => handleStationClick(station) }}
            />
          );
        })}

        {busStops.map((stop) => {
          if (!stop.latitude || !stop.longitude) return null;
          const isHighlighted =
            selectedCategory === "bus" ||
            (selectedStation && stop.station_code === selectedStation.code);
          return (
            <div key={stop.id}>
              <CircleMarker
                center={[Number(stop.latitude), Number(stop.longitude)]}
                radius={isHighlighted ? 20 : 14}
                pathOptions={{
                  color: "#06B6D4",
                  weight: isHighlighted ? 2 : 1,
                  fillColor: "#06B6D4",
                  fillOpacity: isHighlighted ? 0.28 : 0.14,
                }}
              />
              <Marker
                position={[Number(stop.latitude), Number(stop.longitude)]}
                icon={isHighlighted ? busIconActive : busIcon}
                eventHandlers={{
                  click: () => setSelectedItem({ type: "bus", data: stop }),
                }}
              >
                <Tooltip direction="top" offset={[0, -10]}>
                  {stop.name} {stop.routes?.length ? `(${stop.routes.slice(0, 4).join(", ")})` : ""}
                </Tooltip>
              </Marker>
            </div>
          );
        })}

        {liveTrains.map((train) => {
          if (!train.latitude || !train.longitude) return null;
          return (
            <Marker
              key={train.train_number}
              position={[Number(train.latitude), Number(train.longitude)]}
              icon={train.direction === "outbound" ? outboundTrainIcon : inboundTrainIcon}
              zIndexOffset={1200}
            >
              <Tooltip direction="top" offset={[0, -14]}>
                {train.train_number} • {train.status === "moving" ? `${train.speed_kph ?? 45} km/h` : "Đang dừng ga"} ({train.current_station.name})
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
              eventHandlers={{
                click: () => setSelectedItem({ type: "amenity", data: amenity }),
              }}
            >
              <Tooltip direction="top" offset={[0, -10]}>
                {amenity.name}
              </Tooltip>
            </Marker>
          );
        })}
      </MapContainer>

      {selectedItem ? (
        <aside className="absolute bottom-4 right-4 top-4 z-20 flex w-[calc(100%-2rem)] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white/95 shadow-2xl backdrop-blur-md sm:w-1/4 sm:min-w-[330px] sm:max-w-[440px]">
          <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/90 px-4 py-3">
            <div className="flex items-center gap-2 text-sm font-bold text-slate-800">
              {selectedItem.type === "bus" ? (
                <>
                  <Bus className="h-4 w-4 text-cyan-600" />
                  <span>Thông tin trạm xe buýt</span>
                </>
              ) : selectedItem.type === "station" ? (
                <>
                  <Train className="h-4 w-4 text-blue-600" />
                  <span>Thông tin nhà ga Metro</span>
                </>
              ) : (
                <>
                  <MapPin className="h-4 w-4 text-emerald-600" />
                  <span>Thông tin tiện ích</span>
                </>
              )}
            </div>
            <button
              type="button"
              onClick={() => setSelectedItem(null)}
              aria-label="Đóng bảng thông tin"
              className="rounded-lg p-1.5 text-slate-500 transition-colors hover:bg-slate-200/70 hover:text-slate-800"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            {selectedItem.type === "bus" ? (
              <BusStopPopup stop={selectedItem.data} fullWidth />
            ) : null}

            {selectedItem.type === "amenity" ? (
              <AmenityPopup amenity={selectedItem.data} fullWidth />
            ) : null}

            {selectedItem.type === "station" ? (
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-lg font-extrabold text-white shadow-sm">
                    {selectedItem.data.sequence_order}
                  </div>
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-wide text-blue-600">
                      Tuyến Metro số 1 • Mã {selectedItem.data.code}
                    </div>
                    <h3 className="text-lg font-bold text-slate-800">
                      Ga {selectedItem.data.name}
                    </h3>
                  </div>
                </div>

                <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                  <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Trạm xe buýt kết nối gần ga
                  </div>
                  {busStops.filter((bs) => bs.station_code === selectedItem.data.code).length > 0 ? (
                    <div className="space-y-2">
                      {busStops
                        .filter((bs) => bs.station_code === selectedItem.data.code)
                        .map((bs) => (
                          <button
                            key={bs.id}
                            type="button"
                            onClick={() => setSelectedItem({ type: "bus", data: bs })}
                            className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-left transition-all hover:border-cyan-400 hover:bg-cyan-50/40"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-xs font-bold text-slate-800">{bs.name}</span>
                              {bs.distance_to_station ? (
                                <span className="shrink-0 text-[11px] font-semibold text-cyan-700">
                                  {bs.distance_to_station}m
                                </span>
                              ) : null}
                            </div>
                            {bs.routes?.length ? (
                              <div className="mt-1.5 flex flex-wrap gap-1">
                                {bs.routes.slice(0, 6).map((r) => (
                                  <span
                                    key={r}
                                    className="rounded bg-cyan-100 px-1.5 py-0.5 text-[10px] font-bold text-cyan-800"
                                  >
                                    {r}
                                  </span>
                                ))}
                              </div>
                            ) : null}
                          </button>
                        ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500">
                      Đang tải hoặc chưa có trạm buýt liên kết trực tiếp trong vùng hiển thị.
                    </p>
                  )}
                </div>

                <div className="flex gap-2">
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${selectedItem.data.latitude},${selectedItem.data.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-blue-600 py-2.5 text-[13px] font-bold !text-white shadow-sm transition-all hover:bg-blue-700"
                  >
                    <Navigation className="h-4 w-4" />
                    Dẫn đường
                  </a>
                  <Link
                    href="/dat-ve"
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-slate-100 py-2.5 text-[13px] font-bold text-slate-800 transition-all hover:bg-slate-200"
                  >
                    <Ticket className="h-4 w-4 text-blue-600" />
                    Đặt vé Metro
                  </Link>
                </div>
              </div>
            ) : null}
          </div>
        </aside>
      ) : null}
    </div>
  );
}
