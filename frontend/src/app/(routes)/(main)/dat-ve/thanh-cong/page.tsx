"use client";

import React, { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { 
  CheckCircle2, 
  Download, 
  Share2, 
  Home, 
  Ticket, 
  MapPin, 
  Calendar,
  Loader2,
  ArrowRight,
  Info
} from "lucide-react";

import axios from "axios";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

export default function BookingSuccessPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const ticketId = searchParams.get("id");
  
  const [ticket, setTicket] = useState<any>(null);
  const [qrBase64, setQrBase64] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!ticketId) return;

    const fetchTicket = async () => {
      try {
        const token = localStorage.getItem("metro.access");
        const [ticketRes, qrRes] = await Promise.all([
          axios.get(`${API_BASE}/ticketing/my-tickets/${ticketId}/`, {
            headers: { Authorization: `Bearer ${token}` }
          }),
          axios.get(`${API_BASE}/ticketing/my-tickets/${ticketId}/qr/`, {
            headers: { Authorization: `Bearer ${token}` }
          })
        ]);
        
        setTicket(ticketRes.data);
        setQrBase64(qrRes.data.qr_base64);
      } catch (err) {
        console.error("Failed to fetch ticket info", err);
      } finally {
        setLoading(false);
      }
    };

    fetchTicket();
  }, [ticketId]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-muted-foreground animate-pulse">Đang tải thông tin vé...</p>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="container mx-auto py-12 px-4 max-w-lg text-center space-y-6">
        <div className="h-20 w-20 rounded-full bg-rose-100 flex items-center justify-center mx-auto text-rose-600">
          <Ticket className="h-10 w-10" />
        </div>
        <h2 className="text-2xl font-bold">Không tìm thấy vé</h2>
        <p className="text-muted-foreground">Có lỗi xảy ra hoặc vé này không thuộc về tài khoản của bạn.</p>
        <Button onClick={() => router.push("/dat-ve")}>Quay lại đặt vé</Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-12 px-4 max-w-4xl animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col items-center gap-6 mb-12 text-center">
        <div className="h-20 w-20 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 shadow-sm border-4 border-white">
          <CheckCircle2 className="h-10 w-10" />
        </div>
        <div className="space-y-2">
          <h1 className="text-4xl font-extrabold font-heading tracking-tight">Đặt vé thành công!</h1>
          <p className="text-muted-foreground">
            Thông tin vé đã được gửi về email của bạn. Hãy quét mã QR này tại ga khi đi tàu.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
        {/* Visual Ticket */}
        <div className="relative">
          <div className="absolute -top-3 -right-3 rotate-12 z-10">
            <Badge className="h-12 w-12 rounded-full flex items-center justify-center bg-primary text-white text-xs border-4 border-background shadow-lg">
              Official
            </Badge>
          </div>
          
          <Card className="border-none shadow-2xl overflow-hidden rounded-3xl bg-white text-slate-900">
            <div className="bg-primary p-6 text-white flex justify-between items-center">
              <div>
                <div className="text-xs opacity-80 font-bold uppercase tracking-widest">HCMC Metro Line 1</div>
                <div className="text-xl font-black">{ticket.ticket_type_name}</div>
              </div>
              <Ticket className="h-8 w-8 opacity-40" />
            </div>
            
            <CardContent className="p-8 space-y-8">
              <div className="flex justify-between items-center bg-slate-50 p-4 rounded-2xl border border-dashed border-slate-200">
                <div className="text-center flex-1">
                  <div className="text-[10px] text-slate-400 font-bold uppercase">Ga đi</div>
                  <div className="font-extrabold text-lg">{ticket.from_station_details?.name || "-"}</div>
                  <div className="text-xs text-primary font-mono">{ticket.from_station_details?.code || ""}</div>
                </div>
                
                <div className="flex-shrink-0 px-4 text-primary opacity-30">
                  <ArrowRight className="h-6 w-6" />
                </div>
                
                <div className="text-center flex-1">
                  <div className="text-[10px] text-slate-400 font-bold uppercase">Ga đến</div>
                  <div className="font-extrabold text-lg">{ticket.to_station_details?.name || "-"}</div>
                  <div className="text-xs text-primary font-mono">{ticket.to_station_details?.code || ""}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <div className="text-[10px] text-slate-400 font-bold uppercase flex items-center gap-1">
                    <Calendar className="h-3 w-3" /> Ngày hiệu lực
                  </div>
                  <div className="font-bold text-sm">{ticket.valid_from}</div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] text-slate-400 font-bold uppercase flex items-center gap-1 justify-end">
                    Hạn dùng <Loader2 className="h-3 w-3 opacity-0" />
                  </div>
                  <div className="font-bold text-sm">{ticket.valid_until}</div>
                </div>
              </div>

              <div className="relative">
                <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 border-t-2 border-dashed border-slate-200 z-0"></div>
                <div className="relative z-10 bg-white px-4 mx-auto w-fit">
                   <div className="h-8 w-8 rounded-full border-2 border-slate-200 bg-slate-50 flex items-center justify-center text-slate-400">
                     <CheckCircle2 className="h-4 w-4" />
                   </div>
                </div>
              </div>

              <div className="flex flex-col items-center gap-4">
                 <div className="p-4 bg-white border-2 border-slate-100 rounded-2xl shadow-inner">
                    {qrBase64 ? (
                       <img src={`data:image/png;base64,${qrBase64}`} alt="Ticket QR" className="w-48 h-48" />
                    ) : (
                       <div className="w-48 h-48 bg-slate-100 animate-pulse rounded-lg flex items-center justify-center">
                         <Ticket className="h-10 w-10 text-slate-300" />
                       </div>
                    )}
                 </div>
                 <div className="text-[10px] font-mono text-slate-400 bg-slate-50 px-3 py-1 rounded-full border border-slate-100">
                   ID: {ticket.id}
                 </div>
              </div>
            </CardContent>
            
            <div className="bg-slate-50 border-t border-slate-100 p-6 flex justify-between items-center text-xs font-bold text-slate-400 uppercase tracking-widest">
               <span>Passenger copy</span>
               <div className="flex gap-1">
                 {[1,2,3,4,5,6].map(i => <div key={i} className="h-2 w-1 bg-slate-300 rounded-full"></div>)}
               </div>
            </div>
          </Card>
        </div>

        {/* Info & Actions */}
        <div className="space-y-6 pt-6 md:pt-0">
          <div className="space-y-4">
            <h3 className="text-xl font-bold flex items-center gap-2">
              <Info className="h-5 w-5 text-primary" />
              Hướng dẫn sử dụng
            </h3>
            <ul className="space-y-4">
              {[
                "Xuất trình mã QR tại cổng kiểm soát vé thông minh.",
                "Mỗi mã QR chỉ có hiệu lực cho 1 lượt quét vào và 1 lượt quét ra.",
                "Không chia sẻ mã QR này với người lạ.",
                "Có thể xem lại vé bất cứ lúc nào trong Lịch sử đặt vé."
              ].map((step, i) => (
                <li key={i} className="flex gap-3 text-muted-foreground text-sm">
                  <div className="flex-shrink-0 h-5 w-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold">
                    {i+1}
                  </div>
                  {step}
                </li>
              ))}
            </ul>
          </div>

          <Separator />

          <div className="grid grid-cols-2 gap-3">
             <Button className="font-bold gap-2" variant="outline">
                <Download className="h-4 w-4" /> Tải về
             </Button>
             <Button className="font-bold gap-2" variant="outline">
                <Share2 className="h-4 w-4" /> Chia sẻ
             </Button>
          </div>

          <div className="space-y-3">
             <Button className="w-full font-bold h-12 gap-2" size="lg" onClick={() => router.push('/')}>
                <Home className="h-5 w-5" /> Về trang chủ
             </Button>
             <Button className="w-full font-bold h-10 gap-2" variant="ghost" onClick={() => router.push('/dat-ve')}>
                <ArrowRight className="h-4 w-4" /> Đặt thêm vé khác
             </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
