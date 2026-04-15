'use client';

import * as React from "react";
import { Check, ChevronsUpDown, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export function StationSelect({
  value,
  onChange,
  stations = [],
  placeholder = "Chọn ga"
}: {
  value: any | null;
  onChange: (v: any | null) => void;
  stations: any[];
  placeholder?: string;
}) {
  const [open, setOpen] = React.useState(false);
  const [searchTerm, setSearchTerm] = React.useState("");

  const filteredStations = (stations || []).filter(s => 
    s?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (s?.code && s?.code?.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between bg-white text-gray-900 border-gray-200 hover:bg-gray-50 h-12 rounded-2xl shadow-sm"
        >
          <span className={cn("truncate font-medium", !value && "text-gray-400")}>
            {value ? value.name : placeholder}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 border-gray-200 rounded-2xl shadow-2xl overflow-hidden" align="start">
        <div className="flex flex-col bg-white max-h-[400px]">
          {/* Custom Search Input */}
          <div className="flex items-center px-3 py-3 border-b border-gray-100 bg-gray-50/50">
            <Search className="mr-2 h-4 w-4 shrink-0 text-gray-400" />
            <input
              className="flex h-10 w-full rounded-md bg-transparent text-sm outline-none placeholder:text-gray-400 text-gray-900"
              placeholder="Tìm ga..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              autoFocus
            />
          </div>

          {/* Custom List */}
          <div className="overflow-y-auto no-scrollbar py-2">
            {filteredStations.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-gray-400 italic">
                Không tìm thấy ga phù hợp.
              </div>
            ) : (
              <div className="px-1 space-y-0.5">
                <div className="px-3 py-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                  Danh sách ga
                </div>
                {filteredStations.map((s) => {
                  const isSelected = String(value?.id) === String(s.id);
                  return (
                    <button
                      key={s.id}
                      onClick={() => {
                        console.log("Station selected:", s.name);
                        onChange(s);
                        setOpen(false);
                        setSearchTerm("");
                      }}
                      className={cn(
                        "w-full flex items-center px-3 py-3 text-sm rounded-xl transition-all duration-200 text-left",
                        isSelected 
                          ? "bg-blue-50 text-blue-700 font-bold" 
                          : "text-gray-700 hover:bg-gray-50"
                      )}
                    >
                      <div className="flex-1 flex items-center gap-2">
                        <Check className={cn(
                          "h-4 w-4 text-blue-600 shrink-0",
                          isSelected ? "opacity-100" : "opacity-0"
                        )} />
                        <span className="truncate">{s.name}</span>
                      </div>
                      <span className="text-[10px] font-mono text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded uppercase">
                        {s.code || 'ST'}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
