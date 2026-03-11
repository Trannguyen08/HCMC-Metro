"use client";

import * as React from "react";
import { MapPinned, Star } from "lucide-react";

import { StationSelect } from "@/components/shared/StationSelect";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
  AMENITIES,
  METRO_STATIONS,
  type Amenity,
  type AmenityCategory,
  type MetroStation
} from "@/lib/mock-data";

const CATEGORIES: { key: AmenityCategory; label: string }[] = [
  { key: "Tất cả", label: "Tất cả" },
  { key: "Y tế", label: "🏥 Y tế" },
  { key: "Giáo dục", label: "🏫 Giáo dục" },
  { key: "Ăn uống", label: "🍜 Ăn uống" },
  { key: "Mua sắm", label: "🏪 Mua sắm" },
  { key: "Ngân hàng", label: "🏦 Ngân hàng" },
  { key: "Bãi xe", label: "🅿️ Bãi xe" }
];

function AmenityCard({ a }: { a: Amenity }) {
  return (
    <Card className="card-hover">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="text-base">{a.name}</CardTitle>
            <div className="mt-1 text-sm text-muted-foreground">{a.address}</div>
          </div>
          <Badge variant="outline">{a.category}</Badge>
        </div>
      </CardHeader>
      <CardContent className="flex items-center justify-between text-sm">
        <div className="text-muted-foreground">{a.distanceKm.toFixed(1)} km</div>
        <div className="flex items-center gap-1">
          <Star className="h-4 w-4 text-amber-500" />
          <span className="font-medium">{a.rating.toFixed(1)}</span>
        </div>
      </CardContent>
    </Card>
  );
}

export default function TienIchPage() {
  const [station, setStation] = React.useState<MetroStation | null>(METRO_STATIONS[0]);
  const [category, setCategory] = React.useState<AmenityCategory>("Tất cả");
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    setLoading(true);
    const t = window.setTimeout(() => setLoading(false), 650);
    return () => window.clearTimeout(t);
  }, [station, category]);

  const filtered = React.useMemo(() => {
    const base = AMENITIES.filter((a) => a.stationId === (station?.id ?? 1));
    if (category === "Tất cả") return base;
    return base.filter((a) => a.category === category);
  }, [station, category]);

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="font-heading text-2xl font-bold tracking-tight">Tiện ích quanh Ga</h1>
        <p className="text-sm text-muted-foreground">
          Chọn ga và lọc theo danh mục để xem tiện ích gần nhất (dữ liệu mô phỏng).
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-12">
        <Card className="lg:col-span-8 shadow-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Bộ lọc</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-2">
                <div className="text-sm font-medium">Chọn ga</div>
                <StationSelect value={station} onChange={setStation} placeholder="Chọn ga" />
              </div>
              <div className="space-y-2">
                <div className="text-sm font-medium">Danh mục</div>
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.map((c) => (
                    <Button
                      key={c.key}
                      type="button"
                      variant={category === c.key ? "default" : "outline"}
                      size="sm"
                      className={cn("rounded-full", category !== c.key && "text-muted-foreground")}
                      onClick={() => setCategory(c.key)}
                    >
                      {c.label}
                    </Button>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {loading
                ? Array.from({ length: 4 }).map((_, i) => (
                    <Card key={i} className="p-6">
                      <Skeleton className="h-5 w-4/5" />
                      <Skeleton className="mt-2 h-4 w-full" />
                      <Skeleton className="mt-6 h-4 w-2/3" />
                    </Card>
                  ))
                : filtered.map((a) => <AmenityCard key={a.id} a={a} />)}
              {!loading && filtered.length === 0 && (
                <Card className="md:col-span-2">
                  <CardContent className="p-6 text-sm text-muted-foreground">
                    Chưa có tiện ích cho bộ lọc này (mock).
                  </CardContent>
                </Card>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-4 shadow-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Bản đồ (placeholder)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex aspect-square w-full items-center justify-center rounded-xl border bg-muted/40">
              <div className="text-center text-sm text-muted-foreground">
                <MapPinned className="mx-auto mb-2 h-6 w-6" />
                Bản đồ tiện ích sẽ hiển thị tại đây
                <div className="mt-1 text-xs">(không dùng Maps API)</div>
              </div>
            </div>
            <div className="mt-4 text-xs text-muted-foreground">
              Ga hiện tại: <span className="font-medium text-foreground">{station?.name}</span>
            </div>
            <div className="mt-1 text-xs text-muted-foreground">
              Số tiện ích: <span className="font-medium text-foreground">{loading ? "..." : filtered.length}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

