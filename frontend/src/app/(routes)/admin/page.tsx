"use client";

import React, { useEffect, useState } from "react";

import { 
  Users, 
  Ticket, 
  Train, 
  TrendingUp, 
  MapPin,
  CreditCard,
  DollarSign,
  ArrowRight
} from "lucide-react";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  BarChart,
  Bar
} from "recharts";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import api from "@/lib/api";
import { StatCard } from "@/components/admin/StatCard";
import { cn } from "@/lib/utils";

interface Stats {
  total_users: number;
  total_tickets: number;
  total_lines: number;
  total_stations: number;
  revenue_vnd: number;
  usage_rate: number;
  transactions_24h: number;
  daily_revenue: { date: string; revenue: number }[];
  ticket_type_stats: { name: string; value: number }[];
  recent_bookings: {
    id: string;
    user_name: string;
    ticket_type: string;
    price: number;
    status: string;
    created_at: string;
  }[];
  top_buyers: {
    name: string;
    email: string;
    count: number;
    spent: number;
  }[];
  top_travellers: {
    name: string;
    email: string;
    count: number;
  }[];
}

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8"];

const getStatusLabel = (status: string) => {
  switch (status) {
    case "active": return "Hoạt động";
    case "used": return "Đã sử dụng";
    case "expired": return "Hết hạn";
    case "cancelled": return "Đã hủy";
    case "pending": return "Chờ xử lý";
    default: return status;
  }
};

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/admin/stats/")
      .then((res: any) => setStats(res.data))
      .catch((err: any) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="text-sm text-muted-foreground">Đang tải dữ liệu hệ thống...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard 
          label="Tỷ lệ sử dụng" 
          value={stats ? `${stats.usage_rate}%` : "-"} 
          icon={TrendingUp} 
          color="text-emerald-600" 
          bg="bg-emerald-50"
          description="Cập nhật theo dữ liệu quét"
        />
        <StatCard 
          label="Giao dịch 24h" 
          value={stats?.transactions_24h ?? "-"} 
          icon={TrendingUp} 
          color="text-blue-600" 
          bg="bg-blue-50"
          description="Đơn hàng trong 24h qua"
        />
        <StatCard 
          label="Tuyến Metro" 
          value={stats?.total_lines} 
          icon={Train} 
          color="text-orange-600" 
          bg="bg-orange-50"
          description="Tuyến đang hoạt động"
        />
        <StatCard 
          label="Doanh thu" 
          value={`${stats?.revenue_vnd.toLocaleString("vi-VN")} đ`} 
          icon={DollarSign} 
          color="text-purple-600" 
          bg="bg-purple-50"
          description="Tổng thu từ bán vé"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-7">
        <Card className="lg:col-span-4 border-none shadow-sm">
          <CardHeader>
            <CardTitle>Xu hướng doanh thu</CardTitle>
            <CardDescription>Doanh thu 30 ngày gần nhất (VND)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats?.daily_revenue}>
                  <defs>
                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0f4c81" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#0f4c81" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="date" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 12, fill: "#888" }}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 12, fill: "#888" }}
                    tickFormatter={(value) => `${(value / 1000).toLocaleString()}k`}
                  />
                  <Tooltip 
                    formatter={(value: number) => [value.toLocaleString("vi-VN") + " đ", "Doanh thu"]}
                    contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="#0f4c81" 
                    strokeWidth={2}
                    fillOpacity={1} 
                    fill="url(#colorRev)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-3 border-none shadow-sm flex flex-col">
          <CardHeader>
            <CardTitle>Cơ cấu loại vé</CardTitle>
            <CardDescription>Phân bổ theo số lượng đã bán</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 space-y-4">
            <div className="h-[180px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats?.ticket_type_stats}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={65}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {stats?.ticket_type_stats.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            </div>
            
            <div className="h-[180px] w-full pt-4 border-t border-slate-100">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold mb-2">So sánh số lượng</div>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats?.ticket_type_stats}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 10, fill: "#888" }}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 10, fill: "#888" }}
                  />
                  <Tooltip 
                    cursor={{fill: 'transparent'}}
                    contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}
                  />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    {stats?.ticket_type_stats.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-none shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Giao dịch gần đây</CardTitle>
            <CardDescription>10 đơn hàng mới nhất trên hệ thống</CardDescription>
          </div>
          <Button variant="outline" size="sm" className="gap-2" asChild>
            <a href="/admin/tickets">
              Xem tất cả <ArrowRight className="h-4 w-4" />
            </a>
          </Button>
        </CardHeader>
        <CardContent>
          <div className="rounded-xl border border-slate-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50/80 border-b text-muted-foreground font-medium uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="px-4 py-3">Mã vé</th>
                    <th className="px-4 py-3">Khách hàng</th>
                    <th className="px-4 py-3">Loại vé</th>
                    <th className="px-4 py-3">Số tiền</th>
                    <th className="px-4 py-3">Trạng thái</th>
                    <th className="px-4 py-3">Thời gian</th>
                  </tr>
                </thead>
                <tbody className="divide-y font-medium">
                  {stats?.recent_bookings.map((b) => (
                    <tr key={b.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 font-mono text-xs">#{b.id.slice(0, 8)}</td>
                      <td className="px-4 py-3">{b.user_name}</td>
                      <td className="px-4 py-3">{b.ticket_type}</td>
                      <td className="px-4 py-3 font-bold">{b.price.toLocaleString("vi-VN")} đ</td>
                      <td className="px-4 py-3">
                        <div className={cn(
                          "inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase border",
                          b.status === "active" ? "bg-emerald-100 text-emerald-700 border-emerald-200" :
                          b.status === "pending" ? "bg-amber-100 text-amber-700 border-amber-200" :
                          b.status === "expired" ? "bg-rose-100 text-rose-700 border-rose-200" :
                          b.status === "used" ? "bg-blue-100 text-blue-700 border-blue-200" :
                          b.status === "cancelled" ? "bg-slate-200 text-slate-700 border-slate-300" :
                          "bg-slate-100 text-slate-600 border-slate-200"
                        )}>
                          {getStatusLabel(b.status)}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">
                        {format(new Date(b.created_at), "HH:mm dd/MM", { locale: vi })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-none shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Top khách hàng mua vé (Tuần)</CardTitle>
            <CardDescription>Khách hàng mua nhiều vé nhất trong 7 ngày qua</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-xl border border-slate-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-slate-50/80 border-b text-muted-foreground font-medium uppercase text-[10px] tracking-wider">
                    <tr>
                      <th className="px-4 py-3">Khách hàng</th>
                      <th className="px-4 py-3 text-center">Số vé</th>
                      <th className="px-4 py-3 text-right">Tổng chi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {stats?.top_buyers.map((u, i) => (
                      <tr key={i} className="hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3">
                          <div className="font-bold">{u.name}</div>
                          <div className="text-[10px] text-muted-foreground">{u.email}</div>
                        </td>
                        <td className="px-4 py-3 text-center font-bold text-primary">{u.count}</td>
                        <td className="px-4 py-3 text-right font-mono">{u.spent.toLocaleString("vi-VN")} đ</td>
                      </tr>
                    ))}
                    {(!stats?.top_buyers || stats.top_buyers.length === 0) && (
                      <tr>
                        <td colSpan={3} className="px-4 py-10 text-center text-muted-foreground">Chưa có dữ liệu tuần này</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Top khách hàng sử dụng (Tuần)</CardTitle>
            <CardDescription>Khách hàng quét vé tại ga nhiều nhất trong 7 ngày qua</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-xl border border-slate-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-slate-50/80 border-b text-muted-foreground font-medium uppercase text-[10px] tracking-wider">
                    <tr>
                      <th className="px-4 py-3">Khách hàng</th>
                      <th className="px-4 py-3 text-center">Số lượt quét</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {stats?.top_travellers.map((u, i) => (
                      <tr key={i} className="hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3">
                          <div className="font-bold">{u.name}</div>
                          <div className="text-[10px] text-muted-foreground">{u.email}</div>
                        </td>
                        <td className="px-4 py-3 text-center font-bold text-emerald-600">{u.count}</td>
                      </tr>
                    ))}
                    {(!stats?.top_travellers || stats.top_travellers.length === 0) && (
                      <tr>
                        <td colSpan={2} className="px-4 py-10 text-center text-muted-foreground">Chưa có dữ liệu tuần này</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
