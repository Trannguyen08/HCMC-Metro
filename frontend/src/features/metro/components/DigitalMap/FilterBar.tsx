import { AmenityCategoryMap } from "@/types/map";
import { cn } from "@/lib/utils";

interface FilterBarProps {
  categories: AmenityCategoryMap[];
  selectedCategory: string;
  onSelectCategory: (slug: string) => void;
}

export function FilterBar({ categories, selectedCategory, onSelectCategory }: FilterBarProps) {
  return (
    <div className="absolute top-4 left-4 z-10 flex flex-wrap gap-2 max-w-[calc(100vw-80px)] backdrop-blur-md bg-white/80 p-2 rounded-2xl shadow-sm border">
      <button
        onClick={() => onSelectCategory("all")}
        className={cn(
          "px-4 py-2 rounded-xl text-sm font-medium transition-all",
          selectedCategory === "all"
            ? "bg-primary text-primary-foreground shadow-md"
            : "bg-white hover:bg-slate-100 text-slate-700"
        )}
      >
        Tất cả
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
            "flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-all overflow-hidden",
            selectedCategory === cat.slug ? "shadow-md" : "hover:brightness-95"
          )}
        >
          <div
            className="w-4 h-4 [&>svg]:w-full [&>svg]:h-full"
            dangerouslySetInnerHTML={{ __html: cat.icon_svg }}
          />
          {cat.name}
        </button>
      ))}
    </div>
  );
}
