"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ArrowLeftRight, Search } from "lucide-react";

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
import { StationSelect } from "../StationSelect";
import { type MetroStation, type TicketType, METRO_STATIONS } from "@/lib/mock-data";

function todayISO() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export function QuickBooking() {
  const router = useRouter();
  const [from, setFrom] = React.useState<MetroStation | null>(null);
  const [to, setTo] = React.useState<MetroStation | null>(null);
  const [date, setDate] = React.useState<string>(todayISO());
  const [ticketType, setTicketType] = React.useState<TicketType>("Một chiều");
  const [error, setError] = React.useState<string | null>(null);

  function swap() {
    setFrom(to);
    setTo(from);
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!from || !to) return setError("Vui lòng chọn ga đi và ga đến.");
    if (from.id === to.id) return setError("Ga đi và ga đến không được trùng nhau.");
    if (!date) return setError("Vui lòng chọn ngày đi.");

    const params = new URLSearchParams({
      from: String(from.id),
      to: String(to.id),
      date,
      type: ticketType
    });
    router.push(`/lo-trinh?${params.toString()}`);
  }

  return (
    <Card className="shadow-card">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Đặt vé nhanh</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={submit} className="grid gap-3 md:grid-cols-10 md:items-end">
          <div className="md:col-span-3">
            <Label>Ga đi</Label>
            <div className="mt-1">
              <StationSelect value={from} onChange={setFrom} stations={[...METRO_STATIONS]} placeholder="Chọn ga đi" />
            </div>
          </div>

          <div className="md:col-span-1 md:flex md:justify-center">
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="mt-6 w-full md:mt-0 md:w-10"
              onClick={swap}
              aria-label="Đổi ga"
            >
              <ArrowLeftRight className="h-4 w-4" />
            </Button>
          </div>

          <div className="md:col-span-3">
            <Label>Ga đến</Label>
            <div className="mt-1">
              <StationSelect value={to} onChange={setTo} stations={[...METRO_STATIONS]} placeholder="Chọn ga đến" />
            </div>
          </div>

          <div className="md:col-span-3 grid gap-3 sm:grid-cols-2">
            <div>
              <Label>Ngày</Label>
              <Input
                className="mt-1"
                type="date"
                value={date}
                min={todayISO()}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>

            <div>
              <Label>Loại vé</Label>
              <Select value={ticketType} onValueChange={(v) => setTicketType(v as TicketType)}>
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
          </div>

          <div className="md:col-span-10">
            {error && <p className="text-sm text-rose-600">{error}</p>}
          </div>

          <div className="md:col-span-10">
            <Button type="submit" className="w-full">
              <Search className="h-4 w-4" />
              Tìm chuyến
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

