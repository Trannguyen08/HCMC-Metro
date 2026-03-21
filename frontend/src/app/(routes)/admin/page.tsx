"use client";

import React, { useEffect, useState } from "react";
import { 
  Users, 
  Ticket, 
  Train, 
  TrendingUp, 
  ExternalLink,
  MapPin,
  CreditCard
} from "lucide-react";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import api from "@/lib/api";

interface Stats {
  total_users: number;
  total_tickets: number;
  total_lines: number;
  total_stations: number;
  revenue_vnd: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/admin/stats/")
      .then((res: any) => setStats(res.data))
      .catch((err: any) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div>Đang tải dữ liệu...</div>;

  const statCards = [
    { label: "Người dùng", value: stats?.total_users, icon: Users, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "Vé đã bán", value: stats?.total_tickets, icon: Ticket, color: "text-green-600", bg: "bg-green-50" },
    { label: "Tuyến Metro", value: stats?.total_lines, icon: Train, color: "text-orange-600", bg: "bg-orange-50" },
    { label: "Số lượng Ga", value: stats?.total_stations, icon: MapPin, color: "text-purple-600", bg: "bg-purple-50" },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((s, i) => (
          <Card key={i} className="shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{s.label}</CardTitle>
              <div className={`${s.bg} p-2 rounded-lg`}>
                <s.icon className={`h-4 w-4 ${s.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{s.value ?? 0}</div>
              <p className="text-xs text-muted-foreground mt-1">
                <span className="text-green-600 font-medium">↑ 12%</span> so với tháng trước
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="lg:col-span-4 shadow-sm">
          <CardHeader>
            <CardTitle>Doanh thu & Lưu lượng</CardTitle>
            <CardDescription>Biểu đồ hiển thị hoạt động trong 30 ngày qua (Mock data)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[240px] flex items-end justify-between gap-2 px-2">
               {[40, 60, 45, 90, 65, 80, 50, 70, 85, 60, 95, 75].map((h, i) => (
                 <div key={i} className="bg-metro-blue/20 hover:bg-metro-blue transition-colors rounded-t w-full" style={{ height: `${h}%` }}></div>
               ))}
            </div>
            <div className="mt-4 flex items-center justify-between border-t pt-4">
               <div>
                  <div className="text-2xl font-bold text-metro-green">
                    {stats?.revenue_vnd.toLocaleString("vi-VN")} đ
                  </div>
                  <div className="text-xs text-muted-foreground">Tổng doanh thu thực tế</div>
               </div>
               <Button variant="outline" size="sm" className="gap-2">
                  <CreditCard className="h-4 w-4" /> Chi tiết giao dịch
               </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-3 shadow-sm">
           <CardHeader>
             <CardTitle>Thông báo hệ thống</CardTitle>
             <CardDescription>Các sự kiện mới nhất cần lưu ý</CardDescription>
           </CardHeader>
           <CardContent className="space-y-4">
              <div className="flex items-start gap-3 rounded-lg border p-3 bg-muted/20">
                 <div className="bg-orange-100 p-2 rounded text-orange-600">
                    <TrendingUp className="h-4 w-4" />
                 </div>
                 <div>
                    <div className="text-sm font-medium">Cao điểm sáng nay</div>
                    <div className="text-xs text-muted-foreground">Ga Bến Thành ghi nhận lượng khách tăng 25%.</div>
                 </div>
              </div>
              <div className="flex items-start gap-3 rounded-lg border p-3">
                 <div className="bg-blue-100 p-2 rounded text-blue-600">
                    <ExternalLink className="h-4 w-4" />
                 </div>
                 <div>
                    <div className="text-sm font-medium">Yêu cầu hỗ trợ mới</div>
                    <div className="text-xs text-muted-foreground">Có 3 vé cần xác minh lại trạng thái thanh toán.</div>
                 </div>
              </div>
           </CardContent>
        </Card>
      </div>
    </div>
  );
}
