"use client";

import React, { useEffect, useRef, useState } from "react";
import { Calendar, DollarSign, Download, Eye, Loader2, QrCode, Search, Ticket, TrendingUp } from "lucide-react";
import api from "@/lib/api";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Pagination } from "@/components/admin/pagination";
import { StatCard } from "@/components/admin/StatCard";
import { accentInsensitiveSearch } from "@/lib/utils";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "/backend-api";

type ScanHistoryRow = {
  id: number;
  ticket: string;
  scanned_by: string | null;
  scanned_by_name: string;
  scanned_at: string;
  scan_date: string;
  status_before: string | null;
  status_after: string | null;
  usage_remaining_before: number | null;
  usage_remaining_after: number | null;
  success: boolean;
  message: string;
};

export default function AdminTicketsPage() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedQR, setSelectedQR] = useState<{ id: string; base64: string } | null>(null);
  const [scanHistories, setScanHistories] = useState<ScanHistoryRow[]>([]);
  const [scanHistoryLoading, setScanHistoryLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [scanInput, setScanInput] = useState("");
  const [scanCard, setScanCard] = useState<{
    ticketId: string;
    status: string;
    usageRemaining: number | null;
    detail: string;
    scannedAt?: string;
    scanDate?: string;
    ticketTypeName?: string;
    routeText?: string;
    pricePaid?: string;
  } | null>(null);
  const [scanMessage, setScanMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [scanning, setScanning] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [cameraInfo, setCameraInfo] = useState<string>("Camera đang tắt");
  const [dashboardStats, setDashboardStats] = useState<any>(null);
  const isHandlingScanRef = useRef(false);
  const qrScannerRef = useRef<any>(null);

  const QR_READER_ID = "admin-ticket-qr-reader";

  const parseTicketIdFromRaw = (rawValue: string): string | null => {
    const raw = (rawValue || "").trim();
    if (!raw) return null;
    
    // Check if it's a raw UUID (with or without hyphens)
    if (/^[0-9a-fA-F-]{32,36}$/.test(raw)) return raw;

    // Check for legacy "QR-HEX" format
    if (raw.toUpperCase().startsWith("QR-")) {
      const candidate = raw.substring(3);
      if (/^[0-9a-fA-F]{32,36}$/.test(candidate)) return candidate;
    }

    try {
      const parsed = JSON.parse(raw);
      const ticketId = parsed?.ticket_id;
      if (typeof ticketId === "string" && /^[0-9a-fA-F-]{32,36}$/.test(ticketId)) {
        return ticketId;
      }
    } catch (err) {
      // Not JSON, ignore
    }
    return null;
  };

  const getStatusLabel = (status: string) => {
    if (status === "active") return "Đang hoạt động";
    if (status === "used") return "Đã sử dụng";
    if (status === "expired") return "Đã hết hạn";
    if (status === "cancelled") return "Đã hủy";
    if (status === "pending") return "Chờ thanh toán";
    return status;
  };

  const getStatusBadgeClassName = (status: string) => {
    if (status === "active") return "border-emerald-200 bg-emerald-100 text-emerald-700";
    if (status === "used") return "border-blue-200 bg-blue-100 text-blue-700";
    if (status === "expired") return "border-rose-200 bg-rose-100 text-rose-700";
    if (status === "cancelled") return "border-slate-300 bg-slate-200 text-slate-700";
    if (status === "pending") return "border-amber-200 bg-amber-100 text-amber-700";
    return "border-slate-200 bg-slate-100 text-slate-600";
  };

  const getStatusCellClassName = (status: string) => {
    if (status === "active") return "bg-emerald-50";
    if (status === "used") return "bg-sky-50";
    if (status === "expired") return "bg-amber-50";
    if (status === "cancelled") return "bg-rose-50";
    if (status === "pending") return "bg-slate-50";
    return "bg-slate-50";
  };

  const fetchTickets = async (p = page) => {
    setLoading(true);
    try {
      const res = await api.get("/ticketing/admin/bookings/", {
        params: { page: p }
      });
      
      const data = res.data;
      if (data.results) {
        setTickets(data.results);
        setTotalPages(data.total_pages || 1);
      } else {
        setTickets(Array.isArray(data) ? data : []);
        setTotalPages(1);
      }
    } catch (err) {
      console.error("Failed to fetch tickets", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchScanHistories = async () => {
    setScanHistoryLoading(true);
    try {
      const res = await api.get("/ticketing/admin/bookings/scan-histories/", {
        params: { limit: 200 },
      });
      setScanHistories(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Failed to fetch scan histories", err);
      setScanHistories([]);
    } finally {
      setScanHistoryLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await api.get("/admin/stats/");
      setDashboardStats(res.data);
    } catch (err) {
      console.error("Failed to fetch stats", err);
    }
  };

  useEffect(() => {
    fetchTickets(page);
    fetchScanHistories();
    fetchStats();
  }, [page]);

  const handleViewQR = async (ticketId: string) => {
    setSelectedQR(null);
    try {
      const res = await api.get(`/ticketing/admin/bookings/${ticketId}/qr/`);
      setSelectedQR({ id: ticketId, base64: res.data.qr_base64 });
    } catch (err) {
      console.error("Failed to fetch QR", err);
    }
  };

  const handleCancelTicket = async (ticketId: string) => {
    if (!confirm("Ban co chac chan muon xoa mem (huy) ve nay? Hanh dong nay se chuyen trang thai ve ve 'cancelled'.")) return;
    try {
      await api.delete(`/ticketing/admin/bookings/${ticketId}/`);
      fetchTickets();
    } catch (err) {
      console.error("Failed to cancel ticket", err);
      alert("Huy ve that bai.");
    }
  };

  const handleScanTicket = async (rawValue?: string) => {
    const scanValue = (rawValue ?? scanInput).trim();
    const parsedTicketId = parseTicketIdFromRaw(scanValue);
    if (!scanValue) {
      setScanMessage({ type: "error", text: "Khong doc duoc du lieu QR." });
      return;
    }

    setScanning(true);
    setScanMessage(null);
    try {
      const payload: any = { qr_data: scanValue };
      if (parsedTicketId) {
        payload.ticket_id = parsedTicketId;
      }

      const res = await api.post("/ticketing/admin/bookings/scan/", payload);

      const finalTicketId = String(res.data.ticket_id || parsedTicketId || "");
      const matchedTicket = tickets.find((t) => t.id === finalTicketId);

      const usageText =
        res.data.usage_remaining === null || res.data.usage_remaining === undefined
          ? ""
          : ` | Luot con: ${res.data.usage_remaining}`;

      setScanMessage({
        type: "success",
        text: `${res.data.detail} (Ve #${String(res.data.ticket_id || "").slice(0, 8)})${usageText}`,
      });
      setScanInput(finalTicketId ? `Ve #${finalTicketId.slice(0, 8)}` : "Da nhan du lieu QR");
      setScanCard({
        ticketId: finalTicketId,
        status: String(res.data.status || ""),
        usageRemaining: res.data.usage_remaining ?? null,
        detail: String(res.data.detail || ""),
        scannedAt: typeof res.data.scanned_at === "string" ? res.data.scanned_at : undefined,
        scanDate: typeof res.data.scan_date === "string" ? res.data.scan_date : undefined,
        ticketTypeName: matchedTicket?.ticket_type_name,
        routeText:
          matchedTicket?.from_station_details?.name && matchedTicket?.to_station_details?.name
            ? `${matchedTicket.from_station_details.name} -> ${matchedTicket.to_station_details.name}`
            : undefined,
        pricePaid: matchedTicket?.price_paid,
      });
      fetchTickets();
      fetchScanHistories();
    } catch (err: any) {
      setScanMessage({
        type: "error",
        text: err.response?.data?.detail || "Quet ve that bai.",
      });
      const fallbackTicketId = parsedTicketId || "";
      if (fallbackTicketId) {
        const matchedTicket = tickets.find((t) => t.id === fallbackTicketId);
        setScanInput(`Ve #${fallbackTicketId.slice(0, 8)}`);
        setScanCard({
          ticketId: fallbackTicketId,
          status: String(err.response?.data?.status || ""),
          usageRemaining: err.response?.data?.usage_remaining ?? matchedTicket?.usage_remaining ?? null,
          detail: String(err.response?.data?.detail || "Quet ve that bai."),
          scannedAt: typeof err.response?.data?.scanned_at === "string" ? err.response.data.scanned_at : undefined,
          scanDate: typeof err.response?.data?.scan_date === "string" ? err.response.data.scan_date : undefined,
          ticketTypeName: matchedTicket?.ticket_type_name,
          routeText:
            matchedTicket?.from_station_details?.name && matchedTicket?.to_station_details?.name
              ? `${matchedTicket.from_station_details.name} -> ${matchedTicket.to_station_details.name}`
              : undefined,
          pricePaid: matchedTicket?.price_paid,
        });
      }
      fetchScanHistories();
    } finally {
      setScanning(false);
    }
  };

  const stopCamera = async () => {
    const scanner = qrScannerRef.current;
    if (scanner) {
      try {
        await scanner.stop();
      } catch (err) {
        // ignore when scanner is not running
      }
      try {
        await scanner.clear();
      } catch (err) {
        // ignore clear errors
      }
      qrScannerRef.current = null;
    }
    setCameraActive(false);
    setCameraInfo("Camera đang tắt");
    isHandlingScanRef.current = false;
  };

  const startCamera = async () => {
    setCameraError(null);
    setScanMessage(null);
    isHandlingScanRef.current = false;
    try {
      if (qrScannerRef.current) {
        await stopCamera();
      }

      setCameraActive(true);
      await new Promise((resolve) => window.setTimeout(resolve, 0));

      const { Html5Qrcode } = await import("html5-qrcode");
      const scanner = new Html5Qrcode(QR_READER_ID, { 
        verbose: false,
        useBarCodeDetectorIfSupported: true
      });
      qrScannerRef.current = scanner;

      await scanner.start(
        { facingMode: "environment" },
        {
          fps: 20,
          qrbox: (viewfinderWidth, viewfinderHeight) => {
            const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
            const qrboxSize = Math.floor(minEdge * 0.7);
            return { width: qrboxSize, height: qrboxSize };
          },
        },
        async (decodedText: string) => {
          if (isHandlingScanRef.current) return;
          isHandlingScanRef.current = true;
          setScanInput(decodedText);
          setCameraInfo("Đã nhận diện mã QR");
          await stopCamera();
          await handleScanTicket(decodedText);
        },
        () => {
          setCameraInfo("Đang quét...");
        }
      );

      setCameraInfo("Camera đang hoạt động");
    } catch (err) {
      console.error("Error starting camera:", err);
      setCameraError("Khong mo duoc camera. Vui long cap quyen camera cho trinh duyet.");
      await stopCamera();
    }
  };

  useEffect(() => {
    return () => {
      void stopCamera();
    };
  }, []);

  useEffect(() => {
    if (scanCard || scanMessage) {
      const timer = setTimeout(() => {
        setScanCard(null);
        setScanMessage(null);
      }, 10000);
      return () => clearTimeout(timer);
    }
  }, [scanCard, scanMessage]);

  const filteredTickets = tickets.filter(
    (t) => accentInsensitiveSearch(t.id, search) || accentInsensitiveSearch(t.ticket_type_name, search)
  );
  const totalRevenue = tickets
    .filter((t) => t.status !== "cancelled")
    .reduce((sum, t) => sum + parseFloat(t.price_paid || "0"), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="font-heading text-2xl font-bold tracking-tight">Quản lý vé & giao dịch</h1>
          <p className="text-sm text-muted-foreground">Theo dõi toàn bộ vé và doanh thu hệ thống.</p>
        </div>
        <Button className="gap-2 shadow-sm font-bold">
          <Download className="h-4 w-4" /> Xuất báo cáo
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard 
          label="Tổng doanh thu" 
          value={`${totalRevenue.toLocaleString("vi-VN")} VND`} 
          icon={DollarSign} 
          description="Tổng giá trị vé đã bán"
        />
        <StatCard 
          label="Lượt đặt vé" 
          value={dashboardStats?.total_tickets ?? tickets.length} 
          icon={Ticket} 
          description="Số lượng vé trong hệ thống"
        />
        <StatCard 
          label="Tỷ lệ sử dụng" 
          value={dashboardStats ? `${dashboardStats.usage_rate}%` : "-"} 
          icon={TrendingUp} 
          color="text-emerald-500"
          bg="bg-emerald-50"
          description="Cập nhật theo dữ liệu quét"
        />
        <StatCard 
          label="Giao dịch 24h" 
          value={dashboardStats?.transactions_24h ?? "-"} 
          icon={Calendar} 
          description="Giao dịch trong 24 giờ qua"
        />
      </div>

      <Card className="border-none shadow-md">
        <CardHeader>
          <CardTitle>Quét QR soát vé bằng camera</CardTitle>
          <CardDescription>Bật camera và đưa mã QR vào khung để hệ thống tự động quét.</CardDescription>
          <div className="flex flex-col gap-3 md:flex-row">
            <Button onClick={cameraActive ? stopCamera : startCamera} className="gap-2" variant={cameraActive ? "outline" : "default"}>
              <QrCode className="h-4 w-4" />
              {cameraActive ? "Tắt camera" : "Bật camera quét"}
            </Button>
            <Input value={scanInput} readOnly placeholder="Thông tin tóm tắt vé sẽ hiển thị ở đây..." />
          </div>
          {scanCard && (
            <div className="grid gap-3 rounded-xl border bg-slate-50/80 p-3 md:grid-cols-2">
              <div>
                <div className="text-[11px] uppercase text-slate-500">Mã vé</div>
                <div className="font-mono text-sm font-semibold">{scanCard.ticketId ? `#${scanCard.ticketId.slice(0, 8)}` : "-"}</div>
              </div>
              <div>
                <div className="text-[11px] uppercase text-slate-500">Trạng thái</div>
                <Badge variant="outline" className={getStatusBadgeClassName(scanCard.status)}>
                  {getStatusLabel(scanCard.status)}
                </Badge>
              </div>
              <div>
                <div className="text-[11px] uppercase text-slate-500">Loại vé</div>
                <div className="text-sm">{scanCard.ticketTypeName || "-"}</div>
              </div>
              <div>
                <div className="text-[11px] uppercase text-slate-500">Lượt còn</div>
                <div className="text-sm">{scanCard.usageRemaining === null ? "Vô hạn" : scanCard.usageRemaining}</div>
              </div>
              <div>
                <div className="text-[11px] uppercase text-slate-500">Lộ trình</div>
                <div className="text-sm">{scanCard.routeText || "-"}</div>
              </div>
              <div>
                <div className="text-[11px] uppercase text-slate-500">Giá vé</div>
                <div className="text-sm font-medium">
                  {scanCard.pricePaid ? `${parseInt(scanCard.pricePaid, 10).toLocaleString("vi-VN")} VND` : "-"}
                </div>
              </div>
              <div>
                <div className="text-[11px] uppercase text-slate-500">Thời gian quét</div>
                <div className="text-sm">{scanCard.scannedAt ? new Date(scanCard.scannedAt).toLocaleString("vi-VN") : "-"}</div>
              </div>
              <div>
                <div className="text-[11px] uppercase text-slate-500">Ngày quét</div>
                <div className="text-sm">{scanCard.scanDate || "-"}</div>
              </div>
            </div>
          )}
          <div className={`overflow-hidden rounded-xl border bg-black transition-all ${cameraActive ? "block" : "hidden"}`}>
            <div id={QR_READER_ID} className="min-h-[320px] w-full" />
          </div>
          {cameraInfo && <div className="rounded-lg bg-slate-50 p-2 text-xs text-slate-600">Camera: {cameraInfo}</div>}
          {cameraError && <div className="rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{cameraError}</div>}
          {scanMessage && (
            <div className={`rounded-lg p-3 text-sm ${scanMessage.type === "success" ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}>
              {scanMessage.text}
            </div>
          )}
          {scanning && <div className="text-xs text-slate-500">Đang xử lý kết quả quét...</div>}
        </CardHeader>
      </Card>

      <Card className="border-none shadow-md">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Danh sách giao dịch</CardTitle>
            <CardDescription>Hiển thị các vé gần nhất.</CardDescription>
          </div>
          <div className="relative w-72">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Tìm mã vé hoặc loại vé..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex flex-col items-center justify-center gap-3 py-20">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Đang tải dữ liệu...</p>
            </div>
          ) : (
            <div className="rounded-xl border border-slate-100 overflow-hidden shadow-sm">
              <div className="relative w-full overflow-auto">
                <table className="w-full caption-bottom text-sm">
                  <thead>
                    <tr className="border-b bg-slate-50/80 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      <td className="h-12 px-4 align-middle">Mã vé</td>
                      <td className="h-12 px-4 align-middle">Lộ trình</td>
                      <td className="h-12 px-4 align-middle text-center">Loại vé</td>
                      <td className="h-12 px-4 align-middle text-center">Giá tiền</td>
                      <td className="h-12 px-4 align-middle text-center">Trạng thái</td>
                      <td className="h-12 px-4 align-middle text-center">Lượt còn</td>
                      <td className="h-12 px-4 align-middle text-center">Ngày mua</td>
                      <td className="h-12 px-4 align-middle text-center">QR</td>
                    </tr>
                  </thead>
                  <tbody className="font-medium divide-y">
                    {filteredTickets.map((ticket) => (
                      <tr key={ticket.id} className="transition-colors hover:bg-muted/50">
                        <td className="p-4 align-middle font-mono text-xs text-muted-foreground">#{ticket.id.slice(0, 8)}</td>
                        <td className="p-4 align-middle">
                          <div className="flex flex-col">
                            <span className="font-bold">{ticket.from_station_details?.name || "Hệ thống"}</span>
                            <span className="text-[10px] text-muted-foreground">{ticket.to_station_details?.name || "Tất cả ga"}</span>
                          </div>
                        </td>
                        <td className="p-4 align-middle text-center">
                          <Badge variant="outline" className="border-none bg-primary/5 text-primary text-[10px] font-bold uppercase">
                            {ticket.ticket_type_name}
                          </Badge>
                        </td>
                        <td className="p-4 align-middle text-center font-mono font-bold">{parseInt(ticket.price_paid || "0", 10).toLocaleString("vi-VN")} VND</td>
                        <td className="p-4 align-middle text-center">
                          <Badge variant="outline" className={getStatusBadgeClassName(ticket.status) + " text-[10px] font-bold uppercase"}>
                            {getStatusLabel(ticket.status)}
                          </Badge>
                        </td>
                        <td className="p-4 align-middle text-center text-xs">{ticket.usage_remaining === null || ticket.usage_remaining === undefined ? "Vô hạn" : ticket.usage_remaining}</td>
                        <td className="p-4 align-middle text-center text-[10px] text-muted-foreground">{new Date(ticket.created_at).toLocaleString("vi-VN")}</td>
                        <td className="p-4 align-middle text-center">
                          <div className="flex gap-1 justify-center">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button variant="ghost" size="icon" onClick={() => handleViewQR(ticket.id)} title="Xem QR">
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="sm:max-w-md">
                                <DialogHeader>
                                  <DialogTitle>QR vé #{ticket.id.slice(0, 8)}</DialogTitle>
                                </DialogHeader>
                                <div className="flex flex-col items-center justify-center gap-4 p-6">
                                  {selectedQR ? (
                                    <img src={`data:image/png;base64,${selectedQR.base64}`} alt="QR" className="h-64 w-64 rounded-xl border bg-white p-2 shadow-sm" />
                                  ) : (
                                    <Loader2 className="h-10 w-10 animate-spin text-primary" />
                                  )}
                                  <div className="text-center">
                                    <div className="text-lg font-bold">{ticket.ticket_type_name}</div>
                                    <div className="text-sm text-muted-foreground">ID: {ticket.id}</div>
                                  </div>
                                </div>
              </table>
              <Pagination 
                currentPage={page} 
                totalPages={totalPages} 
                onPageChange={(p) => setPage(p)} 
              />
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-none shadow-md">
        <CardHeader>
          <CardTitle>Lịch sử scan (gần đây)</CardTitle>
          <CardDescription>Tự động cập nhật sau mỗi lần quét vé.</CardDescription>
        </CardHeader>
        <CardContent>
          {scanHistoryLoading ? (
            <div className="flex flex-col items-center justify-center gap-3 py-10">
              <Loader2 className="h-7 w-7 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Đang tải lịch sử scan...</p>
            </div>
          ) : scanHistories.length === 0 ? (
            <div className="py-8 text-sm text-muted-foreground">Chưa có lịch sử scan.</div>
          ) : (
            <div className="rounded-xl border border-slate-100 overflow-hidden shadow-sm">
              <div className="relative w-full overflow-auto">
                <table className="w-full caption-bottom text-sm">
                  <thead>
                    <tr className="border-b bg-slate-50/80 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      <td className="h-12 px-4 align-middle">Thời gian</td>
                      <td className="h-12 px-4 align-middle">Mã vé</td>
                      <td className="h-12 px-4 align-middle">Người quét</td>
                      <td className="h-12 px-4 align-middle">Kết quả</td>
                      <td className="h-12 px-4 align-middle">Nội dung</td>
                      <td className="h-12 px-4 align-middle text-center">Trước → Sau</td>
                    </tr>
                  </thead>
                  <tbody className="font-medium divide-y">
                    {scanHistories.slice(0, 50).map((h) => (
                      <tr key={h.id} className="border-b transition-colors hover:bg-muted/50">
                        <td className="p-4 align-middle text-[10px] text-muted-foreground">
                          {h.scanned_at ? new Date(h.scanned_at).toLocaleString("vi-VN") : "-"}
                        </td>
                        <td className="p-4 align-middle font-mono text-xs text-muted-foreground">
                          {h.ticket ? `#${String(h.ticket).slice(0, 8)}` : "-"}
                        </td>
                        <td className="p-4 align-middle text-sm font-bold">{h.scanned_by_name || "System"}</td>
                        <td className="p-4 align-middle">
                          <Badge
                            variant="outline"
                            className={
                              (h.success
                                ? "border-transparent bg-emerald-100 text-emerald-700"
                                : "border-transparent bg-rose-100 text-rose-700") + " text-[10px] font-bold uppercase"
                            }
                          >
                            {h.success ? "Thành công" : "Thất bại"}
                          </Badge>
                        </td>
                        <td className="p-4 align-middle text-sm">{h.message}</td>
                        <td className="p-4 align-middle text-center text-xs text-muted-foreground">
                          <span className="font-bold text-slate-700">{getStatusLabel(h.status_before ?? "")}</span>
                          {" → "}
                          <span className="font-bold text-primary">{getStatusLabel(h.status_after ?? "")}</span>
                          {h.usage_remaining_before !== null || h.usage_remaining_after !== null ? (
                            <span className="ml-2 font-mono opacity-60">
                              ({h.usage_remaining_before ?? "-"}→{h.usage_remaining_after ?? "-"})
                            </span>
                          ) : null}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
