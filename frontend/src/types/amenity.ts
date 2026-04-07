// src/types/amenity.ts

export type AmenityType = 'all' | 'cafe' | 'restaurant' | 'shopping' | 'hotel' | 'service';

export interface MetroStation {
  id: string;
  name: string;
  nameEn?: string;
  line?: string;
}

export interface Amenity {
  id: string;
  name: string;
  type: Exclude<AmenityType, 'all'>;
  address: string;
  stationId: string;
  stationName: string;
  distanceMeters?: number;
  imageUrl: string;
  description?: string;
  rating?: number;
  openingHours?: string;
  phone?: string;
  website?: string;
  thumbnailUrl?: string;
  featuredImages?: string[];
  panoramaEmbedUrl?: string;
  overview?: string;
}

export interface AmenityFilters {
  search: string;
  stationId: string;
  type: AmenityType;
}

export interface AmenitiesResponse {
  data: Amenity[];
  total: number;
}
