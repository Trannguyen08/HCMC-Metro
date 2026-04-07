"use client";

import React, { useEffect, useState } from "react";
import { 
  Ticket, 
  TrendingUp, 
  Calendar,
  DollarSign,
  Download,
  Search,
  Eye,
  Loader2,
  QrCode,
  MapPin,
  ArrowRight,
  Info
} from "lucide-react";

import axios from "axios";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

export default function AdminTicketsPage() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedQR, setSelectedQR] = useState<{ id: string, base64: string } | null>(null);

  const fetchTickets = async () => {
    try {
      const token = localStorage.getItem("metro.access");
      const res = await axios.get(`${API_BASE}/ticketing/admin/bookings/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTickets(res.data.results || res.data);
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
    try {
      const token = localStorage.getItem("metro.access");
      const res = await axios.get(`${API_BASE}/ticketing/my-tickets/${ticketId}/qr/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSelectedQR({ id: ticketId, base64: res.data.qr_base64 });
    } catch (err) {
      console.error("Failed to fetch QR", err);
    }
  };

  const filteredTickets = tickets.filter(t => 
    t.id.toLowerCase().includes(search.toLowerCase()) ||
    t.ticket_type_name.toLowerCase().includes(search.toLowerCase())
  );

  const totalRevenue = tickets.reduce((sum, t) => sum + parseFloat(t.price_paid), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight font-heading">Quản lý Vé & Giao dịch</h1>
          <p className="text-sm text-muted-foreground">Theo dõi tất cả vé đã xuất và doanh thu hệ thống.</p>
        </div>
        <Button className="gap-2 shadow-sm font-bold">
          <Download className="h-4 w-4" /> Xuất báo cáo
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-none shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tổng doanh thu</CardTitle>
            <DollarSign className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black font-mono text-primary">
              {loading ? "..." : `${totalRevenue.toLocaleString("vi-VN")}₫`}
            </div>
            <p className="text-xs text-muted-foreground">+8.4% so với tuần trước</p>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Lượt đặt vé</CardTitle>
            <Ticket className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black font-mono">{loading ? "..." : tickets.length}</div>
            <p className="text-xs text-muted-foreground">Tổng số vé đã xuất hệ thống</p>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tỷ lệ sử dụng</CardTitle>
            <TrendingUp className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black font-mono">92.5%</div>
            <p className="text-xs text-muted-foreground">Vé đã quét tại cổng</p>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Giao dịch 24h</CardTitle>
            <Calendar className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black font-mono">124</div>
            <p className="text-xs text-muted-foreground">Đang hoạt động ổn định</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-none shadow-md">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Danh sách Giao dịch</CardTitle>
            <CardDescription>Hiển thị 50 giao dịch gần nhất.</CardDescription>
          </div>
          <div className="relative w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Tìm theo mã vé hoặc loại vé..." 
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Đang tải dữ liệu...</p>
            </div>
          ) : (
            <div className="relative w-full overflow-auto">
              <table className="w-full caption-bottom text-sm">
                <thead>
                  <tr className="border-b transition-colors hover:bg-muted/50 font-bold text-muted-foreground uppercase text-[10px] tracking-wider">
                    <td className="h-12 px-4 align-middle w-[100px]">Mã vé</td>
                    <td className="h-12 px-4 align-middle">Lộ trình (Từ - Đến)</td>
                    <td className="h-12 px-4 align-middle">Loại vé</td>
                    <td className="h-12 px-4 align-middle text-right">Giá tiền</td>
                    <td className="h-12 px-4 align-middle text-center">Giảm giá</td>
                    <td className="h-12 px-4 align-middle text-center">Trạng thái</td>
                    <td className="h-12 px-4 align-middle text-right">Ngày mua</td>
                    <td className="h-12 px-4 align-middle text-right">Mã QR</td>
                  </tr>
                </thead>
                <tbody className="[&_tr:last-child]:border-0 font-medium">
                  {filteredTickets.map((ticket) => (
                    <tr key={ticket.id} className="border-b transition-colors hover:bg-muted/50">
                      <td className="p-4 align-middle text-xs font-mono text-muted-foreground">
                        #{ticket.id.slice(0, 8)}
                      </td>
                      <td className="p-4 align-middle">
                        <div className="flex flex-col">
                          <span className="font-bold">{ticket.from_station_details?.name || "Hệ thống"}</span>
                          <span className="text-[10px] text-muted-foreground">{ticket.to_station_details?.name || "Tất cả các ga"}</span>
                        </div>
                      </td>
                      <td className="p-4 align-middle">
                        <Badge variant="outline" className="bg-primary/5 text-primary border-none">
                          {ticket.ticket_type_name}
                        </Badge>
                      </td>
                      <td className="p-4 align-middle text-right font-mono font-bold">
                        {parseInt(ticket.price_paid).toLocaleString("vi-VN")}₫
                      </td>
                      <td className="p-4 align-middle text-center">
                        <Badge variant="secondary" className="bg-rose-50 text-rose-600 border-none font-bold">
                          {parseFloat(ticket.discount_applied) * 100}%
                        </Badge>
                      </td>
                      <td className="p-4 align-middle text-center">
                        <Badge variant={ticket.status === "active" ? "default" : "outline"} className={ticket.status === 'active' ? 'bg-emerald-500' : ''}>
                          {ticket.status === 'active' ? 'Hoạt động' : ticket.status}
                        </Badge>
                      </td>
                      <td className="p-4 align-middle text-right text-xs text-muted-foreground">
                        {new Date(ticket.created_at).toLocaleString("vi-VN")}
                      </td>
                      <td className="p-4 align-middle text-right">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="ghost" size="icon" onClick={() => handleViewQR(ticket.id)}>
                              <Eye className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="sm:max-w-md">
                            <DialogHeader>
                              <DialogTitle>Mã QR Vé #{ticket.id.slice(0, 8)}</DialogTitle>
                            </DialogHeader>
                            <div className="flex flex-col items-center justify-center p-6 gap-4">
                              {selectedQR ? (
                                <img src={`data:image/png;base64,${selectedQR.base64}`} alt="QR" className="w-64 h-64 border p-2 rounded-xl bg-white shadow-sm" />
                              ) : (
                                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                              )}
                              <div className="text-center">
                                <div className="font-bold text-lg">{ticket.ticket_type_name}</div>
                                <div className="text-sm text-muted-foreground">ID: {ticket.id}</div>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
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

