"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Pagination } from "@/components/admin/pagination";

type TicketItem = {
  id: string;
  ticket_type_name: string;
  status: string;
  valid_from: string;
  valid_until: string;
  from_station_details?: { name?: string; code?: string } | null;
  to_station_details?: { name?: string; code?: string } | null;
  price_paid: string;
  created_at: string;
};

function statusLabel(status: string): string {
  switch (status.toLowerCase()) {
    case "active": return "Đang hoạt động";
    case "pending": return "Chưa thanh toán";
    case "cancelled": return "Đã hủy";
    case "expired": return "Hết hạn";
    case "used": return "Đang sử dụng";
    default: return status;
  }
}

function TicketStatusBadge({ status }: { status: string }) {
  const normalized = status.toLowerCase();
  const className =
    normalized === "cancelled"
      ? "bg-rose-100 text-rose-700 hover:bg-rose-100"
      : normalized === "expired"
        ? "bg-slate-100 text-slate-700 hover:bg-slate-100"
        : "bg-emerald-100 text-emerald-700 hover:bg-emerald-100";

  return (
    <Badge variant="secondary" className={className}>
      {statusLabel(status)}
    </Badge>
  );
}

function formatDateTime(value?: string) {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString("vi-VN");
}

function formatRoute(t: TicketItem) {
  const fromName = t.from_station_details?.name || "Hệ thống";
  const toName = t.to_station_details?.name || "Tất cả ga";
  return `${fromName} → ${toName}`;
}

function getDetailActionClass(status: string): string {
  const normalized = status.toLowerCase();
  if (normalized === "active" || normalized === "used" || normalized === "unused") {
    return "bg-emerald-100 text-emerald-700 hover:bg-emerald-200";
  }
  return "bg-blue-100 text-blue-700 hover:bg-blue-200";
}

export default function TicketsHistoryPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const [tickets, setTickets] = React.useState<TicketItem[]>([]);
  const [loadingTickets, setLoadingTickets] = React.useState(false);
  const [actingTicketId, setActingTicketId] = React.useState<string | null>(null);
  const [page, setPage] = React.useState(1);
  const [totalPages, setTotalPages] = React.useState(1);

  const loadTickets = React.useCallback(async (p = page) => {
    if (!isAuthenticated) return;
    setLoadingTickets(true);
    try {
      const res = await api.get("/ticketing/my-tickets/", {
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
    } catch (err: any) {
      console.error("Failed to load tickets", err);
    } finally {
      setLoadingTickets(false);
    }
  }, [isAuthenticated, page]);

  React.useEffect(() => {
    loadTickets(page);
  }, [loadTickets, page]);

  const continuePayment = async (ticketId: string) => {
    setActingTicketId(ticketId);
    try {
      const res = await api.post("/payments/payos/continue/", { ticket_id: ticketId });
      if (res.data?.payment_url) {
        window.location.href = res.data.payment_url;
      } else {
        alert("Không tạo được liên kết thanh toán.");
      }
    } catch (err: any) {
      alert(err.response?.data?.detail || "Không thể tiếp tục thanh toán.");
    } finally {
      setActingTicketId(null);
    }
  };

  const cancelTicket = async (ticketId: string) => {
    setActingTicketId(ticketId);
    try {
      await api.post(`/ticketing/my-tickets/${ticketId}/cancel/`);
      setTickets((prev) => prev.map((item) => (item.id === ticketId ? { ...item, status: "cancelled" } : item)));
    } catch (err: any) {
      alert(err.response?.data?.detail || "Không thể hủy vé.");
    } finally {
      setActingTicketId(null);
    }
  };

  return (
    <Card className="shadow-card">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Lịch sử vé</CardTitle>
      </CardHeader>
      <CardContent>
        {loadingTickets ? (
          <p className="text-sm text-muted-foreground">Đang tải dữ liệu...</p>
        ) : tickets.length === 0 ? (
          <p className="text-sm text-muted-foreground">Chưa có dữ liệu vé.</p>
        ) : (
          <>
            <div className="overflow-x-auto rounded-xl border">
              <table className="w-full text-sm">
                <thead className="bg-muted/60 text-left text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 font-medium">Mã vé</th>
                    <th className="px-4 py-3 font-medium">Lộ trình/Loại</th>
                    <th className="px-4 py-3 font-medium">Ngày mua</th>
                    <th className="px-4 py-3 font-medium">Hạng vé</th>
                    <th className="px-4 py-3 font-medium">Giá tiền</th>
                    <th className="px-4 py-3 font-medium">Trạng thái</th>
                    <th className="px-4 py-3 text-center font-medium">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {tickets.map((ticket) => (
                    <tr key={ticket.id} className="border-t">
                      <td className="px-4 py-3 font-medium">#{ticket.id.slice(0, 8)}</td>
                      <td className="px-4 py-3">{formatRoute(ticket)}</td>
                      <td className="px-4 py-3">{formatDateTime(ticket.created_at)}</td>
                      <td className="px-4 py-3">{ticket.ticket_type_name}</td>
                      <td className="px-4 py-3">{Math.round(parseFloat(ticket.price_paid || "0")).toLocaleString("vi-VN")}₫</td>
                      <td className="px-4 py-3">
                        <TicketStatusBadge status={ticket.status} />
                      </td>
                      <td className="px-4 py-3 text-center">
                        {ticket.status === "pending" ? (
                          <div className="flex items-center justify-center gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-auto rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-200 hover:text-emerald-700"
                              onClick={() => continuePayment(ticket.id)}
                              disabled={actingTicketId === ticket.id}
                            >
                              Thanh toán
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-auto rounded-full bg-rose-100 px-3 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-200 hover:text-rose-700"
                              onClick={() => cancelTicket(ticket.id)}
                              disabled={actingTicketId === ticket.id}
                            >
                              Hủy vé
                            </Button>
                          </div>
                        ) : ticket.status === "cancelled" ? (
                          <span />
                        ) : (
                          <Button
                            size="sm"
                            variant="ghost"
                            className={`h-auto rounded-full px-3 py-1 text-xs font-semibold ${getDetailActionClass(ticket.status)}`}
                            onClick={() => router.push(`/dat-ve/thanh-cong?id=${ticket.id}`)}
                          >
                            Xem chi tiết
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination 
              currentPage={page} 
              totalPages={totalPages} 
              onPageChange={(p) => setPage(p)} 
              className="mt-4"
            />
          </>
        )}
      </CardContent>
    </Card>
  );
}
