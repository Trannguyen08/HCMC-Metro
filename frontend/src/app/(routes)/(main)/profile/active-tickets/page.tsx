"use client";

import * as React from "react";
import { QrCode } from "lucide-react";
import api from "@/lib/api";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

type TicketItem = {
  id: string;
  ticket_type_name: string;
  status: string;
  valid_from: string;
  valid_until: string;
  created_at: string;
};

function formatDate(value?: string) {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString("vi-VN");
}

export default function ActiveTicketsPage() {
  const { isAuthenticated } = useAuth();
  const [tickets, setTickets] = React.useState<TicketItem[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [qrByTicket, setQrByTicket] = React.useState<Record<string, string>>({});

  const loadTickets = React.useCallback(async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    try {
      const res = await api.get("/ticketing/my-tickets/");
      const data = res.data;
      const results = data.results || (Array.isArray(data) ? data : []);
      setTickets(results.filter((t: TicketItem) => t.status === "active"));
    } catch (err: any) {
      console.error("Failed to load tickets", err);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  React.useEffect(() => {
    loadTickets();
  }, [loadTickets]);

  const loadQr = async (ticketId: string) => {
    try {
      const res = await api.get(`/ticketing/my-tickets/${ticketId}/qr/`);
      const qr = res.data?.qr_base64;
      if (qr) {
        setQrByTicket((prev) => ({ ...prev, [ticketId]: qr }));
      }
    } catch (err) {
      console.error("Failed to load QR", err);
    }
  };

  const downloadQrImage = (ticketId: string) => {
    const qr = qrByTicket[ticketId];
    if (!qr) return;
    const link = document.createElement("a");
    link.href = `data:image/png;base64,${qr}`;
    link.download = `metro-ticket-${ticketId.slice(0, 8)}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4">
      {loading ? (
        <Card className="shadow-card">
          <CardContent className="p-4 text-sm text-muted-foreground">Đang tải dữ liệu...</CardContent>
        </Card>
      ) : tickets.length === 0 ? (
        <Card className="shadow-card">
          <CardContent className="p-4 text-sm text-muted-foreground">Không có vé đang hoạt động.</CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {tickets.map((ticket) => (
            <Card key={ticket.id} className="card-hover shadow-card">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Vé #{ticket.id.slice(0, 8)}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="rounded-xl border bg-background p-4 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Loại vé</span>
                    <span className="font-medium">{ticket.ticket_type_name}</span>
                  </div>
                  <Separator className="my-3" />
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Thời hạn sử dụng</span>
                    <span className="font-medium">{formatDate(ticket.valid_from)} - {formatDate(ticket.valid_until)}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between rounded-xl border bg-muted/40 p-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <QrCode className="h-4 w-4 text-metro-blue" />
                      Mã QR vé
                    </div>
                    <div className="text-xs text-muted-foreground">Xuất trình tại cổng soát vé</div>
                  </div>
                  <div>
                    {qrByTicket[ticket.id] ? (
                      <div className="flex flex-col items-center gap-2">
                        <img
                          src={`data:image/png;base64,${qrByTicket[ticket.id]}`}
                          alt={`QR ${ticket.id}`}
                          className="h-20 w-20 rounded-lg border bg-background p-1"
                        />
                        <Button size="sm" variant="outline" onClick={() => downloadQrImage(ticket.id)}>
                          Tải ảnh
                        </Button>
                      </div>
                    ) : (
                      <Button size="sm" variant="outline" onClick={() => loadQr(ticket.id)}>
                        Tải QR
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
