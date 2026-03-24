// src/hooks/useAmenities.ts

import { useState, useEffect, useCallback } from 'react';
import { Amenity, AmenityFilters, AmenityType, MetroStation } from '@/types/amenity';
import { fetchAmenities, fetchStations } from '@/features/metro/services/AmenityService';

interface UseAmenitiesReturn {
  amenities: Amenity[];
  stations: MetroStation[];
  filters: AmenityFilters;
  loading: boolean;
  error: string | null;
  total: number;
  setSearch: (value: string) => void;
  setStationId: (value: string) => void;
  setType: (value: AmenityType) => void;
  resetFilters: () => void;
}

const DEFAULT_FILTERS: AmenityFilters = {
  search: '',
  stationId: '',
  type: 'all',
};

export function useAmenities(): UseAmenitiesReturn {
  const [amenities, setAmenities] = useState<Amenity[]>([]);
  const [stations, setStations] = useState<MetroStation[]>([]);
  const [filters, setFilters] = useState<AmenityFilters>(DEFAULT_FILTERS);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);

  // Load stations once
  useEffect(() => {
    fetchStations().then(setStations).catch(() => setStations([]));
  }, []);

  // Load amenities whenever filters change (debounced for search)
  const loadAmenities = useCallback(async (currentFilters: AmenityFilters) => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchAmenities(currentFilters);
      setAmenities(result.data);
      setTotal(result.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Có lỗi xảy ra');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => loadAmenities(filters), 300);
    return () => clearTimeout(timeout);
  }, [filters, loadAmenities]);

  const setSearch    = (search: string)    => setFilters((f) => ({ ...f, search }));
  const setStationId = (stationId: string) => setFilters((f) => ({ ...f, stationId }));
  const setType      = (type: AmenityType) => setFilters((f) => ({ ...f, type }));
  const resetFilters = ()                  => setFilters(DEFAULT_FILTERS);

  return { amenities, stations, filters, loading, error, total, setSearch, setStationId, setType, resetFilters };
}