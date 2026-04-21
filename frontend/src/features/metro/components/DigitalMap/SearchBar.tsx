import { useState, useRef, useEffect } from "react";
import { Search, MapPin } from "lucide-react";
import { StationMap } from "@/types/map";
import { MapService } from "../../services/MapService";
import { Input } from "@/components/ui/input";

interface SearchBarProps {
  onSelectStation: (station: StationMap) => void;
}

export function SearchBar({ onSelectStation }: SearchBarProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<StationMap[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchStations = async () => {
      if (query.length > 1) {
        const data = await MapService.searchStations(query);
        setResults(data);
        setIsOpen(true);
      } else {
        setResults([]);
        setIsOpen(false);
      }
    };

    const debounce = setTimeout(fetchStations, 300);
    return () => clearTimeout(debounce);
  }, [query]);

  // Handle outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div className="absolute top-4 right-14 z-10 w-72" ref={containerRef}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => {
            if (results.length > 0) setIsOpen(true);
          }}
          placeholder="Tìm kiếm ga..."
          className="pl-9 bg-white shadow-sm rounded-full border-0 focus-visible:ring-primary focus-visible:ring-offset-0"
        />
      </div>

      {isOpen && results.length > 0 && (
        <div className="absolute top-full mt-2 w-full bg-white rounded-xl shadow-lg border overflow-hidden py-1">
          {results.map((st) => (
            <button
              key={st.id}
              onClick={() => {
                onSelectStation(st);
                setQuery("");
                setIsOpen(false);
              }}
              className="w-full flex items-center gap-3 px-4 py-2 hover:bg-slate-50 transition-colors text-left"
            >
              <div className="bg-primary/10 p-1.5 rounded-full">
                <MapPin className="h-4 w-4 text-primary" />
              </div>
              <div>
                <div className="text-sm font-medium">{st.name}</div>
                <div className="text-xs text-muted-foreground">Tuyến {st.code}</div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
