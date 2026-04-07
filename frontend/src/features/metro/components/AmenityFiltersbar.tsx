import React from "react";
import { MapPin, Search, SlidersHorizontal, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { TYPE_LABELS } from "@/features/metro/constants/amenity";
import { AmenityType, MetroStation } from "@/types/amenity";

interface AmenityFiltersBarProps {
  search: string;
  stationId: string;
  type: AmenityType;
  stations: MetroStation[];
  onSearchChange: (value: string) => void;
  onStationChange: (value: string) => void;
  onTypeChange: (value: AmenityType) => void;
}

const TYPE_OPTIONS: Array<{ value: AmenityType; label: string }> = [
  { value: "all", label: "Tat ca" },
  { value: "cafe", label: TYPE_LABELS.cafe },
  { value: "restaurant", label: TYPE_LABELS.restaurant },
  { value: "shopping", label: TYPE_LABELS.shopping },
  { value: "hotel", label: TYPE_LABELS.hotel },
  { value: "service", label: TYPE_LABELS.service },
];

export const AmenityFiltersBar: React.FC<AmenityFiltersBarProps> = ({
  search,
  stationId,
  type,
  stations,
  onSearchChange,
  onStationChange,
  onTypeChange,
}) => {
  const hasActiveFilters = Boolean(search || stationId || type !== "all");

  return (
    <div className="rounded-[28px] border border-slate-200/80 bg-white p-4 shadow-[0_18px_60px_rgba(15,23,42,0.06)] sm:p-5">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-3 lg:flex-row">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              value={search}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder="Tim ten quan, dich vu hoac dia chi..."
              className="h-12 rounded-2xl border-slate-200 bg-slate-50/80 pl-11 pr-11 shadow-none focus-visible:ring-[#0055A5]/20"
            />
            {search ? (
              <button
                type="button"
                onClick={() => onSearchChange("")}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 transition-colors hover:text-slate-700"
                aria-label="Xoa tu khoa tim kiem"
              >
                <X className="h-4 w-4" />
              </button>
            ) : null}
          </div>

          <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] lg:min-w-[360px] lg:grid-cols-[minmax(0,1fr)_auto]">
            <Select value={stationId || "all"} onValueChange={(value) => onStationChange(value === "all" ? "" : value)}>
              <SelectTrigger className="h-12 rounded-2xl border-slate-200 bg-slate-50/80 shadow-none">
                <div className="flex items-center gap-2 text-slate-700">
                  <MapPin className="h-4 w-4 text-[#0055A5]" />
                  <SelectValue placeholder="Tat ca nha ga" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tat ca nha ga</SelectItem>
                {stations.map((station) => (
                  <SelectItem key={station.id} value={station.id}>
                    {station.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {hasActiveFilters ? (
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  onSearchChange("");
                  onStationChange("");
                  onTypeChange("all");
                }}
                className="h-12 rounded-2xl border-slate-200 px-4"
              >
                Dat lai
              </Button>
            ) : (
              <div className="hidden h-12 items-center rounded-2xl border border-dashed border-slate-200 px-4 text-sm text-slate-400 lg:flex">
                Bo loc sach
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="inline-flex items-center gap-2 text-sm font-medium text-slate-500">
            <SlidersHorizontal className="h-4 w-4" />
            Loai tien ich
          </div>
          <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
            {TYPE_OPTIONS.map((option) => {
              const active = option.value === type;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => onTypeChange(option.value)}
                  className={cn(
                    "whitespace-nowrap rounded-full border px-4 py-2 text-sm font-medium transition-all",
                    active
                      ? "border-[#0055A5] bg-[#0055A5] text-white shadow-[0_8px_20px_rgba(0,85,165,0.24)]"
                      : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900",
                  )}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
