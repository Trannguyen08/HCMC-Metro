// src/features/metro/services/amenityService.ts

import api from '@/lib/api';
import { Amenity, AmenitiesResponse, MetroStation, AmenityFilters } from '../../../types/amenity';
import { MOCK_AMENITIES, MOCK_STATIONS } from '../../../lib/mock';
import { buildAmenityDetail } from '../utils/amenity';

const USE_MOCK_FALLBACK = true;

export async function fetchStations(): Promise<MetroStation[]> {
  try {
    const response = await api.get<MetroStation[]>('/metro/stations/');
    if (response.data && response.data.length > 0) {
      return response.data;
    }
    if (USE_MOCK_FALLBACK) return MOCK_STATIONS;
    return [];
  } catch {
    if (USE_MOCK_FALLBACK) return MOCK_STATIONS;
    throw new Error('Không thể tải danh sách ga.');
  }
}

export async function fetchAmenities(
  filters: Partial<AmenityFilters> = {}
): Promise<AmenitiesResponse> {
  try {
    const params: Record<string, string> = {};
    if (filters.search) params.search = filters.search;
    if (filters.stationId) params.station = filters.stationId;
    if (filters.type && filters.type !== 'all') params.type = filters.type;

    const response = await api.get<AmenitiesResponse>('/metro/amenities/', { params });

    if (response.data?.data) {
      return {
        ...response.data,
        data: response.data.data.map(buildAmenityDetail),
      };
    }

    if (USE_MOCK_FALLBACK) {
      return getMockAmenities(filters);
    }
    return { data: [], total: 0 };
  } catch {
    if (USE_MOCK_FALLBACK) {
      return getMockAmenities(filters);
    }
    throw new Error('Không thể tải danh sách tiện ích.');
  }
}

export async function fetchAmenityDetail(id: string): Promise<Amenity | null> {
  try {
    const response = await api.get<Amenity>(`/metro/amenities/${id}/`);

    if (response.data?.id) {
      return buildAmenityDetail(response.data);
    }

    if (USE_MOCK_FALLBACK) {
      return getMockAmenityDetail(id);
    }

    return null;
  } catch {
    if (USE_MOCK_FALLBACK) {
      return getMockAmenityDetail(id);
    }
    throw new Error('Không thể tải chi tiết tiện ích.');
  }
}

function getMockAmenities(filters: Partial<AmenityFilters>): AmenitiesResponse {
  let result = MOCK_AMENITIES.map(buildAmenityDetail);

  if (filters.stationId) {
    result = result.filter((a) => a.stationId === filters.stationId);
  }

  if (filters.type && filters.type !== 'all') {
    result = result.filter((a) => a.type === filters.type);
  }

  if (filters.search) {
    const keyword = filters.search.toLowerCase();
    result = result.filter(
      (a) =>
        a.name.toLowerCase().includes(keyword) ||
        a.address.toLowerCase().includes(keyword)
    );
  }

  return { data: result, total: result.length };
}

function getMockAmenityDetail(id: string): Amenity | null {
  const amenity = MOCK_AMENITIES.find((item) => item.id === id);
  return amenity ? buildAmenityDetail(amenity) : null;
}


