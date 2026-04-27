import api from "@/lib/api";
import { AmenityMap, BusSchedule, BusStopMap, MapInitData, StationMap } from "@/types/map";

export class MapService {
  /**
   * Fetches the initial Map Data (Lines, Stations, Categories).
   */
  static async getInitData(): Promise<MapInitData> {
    const res = await api.get<MapInitData>("/map/init/");
    return res.data;
  }

  /**
   * Fetches amenities bounded by coordinates. optionally filtered by station or category
   */
  static async getAmenities(params: {
    category?: string;
    station?: string;
    sw_lat?: number;
    sw_lng?: number;
    ne_lat?: number;
    ne_lng?: number;
  }): Promise<AmenityMap[]> {
    const res = await api.get<AmenityMap[]>("/map/amenities/", { params });
    return res.data;
  }

  /**
   * Search stations by name
   */
  static async searchStations(q: string): Promise<StationMap[]> {
    if (!q.trim()) return [];
    const res = await api.get<StationMap[]>("/map/stations/search/", { params: { q } });
    return res.data;
  }

  /**
   * Fetch bus stops
   */
  static async getBusStops(params?: {
    stationId?: number;
    station?: string;
    sw_lat?: number;
    sw_lng?: number;
    ne_lat?: number;
    ne_lng?: number;
  }): Promise<BusStopMap[]> {
    const res = await api.get<BusStopMap[]>("/map/bus-stops/", {
      params: {
        station_id: params?.stationId,
        station: params?.station,
        sw_lat: params?.sw_lat,
        sw_lng: params?.sw_lng,
        ne_lat: params?.ne_lat,
        ne_lng: params?.ne_lng,
      },
    });
    return res.data;
  }
}
