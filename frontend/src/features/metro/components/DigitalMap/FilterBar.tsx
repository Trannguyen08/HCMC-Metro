import { LayoutGrid, Bus } from "lucide-react";
import { AmenityCategoryMap } from "@/types/map";
import { cn } from "@/lib/utils";

interface FilterBarProps {
  categories: AmenityCategoryMap[];
  selectedCategory: string;
  onSelectCategory: (slug: string) => void;
}

export function FilterBar({ categories, selectedCategory, onSelectCategory }: FilterBarProps) {
  return (
    <div className="absolute left-4 top-4 z-10 flex max-w-[calc(100vw-80px)] flex-wrap gap-2 rounded-2xl border bg-white/80 p-2 shadow-sm backdrop-blur-md">
      <button
        onClick={() => onSelectCategory("all")}
        className={cn(
          "flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium transition-all",
          selectedCategory === "all"
            ? "bg-primary text-primary-foreground shadow-md"
            : "bg-white text-slate-700 hover:bg-slate-100"
        )}
      >
        <LayoutGrid className="h-4 w-4" />
        Tất cả
      </button>
      <button
        onClick={() => onSelectCategory("bus")}
        className={cn(
          "flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium transition-all",
          selectedCategory === "bus"
            ? "bg-cyan-600 text-white shadow-md"
            : "bg-cyan-50 text-cyan-700 hover:bg-cyan-100"
        )}
      >
        <Bus className="h-4 w-4" />
        Trạm bus
      </button>
      {categories.map((cat) => (
        <button
          key={cat.id}
          onClick={() => onSelectCategory(cat.slug)}
          style={
            selectedCategory === cat.slug
              ? { backgroundColor: cat.color_hex, color: "white" }
              : { backgroundColor: cat.bg_color_hex, color: cat.color_hex }
          }
          className={cn(
            "flex items-center gap-1.5 overflow-hidden rounded-xl px-3 py-2 text-sm font-medium transition-all",
            selectedCategory === cat.slug ? "shadow-md" : "hover:brightness-95"
          )}
        >
          <div
            className="h-4 w-4 [&>svg]:h-full [&>svg]:w-full"
            dangerouslySetInnerHTML={{ __html: cat.icon_svg }}
          />
          {cat.name}
        </button>
      ))}
    </div>
  );
}
