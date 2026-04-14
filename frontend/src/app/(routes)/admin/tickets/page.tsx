"use client";

import React, { useEffect, useRef, useState } from "react";
import { Calendar, DollarSign, Download, Eye, Loader2, QrCode, Search, Ticket, TrendingUp } from "lucide-react";
import axios from "axios";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "/backend-api";

export default function AdminTicketsPage() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedQR, setSelectedQR] = useState<{ id: string; base64: string } | null>(null);

  const [scanInput, setScanInput] = useState("");
  const [scanCard, setScanCard] = useState<{
    ticketId: string;
    status: string;
    usageRemaining: number | null;
    detail: string;
    ticketTypeName?: string;
    routeText?: string;
    pricePaid?: string;
  } | null>(null);
  const [scanMessage, setScanMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [scanning, setScanning] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [cameraInfo, setCameraInfo] = useState<string>("Camera dang hoat dong");
  const isHandlingScanRef = useRef(false);
  const qrScannerRef = useRef<any>(null);

  const QR_READER_ID = "admin-ticket-qr-reader";

  const parseTicketIdFromRaw = (rawValue: string): string | null => {
    const raw = (rawValue || "").trim();
    if (!raw) return null;
    if (/^[0-9a-fA-F-]{36}$/.test(raw)) return raw;
    try {
      const parsed = JSON.parse(raw);
      const ticketId = parsed?.ticket_id;
      if (typeof ticketId === "string" && /^[0-9a-fA-F-]{36}$/.test(ticketId)) {
        return ticketId;
      }
    } catch (err) {
      // ignore parsing errors
    }
    return null;
  };

  const getStatusLabel = (status: string) => {
    if (status === "active") return "Dang hoat dong";
    if (status === "used") return "Da su dung";
    if (status === "expired") return "Da het han";
    if (status === "cancelled") return "Da huy";
    if (status === "pending") return "Cho thanh toan";
    return status;
  };

  const fetchTickets = async () => {
    try {
      const token = localStorage.getItem("metro.access");
      const res = await axios.get(`${API_BASE}/ticketing/admin/bookings/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTickets(res.data.results || res.data || []);
    } catch (err) {
      console.error("Failed to fetch tickets", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const handleViewQR = async (ticketId: string) => {
    setSelectedQR(null); // Clear old QR to show loading state
    try {
      const token = localStorage.getItem("metro.access");
      const res = await axios.get(`${API_BASE}/ticketing/admin/bookings/${ticketId}/qr/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSelectedQR({ id: ticketId, base64: res.data.qr_base64 });
    } catch (err) {
      console.error("Failed to fetch QR", err);
    }
  };

  const handleCancelTicket = async (ticketId: string) => {
    if (!confirm("Ban co chac chan muon xoa mem (huy) ve nay? Hanh dong nay se chuyen trang thai ve ve 'cancelled'.")) return;
    try {
      const token = localStorage.getItem("metro.access");
      await axios.delete(`${API_BASE}/ticketing/admin/bookings/${ticketId}/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
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
      const token = localStorage.getItem("metro.access");
      const payload: any = { qr_data: scanValue };
      if (parsedTicketId) {
        payload.ticket_id = parsedTicketId;
      }

      const res = await axios.post(`${API_BASE}/ticketing/admin/bookings/scan/`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

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
        ticketTypeName: matchedTicket?.ticket_type_name,
        routeText:
          matchedTicket?.from_station_details?.name && matchedTicket?.to_station_details?.name
            ? `${matchedTicket.from_station_details.name} -> ${matchedTicket.to_station_details.name}`
            : undefined,
        pricePaid: matchedTicket?.price_paid,
      });
      fetchTickets();
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
          ticketTypeName: matchedTicket?.ticket_type_name,
          routeText:
            matchedTicket?.from_station_details?.name && matchedTicket?.to_station_details?.name
              ? `${matchedTicket.from_station_details.name} -> ${matchedTicket.to_station_details.name}`
              : undefined,
          pricePaid: matchedTicket?.price_paid,
        });
      }
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
      const scanner = new Html5Qrcode(QR_READER_ID, { verbose: false });
      qrScannerRef.current = scanner;

      await scanner.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 260, height: 260 },
          aspectRatio: 16 / 9,
        },
        async (decodedText: string) => {
          if (isHandlingScanRef.current) return;
          isHandlingScanRef.current = true;
          setScanInput(decodedText);
          await stopCamera();
          await handleScanTicket(decodedText);
        },
        () => {
          // ignore decode-not-found frames
        }
      );

      setCameraInfo("Camera dang hoat dong");
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

  // Tu dong an thong tin ve va thong bao sau 10 giay
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
    (t) => t.id.toLowerCase().includes(search.toLowerCase()) || t.ticket_type_name.toLowerCase().includes(search.toLowerCase())
  );
  const totalRevenue = tickets
    .filter((t) => t.status !== "cancelled")
    .reduce((sum, t) => sum + parseFloat(t.price_paid || "0"), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="font-heading text-2xl font-bold tracking-tight">Quan ly ve va giao dich</h1>
          <p className="text-sm text-muted-foreground">Theo doi toan bo ve va doanh thu he thong.</p>
        </div>
        <Button className="gap-2 shadow-sm font-bold">
          <Download className="h-4 w-4" /> Xuat bao cao
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-none shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tong doanh thu</CardTitle>
            <DollarSign className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="font-mono text-2xl font-black text-primary">{loading ? "..." : `${totalRevenue.toLocaleString("vi-VN")} VND`}</div>
            <p className="text-xs text-muted-foreground">Tong gia tri ve da ban</p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Luot dat ve</CardTitle>
            <Ticket className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="font-mono text-2xl font-black">{loading ? "..." : tickets.length}</div>
            <p className="text-xs text-muted-foreground">Tong so ve trong he thong</p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ty le su dung</CardTitle>
            <TrendingUp className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="font-mono text-2xl font-black">-</div>
            <p className="text-xs text-muted-foreground">Cap nhat theo du lieu quet</p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Giao dich 24h</CardTitle>
            <Calendar className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="font-mono text-2xl font-black">-</div>
            <p className="text-xs text-muted-foreground">Dang hoat dong on dinh</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-none shadow-md">
        <CardHeader>
          <CardTitle>Quet QR soat ve bang camera</CardTitle>
          <CardDescription>Bat camera va dua QR vao khung de he thong tu dong quet.</CardDescription>
          <div className="flex flex-col gap-3 md:flex-row">
            <Button onClick={cameraActive ? stopCamera : startCamera} className="gap-2" variant={cameraActive ? "outline" : "default"}>
              <QrCode className="h-4 w-4" />
              {cameraActive ? "Tat camera" : "Bat camera quet"}
            </Button>
            <Input value={scanInput} readOnly placeholder="Thong tin tom tat ve se hien thi o day..." />
          </div>
          {scanCard && (
            <div className="grid gap-3 rounded-xl border bg-slate-50/80 p-3 md:grid-cols-2">
              <div>
                <div className="text-[11px] uppercase text-slate-500">Ma ve</div>
                <div className="font-mono text-sm font-semibold">{scanCard.ticketId ? `#${scanCard.ticketId.slice(0, 8)}` : "-"}</div>
              </div>
              <div>
                <div className="text-[11px] uppercase text-slate-500">Trang thai</div>
                <div className="text-sm font-semibold">{getStatusLabel(scanCard.status)}</div>
              </div>
              <div>
                <div className="text-[11px] uppercase text-slate-500">Loai ve</div>
                <div className="text-sm">{scanCard.ticketTypeName || "-"}</div>
              </div>
              <div>
                <div className="text-[11px] uppercase text-slate-500">Luot con</div>
                <div className="text-sm">{scanCard.usageRemaining === null ? "Vo han" : scanCard.usageRemaining}</div>
              </div>
              <div>
                <div className="text-[11px] uppercase text-slate-500">Lo trinh</div>
                <div className="text-sm">{scanCard.routeText || "-"}</div>
              </div>
              <div>
                <div className="text-[11px] uppercase text-slate-500">Gia ve</div>
                <div className="text-sm font-medium">
                  {scanCard.pricePaid ? `${parseInt(scanCard.pricePaid, 10).toLocaleString("vi-VN")} VND` : "-"}
                </div>
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
          {scanning && <div className="text-xs text-slate-500">Dang xu ly ket qua quet...</div>}
        </CardHeader>
      </Card>

      <Card className="border-none shadow-md">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Danh sach giao dich</CardTitle>
            <CardDescription>Hien thi cac ve gan nhat.</CardDescription>
          </div>
          <div className="relative w-72">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Tim ma ve hoac loai ve..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex flex-col items-center justify-center gap-3 py-20">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Dang tai du lieu...</p>
            </div>
          ) : (
            <div className="relative w-full overflow-auto">
              <table className="w-full caption-bottom text-sm">
                <thead>
                  <tr className="border-b text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    <td className="h-12 px-4 align-middle">Ma ve</td>
                    <td className="h-12 px-4 align-middle">Lo trinh</td>
                    <td className="h-12 px-4 align-middle">Loai ve</td>
                    <td className="h-12 px-4 align-middle text-right">Gia tien</td>
                    <td className="h-12 px-4 align-middle text-center">Trang thai</td>
                    <td className="h-12 px-4 align-middle text-center">Luot con</td>
                    <td className="h-12 px-4 align-middle text-right">Ngay mua</td>
                    <td className="h-12 px-4 align-middle text-right">QR</td>
                  </tr>
                </thead>
                <tbody className="font-medium">
                  {filteredTickets.map((ticket) => (
                    <tr key={ticket.id} className="border-b transition-colors hover:bg-muted/50">
                      <td className="p-4 align-middle font-mono text-xs text-muted-foreground">#{ticket.id.slice(0, 8)}</td>
                      <td className="p-4 align-middle">
                        <div className="flex flex-col">
                          <span className="font-bold">{ticket.from_station_details?.name || "He thong"}</span>
                          <span className="text-[10px] text-muted-foreground">{ticket.to_station_details?.name || "Tat ca ga"}</span>
                        </div>
                      </td>
                      <td className="p-4 align-middle">
                        <Badge variant="outline" className="border-none bg-primary/5 text-primary">
                          {ticket.ticket_type_name}
                        </Badge>
                      </td>
                      <td className="p-4 align-middle text-right font-mono font-bold">{parseInt(ticket.price_paid || "0", 10).toLocaleString("vi-VN")} VND</td>
                      <td className="p-4 align-middle text-center">
                        <Badge variant={ticket.status === "active" ? "default" : "outline"} className={ticket.status === "active" ? "bg-emerald-500" : ""}>
                          {ticket.status}
                        </Badge>
                      </td>
                      <td className="p-4 align-middle text-center">{ticket.usage_remaining === null || ticket.usage_remaining === undefined ? "Vo han" : ticket.usage_remaining}</td>
                      <td className="p-4 align-middle text-right text-xs text-muted-foreground">{new Date(ticket.created_at).toLocaleString("vi-VN")}</td>
                      <td className="p-4 align-middle text-right">
                        <div className="flex gap-1 justify-end">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="ghost" size="icon" onClick={() => handleViewQR(ticket.id)} title="Xem QR">
                                <Eye className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-md">
                              <DialogHeader>
                                <DialogTitle>QR ve #{ticket.id.slice(0, 8)}</DialogTitle>
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
                            </DialogContent>
                          </Dialog>
                          <Button variant="ghost" size="icon" className="text-rose-600 hover:text-rose-700 hover:bg-rose-50" onClick={() => handleCancelTicket(ticket.id)} disabled={ticket.status === "cancelled"} title="Xoa Mềm (Hủy Vé)">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-trash-2"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

