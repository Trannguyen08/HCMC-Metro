// src/features/metro/components/AmenityFiltersBar.tsx

import React, { useRef, useEffect, useState } from 'react';
import { Search, ChevronDown, Filter, X } from 'lucide-react';
import { AmenityType, MetroStation } from '../../../types/amenity';

interface AmenityFiltersBarProps {
  search: string;
  stationId: string;
  type: AmenityType;
  stations: MetroStation[];
  onSearchChange: (value: string) => void;
  onStationChange: (value: string) => void;
  onTypeChange: (value: AmenityType) => void;
}

const TYPE_OPTIONS: { value: AmenityType; label: string; emoji: string }[] = [
  { value: 'all',        label: 'Tất cả',    emoji: '🏙️' },
  { value: 'cafe',       label: 'Cà phê',    emoji: '☕' },
  { value: 'restaurant', label: 'Nhà hàng',  emoji: '🍜' },
  { value: 'shopping',   label: 'Mua sắm',   emoji: '🛍️' },
  { value: 'hotel',      label: 'Khách sạn', emoji: '🏨' },
  { value: 'service',    label: 'Dịch vụ',   emoji: '🏛️' },
];

// ─── Station Dropdown ────────────────────────────────────────────────────────

interface StationDropdownProps {
  stations: MetroStation[];
  stationId: string;
  onChange: (value: string) => void;
}

const StationDropdown: React.FC<StationDropdownProps> = ({ stations, stationId, onChange }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const selected = stations.find((s) => s.id === stationId);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-700 hover:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all min-w-[180px]"
      >
        <span className="text-blue-500 text-base">📍</span>
        <span className="flex-1 text-left truncate">
          {selected ? selected.name : 'Tất cả các ga'}
        </span>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute left-0 top-full mt-1 z-50 bg-white border border-gray-100 rounded-xl shadow-lg min-w-[220px] py-1 max-h-64 overflow-y-auto">
          <button
            className={`w-full text-left px-4 py-2.5 text-sm hover:bg-blue-50 transition-colors ${
              !stationId ? 'text-blue-600 font-semibold' : 'text-gray-700'
            }`}
            onClick={() => { onChange(''); setOpen(false); }}
          >
            Tất cả các ga
          </button>
          {stations.map((station) => (
            <button
              key={station.id}
              className={`w-full text-left px-4 py-2.5 text-sm hover:bg-blue-50 transition-colors ${
                stationId === station.id ? 'text-blue-600 font-semibold bg-blue-50' : 'text-gray-700'
              }`}
              onClick={() => { onChange(station.id); setOpen(false); }}
            >
              {station.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// ─── Type Dropdown ────────────────────────────────────────────────────────────

interface TypeDropdownProps {
  type: AmenityType;
  onChange: (value: AmenityType) => void;
}

const TypeDropdown: React.FC<TypeDropdownProps> = ({ type, onChange }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const selected = TYPE_OPTIONS.find((o) => o.value === type) ?? TYPE_OPTIONS[0];

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-700 hover:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all min-w-[180px]"
      >
        <Filter className="w-4 h-4 text-gray-400" />
        <span className="flex-1 text-left">{selected.label}</span>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 z-50 bg-white border border-gray-100 rounded-xl shadow-lg min-w-[180px] py-1">
          {TYPE_OPTIONS.map((option) => (
            <button
              key={option.value}
              className={`w-full text-left px-4 py-2.5 text-sm flex items-center gap-2.5 hover:bg-blue-50 transition-colors ${
                type === option.value ? 'text-blue-600 font-semibold bg-blue-50' : 'text-gray-700'
              }`}
              onClick={() => { onChange(option.value); setOpen(false); }}
            >
              <span>{option.emoji}</span>
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// ─── Main FiltersBar ──────────────────────────────────────────────────────────

export const AmenityFiltersBar: React.FC<AmenityFiltersBarProps> = ({
  search, stationId, type, stations,
  onSearchChange, onStationChange, onTypeChange,
}) => {
  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
      {/* Search input */}
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Tìm tên quán, món ăn..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full pl-10 pr-10 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-700 placeholder-gray-400 hover:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all"
        />
        {search && (
          <button
            onClick={() => onSearchChange('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Station dropdown */}
      <StationDropdown
        stations={stations}
        stationId={stationId}
        onChange={onStationChange}
      />

      {/* Type dropdown */}
      <TypeDropdown type={type} onChange={onTypeChange} />
    </div>
  );
};