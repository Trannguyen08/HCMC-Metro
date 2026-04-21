"use client";

import * as React from "react";
import { Plus, Train, Wrench } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { AMENITIES, METRO_STATIONS, type AmenityCategory, type MetroStation } from "@/lib/mock-data";

function StationDetails({ station }: { station: MetroStation }) {
  const nearbyCount = AMENITIES.filter((a) => a.stationId === station.id).length;
  const facilities = ["Thang máy", "Hỗ trợ hành khách", "Camera an ninh"];
  return (
    <div className="space-y-3">
      <div>
        <div className="font-heading text-lg font-semibold">{station.name}</div>
        <div className="text-sm text-muted-foreground">Mã ga: {station.code}</div>
      </div>
      <div className="grid gap-2 rounded-xl border bg-background p-4 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Tiện ích gần ga</span>
          <span className="font-medium">{nearbyCount}</span>
        </div>
        <Separator />
        <div className="space-y-1">
          <div className="text-muted-foreground">Cơ sở vật chất</div>
          <ul className="list-disc pl-5">
            {facilities.map((f) => (
              <li key={f}>{f}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

function MetroLineSvg({
  selectedId,
  onSelect
}: {
  selectedId: number;
  onSelect: (s: MetroStation) => void;
}) {
  const width = 980;
  const height = 180;
  const paddingX = 40;
  const y = 84;
  const step = (width - paddingX * 2) / (METRO_STATIONS.length - 1);

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="h-full w-full"
      role="img"
      aria-label="Sơ đồ Metro Line 1"
    >
      <defs>
        <linearGradient id="metroLine" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0%" stopColor="#0055A5" />
          <stop offset="100%" stopColor="#0077CC" />
        </linearGradient>
      </defs>

      <line
        x1={paddingX}
        y1={y}
        x2={width - paddingX}
        y2={y}
        stroke="url(#metroLine)"
        strokeWidth="10"
        strokeLinecap="round"
      />

      {METRO_STATIONS.map((s, idx) => {
        const cx = paddingX + idx * step;
        const active = s.id === selectedId;
        return (
          <g key={s.id} onClick={() => onSelect(s)} style={{ cursor: "pointer" }}>
            <circle
              cx={cx}
              cy={y}
              r={active ? 10 : 8}
              fill={active ? "#00A86B" : "#0055A5"}
              stroke="#ffffff"
              strokeWidth="3"
            />
            <text
              x={cx}
              y={y + 28}
              textAnchor="middle"
              fontSize="12"
              fill={active ? "#0A1628" : "#334155"}
            >
              {s.name}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

export function MetroMap() {
  const [selected, setSelected] = React.useState<MetroStation>(METRO_STATIONS[0]);
  const [createOpen, setCreateOpen] = React.useState(false);
  const [placeName, setPlaceName] = React.useState("");
  const [placeCategory, setPlaceCategory] = React.useState<AmenityCategory>("Nhà hàng");
  const [placeDistance, setPlaceDistance] = React.useState("");
  const [formError, setFormError] = React.useState<string | null>(null);

  function submitCreate() {
    setFormError(null);
    if (!placeName.trim()) return setFormError("Vui lòng nhập tên địa điểm.");
    const km = Number(placeDistance);
    if (!Number.isFinite(km) || km <= 0) return setFormError("Khoảng cách (km) không hợp lệ.");
    setCreateOpen(false);
    setPlaceName("");
    setPlaceDistance("");
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div className="space-y-1">
          <h1 className="font-heading text-2xl font-bold tracking-tight">Bản đồ số Metro HCM</h1>
          <p className="text-sm text-muted-foreground">
            Sơ đồ tuyến Metro Line 1 (SVG thủ công, không dùng bản đồ thật).
          </p>
        </div>

        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4" />
              Tạo địa điểm mới
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Tạo địa điểm mới (mock)</DialogTitle>
              <DialogDescription>
                Thông tin chỉ dùng để mô phỏng UI, không lưu lên server.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4">
              <div className="space-y-1">
                <Label>Tên địa điểm</Label>
                <Input value={placeName} onChange={(e) => setPlaceName(e.target.value)} placeholder="vd: Cửa hàng tiện lợi..." />
              </div>
              <div className="space-y-1">
                <Label>Danh mục</Label>
                <Select value={placeCategory} onValueChange={(v) => setPlaceCategory(v as AmenityCategory)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn danh mục" />
                  </SelectTrigger>
                  <SelectContent>
                    {(["Cà phê", "Nhà hàng", "Mua sắm", "Khách sạn", "Dịch vụ"] as const).map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Khoảng cách đến ga (km)</Label>
                <Input value={placeDistance} onChange={(e) => setPlaceDistance(e.target.value)} placeholder="vd: 0.8" />
              </div>
              {formError && <p className="text-sm text-rose-600">{formError}</p>}
              <div className="rounded-xl border bg-muted/40 p-3 text-xs text-muted-foreground">
                Ga hiện tại: <span className="font-medium text-foreground">{selected.name}</span>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateOpen(false)}>
                Hủy
              </Button>
              <Button onClick={submitCreate}>Tạo</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        <Card className="lg:col-span-9 shadow-card overflow-hidden">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Metro Line 1: Bến Thành → Suối Tiên</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="aspect-[16/6] w-full rounded-xl border bg-background p-2">
              <MetroLineSvg selectedId={selected.id} onSelect={setSelected} />
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl border bg-background p-4 text-sm">
                <div className="flex items-center gap-2 font-medium">
                  <Train className="h-4 w-4 text-metro-blue" />
                  Ký hiệu
                </div>
                <div className="mt-2 space-y-1 text-muted-foreground">
                  <div>
                    <span className="inline-block h-2 w-2 rounded-full bg-metro-blue align-middle" />{" "}
                    Ga
                  </div>
                  <div>
                    <span className="inline-block h-2 w-2 rounded-full bg-metro-green align-middle" />{" "}
                    Ga đang chọn
                  </div>
                </div>
              </div>
              <div className="rounded-xl border bg-background p-4 text-sm">
                <div className="flex items-center gap-2 font-medium">
                  <Wrench className="h-4 w-4 text-metro-green" />
                  Gợi ý thao tác
                </div>
                <div className="mt-2 text-muted-foreground">
                  Nhấn vào node ga trên SVG để xem chi tiết.
                </div>
              </div>
              <div className="rounded-xl border bg-background p-4 text-sm">
                <div className="font-medium">Thông tin nhanh</div>
                <div className="mt-2 text-muted-foreground">
                  Tổng số ga: <span className="font-medium text-foreground">{METRO_STATIONS.length}</span>
                </div>
                <div className="mt-1 text-muted-foreground">
                  Tuyến: <span className="font-medium text-foreground">Line 1</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="lg:col-span-3 space-y-4">
          <Card className="shadow-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Danh sách ga</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              {METRO_STATIONS.map((s) => (
                <button
                  key={s.id}
                  className={cn(
                    "w-full rounded-lg px-3 py-2 text-left text-sm transition duration-300 ease-smooth hover:bg-accent",
                    s.id === selected.id ? "bg-accent font-medium text-foreground" : "text-muted-foreground"
                  )}
                  onClick={() => setSelected(s)}
                >
                  {s.name}
                </button>
              ))}
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Chi tiết ga</CardTitle>
            </CardHeader>
            <CardContent>
              <StationDetails station={selected} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
