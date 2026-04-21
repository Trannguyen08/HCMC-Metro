import api from "@/lib/api";
import { AmenityMap, BusSchedule, BusStopCacheMap, MapInitData, StationMap } from "@/types/map";

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
  static async getBusStops(stationId?: number): Promise<BusStopCacheMap[]> {
    const res = await api.get<BusStopCacheMap[]>("/map/bus-stops/", { params: { station_id: stationId } });
    return res.data;
  }
}
