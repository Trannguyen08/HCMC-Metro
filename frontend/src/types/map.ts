export interface MetroLineMap {
  id: number;
  name: string;
  code: string;
  color_hex: string;
  stroke_weight: number;
  geojson_coordinates: [number, number][]; // [longitude, latitude]
  status: string;
}

export interface StationMap {
  id: number;
  name: string;
  code: string;
  latitude: number | null;
  longitude: number | null;
  sequence_order: number;
}

export interface AmenityCategoryMap {
  id: number;
  name: string;
  slug: string;
  icon_svg: string;
  color_hex: string;
  bg_color_hex: string;
  sort_order: number;
}

export interface AmenityMap {
  id: string;
  name: string;
  slug: string;
  category_slug: string;
  category_name: string;
  address: string;
  distance_meters: number | null;
  latitude: number | null;
  longitude: number | null;
  image_url: string | null;
  opening_hours: string | null;
  rating: number | null;
  station_code: string | null;
}

export interface BusStopCacheMap {
  id: number;
  name: string;
  code: string;
  latitude: number;
  longitude: number;
  address: string | null;
  routes: string[] | null;
  distance_to_station: number | null;
}

export interface BusSchedule {
  route_number: string;
  destination: string;
  color: string;
  arrival_in_minutes: number;
  status: string;
}

export interface MapInitData {
  lines: MetroLineMap[];
  stations: StationMap[];
  categories: AmenityCategoryMap[];
}
