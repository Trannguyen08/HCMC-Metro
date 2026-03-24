'use client';

// src/features/metro/AmenitiesPage.tsx

import React from 'react';
import { Map } from 'lucide-react';
import { useAmenities } from '../../../hooks/useAmenities';
import { AmenityFiltersBar } from './AmenityFiltersbar';
import { AmenityCard } from './AmenityCard';
import { Amenity } from '../../../types/amenity';

// ─── Skeleton loader ──────────────────────────────────────────────────────────

const SkeletonCard: React.FC = () => (
  <div className="bg-white rounded-2xl overflow-hidden border border-gray-100 animate-pulse">
    <div className="h-48 bg-gray-200" />
    <div className="p-4 space-y-3">
      <div className="flex justify-between">
        <div className="h-5 w-20 bg-gray-200 rounded-full" />
        <div className="h-5 w-10 bg-gray-200 rounded-full" />
      </div>
      <div className="h-5 w-3/4 bg-gray-200 rounded-lg" />
      <div className="h-4 w-full bg-gray-100 rounded-lg" />
      <div className="h-4 w-2/3 bg-gray-100 rounded-lg" />
    </div>
  </div>
);

// ─── Empty state ──────────────────────────────────────────────────────────────

const EmptyState: React.FC<{ onReset: () => void }> = ({ onReset }) => (
  <div className="col-span-full flex flex-col items-center justify-center py-20 text-center">
    <div className="text-6xl mb-4">🔍</div>
    <h3 className="text-lg font-semibold text-gray-700 mb-2">Không tìm thấy tiện ích</h3>
    <p className="text-gray-500 text-sm mb-6">Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm</p>
    <button
      onClick={onReset}
      className="px-5 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors"
    >
      Xóa bộ lọc
    </button>
  </div>
);

// ─── Main Page ────────────────────────────────────────────────────────────────

const AmenitiesPage: React.FC = () => {
  const {
    amenities, stations, filters, loading, error, total,
    setSearch, setStationId, setType, resetFilters,
  } = useAmenities();

  const handleCardClick = (amenity: Amenity) => {
    // TODO: open detail modal or navigate
    console.log('Clicked:', amenity);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ── Header ── */}
      <div className="bg-white border-b border-gray-100 px-6 py-6">
        <div className="max-w-7xl mx-auto flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Khám phá Tiện ích</h1>
            <p className="text-gray-500 text-sm mt-0.5">
              Tìm kiếm nhà hàng, quán cafe quanh các ga.
            </p>
          </div>
          <button className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors shrink-0 shadow-sm">
            <Map className="w-4 h-4" />
            Bản đồ
          </button>
        </div>
      </div>

      {/* ── Filters ── */}
      <div className="bg-white border-b border-gray-100 px-6 py-4">
        <div className="max-w-7xl mx-auto">
          <AmenityFiltersBar
            search={filters.search}
            stationId={filters.stationId}
            type={filters.type}
            stations={stations}
            onSearchChange={setSearch}
            onStationChange={setStationId}
            onTypeChange={setType}
          />
        </div>
      </div>

      {/* ── Content ── */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Result count */}
        {!loading && !error && (
          <p className="text-sm text-gray-500 mb-4">
            {total > 0
              ? `Hiển thị ${amenities.length} / ${total} tiện ích`
              : ''}
          </p>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-100 text-red-600 rounded-xl px-4 py-3 text-sm mb-4">
            {error}
          </div>
        )}

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {loading ? (
            Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)
          ) : amenities.length === 0 ? (
            <EmptyState onReset={resetFilters} />
          ) : (
            amenities.map((amenity) => (
              <AmenityCard
                key={amenity.id}
                amenity={amenity}
                onClick={handleCardClick}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default AmenitiesPage;
