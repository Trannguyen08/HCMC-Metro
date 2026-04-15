"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight, MapPin, Sparkles, TrainFront } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchAmenities } from "@/features/metro/services/AmenityService";
import { Amenity } from "@/types/amenity";

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1524813686514-a57563d77965?auto=format&fit=crop&q=80&w=1200";

function pickAmenitiesFromDifferentStations(items: Amenity[], limit = 4) {
  const selected: Amenity[] = [];
  const stationSet = new Set<string>();

  for (const item of items) {
    const stationKey = item.stationId || item.stationName;
    if (!stationKey || stationSet.has(stationKey)) continue;

    stationSet.add(stationKey);
    selected.push(item);
    if (selected.length >= limit) return selected;
  }

  for (const item of items) {
    if (!selected.some((current) => current.id === item.id)) {
      selected.push(item);
    }
    if (selected.length >= limit) break;
  }

  return selected;
}

export function HomeAmenitiesSection() {
  const [items, setItems] = React.useState<Amenity[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    setLoading(true);
    fetchAmenities({})
      .then((response) => {
        setItems(pickAmenitiesFromDifferentStations(response.data, 4));
      })
      .catch((error) => {
        console.error("Failed to fetch amenities:", error);
        setItems([]);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <section
      id="tien-ich"
      className="relative overflow-hidden rounded-[28px] border border-[#0055A5]/10 bg-[linear-gradient(180deg,rgba(0,85,165,0.08)_0%,rgba(255,255,255,0.95)_42%,#ffffff_100%)] p-5 sm:p-6"
    >
      <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-[#0055A5]/15 blur-3xl" />
      <div className="pointer-events-none absolute -left-16 bottom-0 h-40 w-40 rounded-full bg-[#0077CC]/10 blur-3xl" />

      <div className="relative space-y-5">
        <div className="flex items-end justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#0055A5]/20 bg-white/80 px-3 py-1 text-xs font-semibold text-[#0055A5]">
              <Sparkles className="h-3.5 w-3.5" />
              Khám phá quanh ga
            </div>
            <h2 className="font-heading text-2xl font-bold tracking-tight text-slate-900">Tiện ích quanh ga</h2>
            <p className="max-w-2xl text-sm text-slate-600">
              Gợi ý nhanh các điểm dừng chân gần các ga metro để bạn dễ lên lịch trình.
            </p>
          </div>

          <Button
            asChild
            className="rounded-full bg-[#0055A5] px-5 text-white shadow-[0_10px_30px_rgba(0,85,165,0.28)] hover:bg-[#004b91]"
          >
            <Link href="/tien-ich">
              Xem thêm
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {loading
            ? Array.from({ length: 4 }).map((_, index) => (
                <Card key={index} className="overflow-hidden border-[#0055A5]/15 bg-white/95">
                  <div className="p-5">
                    <Skeleton className="h-36 w-full" />
                    <Skeleton className="mt-4 h-4 w-20" />
                    <Skeleton className="mt-3 h-5 w-4/5" />
                    <Skeleton className="mt-2 h-4 w-11/12" />
                  </div>
                </Card>
              ))
            : items.length > 0
              ? items.map((amenity) => (
                  <Link key={amenity.id} href={`/tien-ich/${amenity.id}-${amenity.slug}`} className="block">
                    <Card className="group overflow-hidden border-[#0055A5]/15 bg-white/95 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_18px_36px_rgba(0,85,165,0.18)]">
                      <div className="relative h-40 overflow-hidden bg-slate-100">
                        <img
                          src={amenity.thumbnailUrl || amenity.imageUrl || FALLBACK_IMAGE}
                          alt={amenity.name}
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                          onError={(event) => {
                            event.currentTarget.onerror = null;
                            event.currentTarget.src = FALLBACK_IMAGE;
                          }}
                        />
                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#032f5f]/80 to-transparent p-3">
                          <div className="inline-flex items-center gap-1.5 rounded-full bg-[#0055A5] px-2.5 py-1 text-xs font-semibold text-white shadow-[0_8px_18px_rgba(0,85,165,0.35)]">
                            <TrainFront className="h-3.5 w-3.5" />
                            {amenity.stationName}
                          </div>
                        </div>
                      </div>

                      <CardHeader className="p-3 pb-1">
                        <CardTitle className="line-clamp-1 text-base text-slate-900 group-hover:text-[#004b91]">
                          {amenity.name}
                        </CardTitle>
                      </CardHeader>

                      <CardContent className="space-y-1.5 p-3 pt-1 text-sm text-slate-600">
                        <div className="flex items-start gap-2">
                          <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#0055A5]" />
                          <span className="line-clamp-1 text-xs">{amenity.address}</span>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))
              : (
                <div className="col-span-1 rounded-2xl border border-dashed border-[#0055A5]/25 bg-white/80 py-8 text-center text-slate-600 md:col-span-2 lg:col-span-4">
                  Đang cập nhật dữ liệu tiện ích.
                </div>
              )}
        </div>
      </div>
    </section>
  );
}
