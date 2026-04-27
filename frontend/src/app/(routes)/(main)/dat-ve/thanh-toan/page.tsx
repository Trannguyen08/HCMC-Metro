"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AlertCircle, CreditCard, Loader2, Ticket } from "lucide-react";

import api from "@/services/api-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/store/use-toast-store";

type TicketDetail = {
  id: string;
  ticket_type_name: string;
  status: string;
  valid_from: string;
  valid_until: string;
  from_station_details?: { name?: string } | null;
  to_station_details?: { name?: string } | null;
  price_paid: string;
};

export default function BookingPaymentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const ticketId = searchParams.get("ticket_id");

  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [ticket, setTicket] = useState<TicketDetail | null>(null);

  const formattedPrice = useMemo(() => {
    if (!ticket?.price_paid) return "0 đ";
    return `${Math.round(parseFloat(ticket.price_paid)).toLocaleString("vi-VN")} đ`;
  }, [ticket?.price_paid]);

  useEffect(() => {
    const loadTicket = async () => {
      if (!ticketId) {
        toast.error("Thiếu mã vé.");
        setLoading(false);
        return;
      }

      try {
        const res = await api.get(`/ticketing/my-tickets/${ticketId}/`);
        setTicket(res.data);
        if (res.data?.status !== "pending") {
          toast.error("Vé này không còn ở trạng thái chờ thanh toán.");
        }
      } catch (err: any) {
        toast.error(err.response?.data?.detail || "Không tải được thông tin vé.");
      } finally {
        setLoading(false);
      }
    };

    loadTicket();
  }, [ticketId]);

  const handleContinuePayment = async () => {
    if (!ticketId) return;
    setProcessing(true);
    try {
      const res = await api.post("/payments/payos/continue/", { ticket_id: ticketId });
      if (!res.data?.payment_url) {
        toast.error("Không tạo được liên kết thanh toán.");
        return;
      }
      window.location.href = res.data.payment_url;
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Không thể tiếp tục thanh toán.");
    } finally {
      setProcessing(false);
    }
  };

  const handleCancelTicket = async () => {
    if (!ticketId) return;
    setProcessing(true);
    try {
      await api.post(`/ticketing/my-tickets/${ticketId}/cancel/`);
      router.replace("/profile");
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Không thể hủy vé.");
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto max-w-2xl px-4 py-16">
        <div className="flex items-center justify-center gap-3 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Đang tải thông tin thanh toán...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-2xl px-4 py-10">
      <Card className="border-none shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-primary" />
            Thanh toán vé
          </CardTitle>
          <CardDescription>
            Vé đã được lưu vào hệ thống ở trạng thái chờ thanh toán. Hoàn tất PayOS để kích hoạt vé.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {ticket && (
            <div className="rounded-xl border bg-background p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Mã vé</span>
                <span className="font-medium">#{ticket.id.slice(0, 8)}</span>
              </div>
              <Separator className="my-3" />
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Loại vé</span>
                <span className="font-medium">{ticket.ticket_type_name}</span>
              </div>
              <Separator className="my-3" />
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Hành trình</span>
                <span className="font-medium">
                  {ticket.from_station_details?.name || "Hệ thống"} → {ticket.to_station_details?.name || "Tất cả ga"}
                </span>
              </div>
              <Separator className="my-3" />
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Số tiền</span>
                <span className="font-bold text-primary">{formattedPrice}</span>
              </div>
            </div>
          )}

          <div className="flex flex-col gap-3 sm:flex-row">
            <Button
              className="flex-1"
              onClick={handleContinuePayment}
              disabled={processing || !ticket || ticket.status !== "pending"}
            >
              {processing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Đang xử lý...
                </>
              ) : (
                "Thanh toán bằng PayOS"
              )}
            </Button>
            <Button
              variant="outline"
              className="flex-1"
              onClick={handleCancelTicket}
              disabled={processing || !ticket || ticket.status !== "pending"}
            >
              Hủy vé
            </Button>
          </div>

          <Button variant="ghost" className="w-full" onClick={() => router.push("/profile")}>
            <Ticket className="mr-2 h-4 w-4" />
            Xem lịch sử vé
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
