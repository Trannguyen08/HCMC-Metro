"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import { Clock3, MapPin, Ticket, TrainFront } from "lucide-react";

import { StationSelect } from "./StationSelect";
import { TicketCard } from "./TicketCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  METRO_STATIONS,
  mockRouteResults,
  type MetroStation,
  type RouteResult,
  type TicketType
} from "@/lib/mock-data";

function todayISO() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function StationTimeline({ stops }: { stops: MetroStation[] }) {
  return (
    <div className="rounded-xl border bg-background p-4">
      <div className="mb-3 flex items-center gap-2 text-sm font-medium">
        <MapPin className="h-4 w-4 text-metro-blue" />
        Danh sách ga dừng
      </div>
      <div className="space-y-3">
        {stops.map((s, idx) => (
          <div key={s.id} className="flex items-start gap-3">
            <div className="relative mt-0.5">
              <div className="h-3 w-3 rounded-full bg-metro-blue" />
              {idx < stops.length - 1 && (
                <div className="absolute left-1.5 top-3 h-7 w-px bg-border" />
              )}
            </div>
            <div className="flex-1">
              <div className="text-sm font-medium">{s.name}</div>
              <div className="text-xs text-muted-foreground">Mã ga: {s.code}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function MiniLineMap() {
  return (
    <div className="rounded-xl border bg-background p-4">
      <div className="mb-3 flex items-center gap-2 text-sm font-medium">
        <TrainFront className="h-4 w-4 text-metro-green" />
        Sơ đồ tuyến (Line 1)
      </div>
      <div className="relative mt-4 h-10">
        <div className="absolute left-0 right-0 top-5 h-1 rounded-full bg-gradient-to-r from-[#0055A5] to-[#0077CC]" />
        <div className="absolute inset-x-0 top-3 flex justify-between">
          {METRO_STATIONS.map((s) => (
            <div key={s.id} className="flex flex-col items-center gap-2">
              <div className="h-3 w-3 rounded-full border border-white bg-metro-blue shadow" />
              <div className="hidden w-20 text-center text-[10px] text-muted-foreground lg:block">
                {s.name}
              </div>
            </div>
          ))}
        </div>
      </div>
      <p className="mt-10 text-xs text-muted-foreground">
        Gợi ý: xem bản đồ tương tác tại trang <span className="font-medium">Bản đồ số</span>.
      </p>
    </div>
  );
}

export function RouteLookup() {
  const params = useSearchParams();
  const [from, setFrom] = React.useState<MetroStation | null>(null);
  const [to, setTo] = React.useState<MetroStation | null>(null);
  const [date, setDate] = React.useState<string>(todayISO());
  const [ticketType, setTicketType] = React.useState<TicketType>("Một chiều");
  const [loading, setLoading] = React.useState(false);
  const [results, setResults] = React.useState<RouteResult[]>([]);
  const [error, setError] = React.useState<string | null>(null);
  const [selectedStops, setSelectedStops] = React.useState<MetroStation[] | null>(null);

  React.useEffect(() => {
    const fromId = Number(params.get("from") ?? "");
    const toId = Number(params.get("to") ?? "");
    const dateQ = params.get("date");
    const typeQ = params.get("type") as TicketType | null;
    if (dateQ) setDate(dateQ);
    if (typeQ === "Một chiều" || typeQ === "Khứ hồi" || typeQ === "Tháng")
      setTicketType(typeQ);
    if (fromId && toId) {
      setFrom(METRO_STATIONS.find((s) => s.id === fromId) ?? null);
      setTo(METRO_STATIONS.find((s) => s.id === toId) ?? null);
      void runSearch(fromId, toId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function runSearch(fromId?: number, toId?: number) {
    setError(null);
    const fId = fromId ?? from?.id;
    const tId = toId ?? to?.id;
    if (!fId || !tId) return setError("Vui lòng chọn ga đi và ga đến.");
    if (fId === tId) return setError("Ga đi và ga đến không được trùng nhau.");

    setLoading(true);
    setSelectedStops(null);
    await new Promise((r) => setTimeout(r, 750));
    setResults(mockRouteResults(fId, tId));
    setLoading(false);
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="font-heading text-2xl font-bold tracking-tight">
          Tra cứu Lộ trình
        </h1>
        <p className="text-sm text-muted-foreground">
          Chọn ga, ngày đi và loại vé để tìm chuyến phù hợp.
        </p>
      </div>

      <Card className="shadow-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Tìm kiếm</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            className="grid gap-3 md:grid-cols-12 md:items-end"
            onSubmit={(e) => {
              e.preventDefault();
              void runSearch();
            }}
          >
            <div className="md:col-span-3">
              <Label>Ga đi</Label>
              <div className="mt-1">
                <StationSelect
                  value={from}
                  onChange={setFrom}
                  placeholder="Chọn ga đi"
                />
              </div>
            </div>
            <div className="md:col-span-3">
              <Label>Ga đến</Label>
              <div className="mt-1">
                <StationSelect
                  value={to}
                  onChange={setTo}
                  placeholder="Chọn ga đến"
                />
              </div>
            </div>
            <div className="md:col-span-2">
              <Label>Ngày</Label>
              <Input
                className="mt-1"
                type="date"
                value={date}
                min={todayISO()}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            <div className="md:col-span-2">
              <Label>Loại vé</Label>
              <Select
                value={ticketType}
                onValueChange={(v) => setTicketType(v as TicketType)}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Chọn loại vé" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Một chiều">Một chiều</SelectItem>
                  <SelectItem value="Khứ hồi">Khứ hồi</SelectItem>
                  <SelectItem value="Tháng">Tháng</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-2">
              <Button className="w-full" type="submit" disabled={loading}>
                <Ticket className="h-4 w-4" />
                {loading ? "Đang tìm..." : "Tìm kiếm"}
              </Button>
            </div>
            {error && <p className="md:col-span-12 text-sm text-rose-600">{error}</p>}
          </form>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-12">
        <div className="space-y-4 lg:col-span-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Clock3 className="h-4 w-4 text-metro-blue" />
              Kết quả ({loading ? "..." : results.length})
            </div>
          </div>

          {loading && (
            <div className="grid gap-4 md:grid-cols-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Card key={i} className="p-6">
                  <Skeleton className="h-4 w-3/5" />
                  <Skeleton className="mt-3 h-4 w-2/5" />
                  <Skeleton className="mt-6 h-20 w-full" />
                </Card>
              ))}
            </div>
          )}

          {!loading && results.length === 0 && (
            <Card>
              <CardContent className="p-6 text-sm text-muted-foreground">
                Chưa có dữ liệu. Hãy thực hiện tìm kiếm để hiển thị chuyến đi.
              </CardContent>
            </Card>
          )}

          {!loading && results.length > 0 && (
            <div className="grid gap-4 md:grid-cols-2">
              {results.map((r) => (
                <div key={r.id} className="space-y-3">
                  <TicketCard result={r} onBook={() => setSelectedStops(r.stops)} />
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => setSelectedStops(r.stops)}
                  >
                    Xem chi tiết ga dừng
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-4 lg:col-span-4">
          <MiniLineMap />
          <Separator />
          {selectedStops ? (
            <StationTimeline stops={selectedStops} />
          ) : (
            <Card>
              <CardContent className="p-6 text-sm text-muted-foreground">
                Chọn một chuyến để xem danh sách ga dừng.
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
