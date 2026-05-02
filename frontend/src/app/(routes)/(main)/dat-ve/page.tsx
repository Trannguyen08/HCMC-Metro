"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowRightLeft,
  CheckCircle2,
  ChevronRight,
  History,
  Info,
  Loader2,
  MapPin,
  Ticket,
  User,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useAuthStore } from "@/store/use-auth-store";
import { useBookingStore } from "@/store/use-booking-store";
import api from "@/lib/api";
import { toast } from "@/store/use-toast-store";

type UiStation = {
  id: number;
  name: string;
  code: string;
};

function calculateAge(dateOfBirth?: string | null): number | null {
  if (!dateOfBirth) return null;
  const dob = new Date(dateOfBirth);
  if (Number.isNaN(dob.getTime())) return null;

  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const m = today.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age -= 1;
  return age;
}

export default function BookingPage() {
  const router = useRouter();
  const { user, isAuthenticated, setPendingBooking } = useAuthStore();
  const {
    fromStationId,
    toStationId,
    ticketTypeId,
    isRoundTrip,
    ticketTypes,
    calculation,
    setFromStation,
    setToStation,
    setTicketType,
    setIsRoundTrip,
    fetchInitialData,
  } = useBookingStore();

  const [stations, setStations] = useState<UiStation[]>([]);
  const [isBooking, setIsBooking] = useState(false);

  const [currentHour, setCurrentHour] = useState(new Date().getHours());
  
  useEffect(() => {
    const timer = setInterval(() => setCurrentHour(new Date().getHours()), 60000);
    return () => clearInterval(timer);
  }, []);

  const isOperatingHours = currentHour >= 5 && currentHour < 23;

  useEffect(() => {
    fetchInitialData();
    api
      .get(`/ticketing/types/stations/`)
      .then((res) => setStations(res.data.results || res.data || []))
      .catch((err) => console.error("Error fetching stations", err));
  }, [fetchInitialData]);

  const selectedTicketType = useMemo(
    () => ticketTypes.find((t) => t.id === ticketTypeId),
    [ticketTypes, ticketTypeId]
  );

  const age = useMemo(() => calculateAge(user?.date_of_birth), [user?.date_of_birth]);
  const passengerGroup = age !== null && age <= 22 ? "hssv" : "normal";

  const isSingleTicket = selectedTicketType?.type === "single";
  const sameStationSelected = !!fromStationId && !!toStationId && fromStationId === toStationId;

  const fromStations = useMemo(() => stations.filter((s) => s.id !== toStationId), [stations, toStationId]);
  const toStations = useMemo(() => stations.filter((s) => s.id !== fromStationId), [stations, fromStationId]);

  const onChangeFromStation = (val: string) => {
    const nextId = Number(val);
    if (!Number.isFinite(nextId)) return;
    if (toStationId && toStationId === nextId) {
      toast.error("Ga khởi hành và ga đến không được trùng nhau.");
      return;
    }
    setFromStation(nextId);
  };

  const onChangeToStation = (val: string) => {
    const nextId = Number(val);
    if (!Number.isFinite(nextId)) return;
    if (fromStationId && fromStationId === nextId) {
      toast.error("Ga khởi hành và ga đến không được trùng nhau.");
      return;
    }
    setToStation(nextId);
  };

  const handleSwapStations = () => {
    if (!fromStationId || !toStationId) return;
    setFromStation(toStationId);
    setToStation(fromStationId);
  };

  const handleBook = async () => {
    const accessToken = typeof window !== "undefined" ? localStorage.getItem("metro.access") : null;
    if (!isAuthenticated || !accessToken) {
      setPendingBooking({
        fromStationId,
        toStationId,
        ticketTypeId,
        timestamp: Date.now(),
      });
      router.push("/login?redirect=/dat-ve");
      return;
    }

    if (!ticketTypeId) return;

    // Chi bat buoc chon ga doi voi ve luot
    if (isSingleTicket && (!fromStationId || !toStationId)) {
      toast.error("Vui lòng chọn đủ ga khởi hành và ga đến cho vé lượt.");
      return;
    }

    if (isSingleTicket && sameStationSelected) {
      toast.error("Ga khởi hành và ga đến không được trùng nhau.");
      return;
    }

    setIsBooking(true);

    try {
      const res = await api.post(`/payments/payos/create/`, {
        ticket_type_id: ticketTypeId,
        from_station_id: isSingleTicket ? fromStationId : null,
        to_station_id: isSingleTicket ? toStationId : null,
        is_round_trip: isSingleTicket ? isRoundTrip : false,
      });

      if (!res.data?.payment_url) {
        toast.error("Không lấy được liên kết thanh toán PayOS.");
        return;
      }

      if (!res.data?.ticket_id) {
        toast.error("Không tạo được vé chờ thanh toán.");
        return;
      }

      toast.success("Đã lưu vé chờ thanh toán, đang chuyển sang trang thanh toán...");
      router.push(`/dat-ve/thanh-toan?ticket_id=${res.data.ticket_id}`);
    } catch (err: any) {
      if (err.response?.status === 401) {
        setPendingBooking({
          fromStationId,
          toStationId,
          ticketTypeId,
          timestamp: Date.now(),
        });
        router.push("/login?redirect=/dat-ve");
        return;
      }
      toast.error(err.response?.data?.error || err.response?.data?.detail || "Đặt vé thất bại. Vui lòng thử lại.");
    } finally {
      setIsBooking(false);
    }
  };

  return (
    <div className="container mx-auto max-w-6xl px-4 pt-2 pb-8">
      <div className="mb-8 flex flex-col gap-2">
        <h1 className="font-heading flex items-center gap-3 text-3xl font-extrabold tracking-tight text-primary">
          <Ticket className="h-8 w-8" />
          Đặt Vé Metro
        </h1>
        <p className="max-w-2xl text-muted-foreground">
          Hệ thống tự động phân loại đối tượng theo ngày sinh: HSSV nếu tuổi hiện tại nhỏ hơn hoặc bằng 22, còn lại là Normal.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card className="overflow-hidden border-none bg-background shadow-md">
            <div className="metro-gradient h-1.5 w-full"></div>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <MapPin className="h-5 w-5 text-primary" />
                Thông tin hành trình
              </CardTitle>
              <CardDescription>Chọn ga đi và ga đến (Chỉ bắt buộc cho vé lượt, các vé khác có thể bỏ qua)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-col items-center gap-4 md:flex-row">
                <div className="w-full flex-1 space-y-2">
                  <Label>Ga đi {isSingleTicket ? <span className="text-rose-500">*</span> : ""}</Label>
                  <Select value={fromStationId?.toString() || ""} onValueChange={onChangeFromStation} disabled={!isSingleTicket}>
                    <SelectTrigger className="h-12">
                      <SelectValue placeholder={isSingleTicket ? "Chọn ga khởi hành" : "Không bắt buộc (Tất cả ga)"} />
                    </SelectTrigger>
                    <SelectContent>
                      {fromStations.map((st) => (
                        <SelectItem key={st.id} value={st.id.toString()}>
                          {st.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="hidden pt-6 md:block">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="rounded-full hover:bg-primary/10"
                    onClick={handleSwapStations}
                    disabled={!isSingleTicket || !fromStationId || !toStationId}
                  >
                    <ArrowRightLeft className="h-5 w-5 text-primary" />
                  </Button>
                </div>

                <div className="w-full flex-1 space-y-2">
                  <Label>Ga đến {isSingleTicket ? <span className="text-rose-500">*</span> : ""}</Label>
                  <Select value={toStationId?.toString() || ""} onValueChange={onChangeToStation} disabled={!isSingleTicket}>
                    <SelectTrigger className="h-12">
                      <SelectValue placeholder={isSingleTicket ? "Chọn ga kết thúc" : "Không bắt buộc (Tất cả ga)"} />
                    </SelectTrigger>
                    <SelectContent>
                      {toStations.map((st) => (
                        <SelectItem key={st.id} value={st.id.toString()}>
                          {st.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="rounded-xl border border-dashed border-primary/20 bg-white p-4">
                <div className="flex items-start gap-3">
                  <Info className="mt-0.5 h-5 w-5 text-primary" />
                  <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
                    Với các loại vé ngày, tuần, tháng, bạn có thể đi <strong>không giới hạn</strong> lượt và tuyến trong thời gian hiệu lực.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <Ticket className="h-5 w-5 text-primary" />
                Loại vé và đối tượng tự động
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <Label>Lựa chọn loại vé</Label>
                <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
                  {ticketTypes.map((type) => {
                    const isSingle = type.type === "single";
                    const isDisabled = isSingle && !isOperatingHours;
                    return (
                    <div
                      key={type.id}
                      onClick={() => {
                        if (!isDisabled) setTicketType(type.id);
                      }}
                      className={`
                        flex flex-col items-center justify-center gap-2 rounded-xl border-2 p-3 text-center transition-all
                        ${isDisabled ? "opacity-50 cursor-not-allowed border-muted bg-muted" : "cursor-pointer"}
                        ${!isDisabled && ticketTypeId === type.id ? "border-primary bg-primary/5" : ""}
                        ${!isDisabled && ticketTypeId !== type.id ? "border-muted bg-muted/5 hover:border-primary/50" : ""}
                      `}
                    >
                      <div className={`rounded-lg p-2 ${ticketTypeId === type.id && !isDisabled ? "bg-primary text-white" : "bg-muted text-muted-foreground"}`}>
                        <Ticket className="h-5 w-5" />
                      </div>
                      <div className="text-sm font-bold">{type.name}</div>
                      <div className="text-[10px] text-muted-foreground">{type.duration_days > 0 ? `${type.duration_days} ngày` : "Theo chặng"}</div>
                    </div>
                  )})}
                </div>
                {!isOperatingHours && (
                  <div className="rounded-xl border border-rose-200 bg-rose-50 p-4">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="mt-0.5 h-5 w-5 text-rose-500" />
                      <p className="text-sm text-rose-600">
                        Hệ thống tàu hiện đang ngừng hoạt động (23:00 - 05:00). Bạn không thể đặt <strong>vé lượt</strong> trong khung giờ này. Vui lòng chọn các loại vé khác (vé ngày, tuần, tháng) hoặc quay lại sau 5h sáng.
                      </p>
                    </div>
                  </div>
                )}
                {isSingleTicket && (
                  <div className="mt-3 rounded-xl border border-primary/20 bg-primary/5 p-4">
                    <div className="flex items-start gap-3">
                      <Checkbox
                        id="round-trip"
                        checked={isRoundTrip}
                        onCheckedChange={(checked) => setIsRoundTrip(Boolean(checked))}
                      />
                      <div className="space-y-1">
                        <Label htmlFor="round-trip" className="cursor-pointer font-semibold">
                          Vé khứ hồi
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          Giá vé lượt sẽ nhân đôi (x2) và có 2 lượt quét.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <Separator />

              <div className="space-y-3">
                <Label>Đối tượng hành khách (tự động theo ngày sinh)</Label>
                <div className="flex flex-wrap gap-2">
                  <Badge variant={passengerGroup === "hssv" ? "default" : "outline"} className="rounded-full px-4 py-2 text-sm">
                    <User className="mr-1 h-4 w-4" /> HSSV (≤ 22 tuổi) - giảm 30%
                  </Badge>
                  <Badge variant={passengerGroup === "normal" ? "default" : "outline"} className="rounded-full px-4 py-2 text-sm">
                    <User className="mr-1 h-4 w-4" /> Normal (&gt; 22 tuổi) - không giảm
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  {age === null ? "Chưa có ngày sinh hoặc chưa đăng nhập: hệ thống tạm tính nhóm Normal." : `Tuổi hiện tại: ${age}. Nhóm áp dụng: ${passengerGroup === "hssv" ? "HSSV" : "Normal"}.`}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-1">
          <div className="sticky top-24 space-y-4">
            <Card className="border-none border-t-4 border-t-primary shadow-xl">
              <CardHeader>
                <CardTitle>Tổng cộng</CardTitle>
                <CardDescription>Chi tiết giá vé hành trình</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between py-1">
                  <span className="text-sm text-muted-foreground">Loại vé:</span>
                  <span className="font-semibold">{selectedTicketType?.name || "Chưa chọn"}</span>
                </div>
                <div className="flex items-center justify-between py-1">
                  <span className="text-sm text-muted-foreground">Đối tượng:</span>
                  <span className="font-semibold">{passengerGroup === "hssv" ? "HSSV" : "Normal"}</span>
                </div>

                <Separator />

                <div className="space-y-1.5 py-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Giá gốc:</span>
                    <span className="font-mono text-muted-foreground line-through">
                      {calculation?.base_price != null && calculation.base_price !== "0"
                        ? `${parseInt(String(calculation.base_price), 10).toLocaleString("vi-VN")} đ`
                        : "---"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-rose-600">
                    <span className="text-sm">Giảm giá:</span>
                    <span className="font-medium">-{calculation?.discount_rate != null ? `${parseFloat(String(calculation.discount_rate)) * 100}%` : "0%"}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between rounded-xl bg-primary/5 px-5 py-3">
                  <span className="font-bold">Thành tiền</span>
                  <div className="text-right">
                    <div className="font-mono text-2xl font-black leading-none text-primary">
                      {calculation?.loading ? (
                        <Loader2 className="h-6 w-6 animate-spin" />
                      ) : calculation?.total_price != null && calculation.total_price !== "0" ? (
                        `${parseInt(String(calculation.total_price), 10).toLocaleString("vi-VN")} đ`
                      ) : isSingleTicket ? (
                        <span className="text-sm text-muted-foreground">Chọn ga để tính giá</span>
                      ) : (
                        "---"
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex flex-col gap-3">
                <Button
                  className="h-12 w-full text-lg font-bold shadow-lg"
                  onClick={handleBook}
                  disabled={isBooking || (isSingleTicket && (!isOperatingHours || !fromStationId || !toStationId || sameStationSelected))}
                >
                  {isBooking ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Đang xử lý...
                    </>
                  ) : (!isOperatingHours && isSingleTicket) ? (
                     "Ngoài giờ hoạt động"
                  ) : isAuthenticated ? (
                     "Tiến hành thanh toán"
                  ) : (
                    "Đăng nhập để đặt vé"
                  )}
                </Button>
                <p className="px-4 text-center text-[10px] leading-relaxed text-muted-foreground">
                  Bằng cách nhấn nút &quot;Đặt vé&quot;, bạn đồng ý với Điều khoản và Chính sách vận tải của HCMC Metro.
                </p>
              </CardFooter>
            </Card>

            <Card className="border-none shadow-md">
              <CardContent className="flex items-center gap-4 p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <History className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <div className="text-sm font-bold">Lịch sử đặt vé</div>
                  <div className="text-xs text-muted-foreground">Xem các vé đã đặt và mã QR</div>
                </div>
                <Button variant="ghost" size="icon" onClick={() => router.push("/profile/tickets")}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
