"use client";

import React from "react";
import { 
  Ticket, 
  TrendingUp, 
  Calendar,
  DollarSign,
  Download
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const MOCK_SALES = [
  { id: "T-8821", user: "Nguyễn Văn A", type: "Một chiều", price: 15000, status: "Thanh toán", date: "2024-03-21 14:30" },
  { id: "T-8822", user: "Trần Thị B", type: "Khứ hồi", price: 30000, status: "Thanh toán", date: "2024-03-21 14:45" },
  { id: "T-8823", user: "Lê Văn C", type: "Tháng", price: 200000, status: "Chờ", date: "2024-03-21 15:00" },
  { id: "T-8824", user: "Phạm Minh D", type: "Một chiều", price: 15000, status: "Thanh toán", date: "2024-03-21 15:15" },
];

export default function AdminTicketsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Quản lý Vé & Doanh thu</h1>
        <Button className="gap-2">
          <Download className="h-4 w-4" /> Xuất báo cáo
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tổng doanh thu</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">128.450.000₫</div>
            <p className="text-xs text-muted-foreground">+12% so với tháng trước</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vé đã bán</CardTitle>
            <Ticket className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2,340</div>
            <p className="text-xs text-muted-foreground">+5% so với tháng trước</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tỷ lệ tăng trưởng</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+18.2%</div>
            <p className="text-xs text-muted-foreground">Theo tứng quý</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Giao dịch hôm nay</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">156</div>
            <p className="text-xs text-muted-foreground">+24 giao dịch mới</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Giao dịch gần đây</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative w-full overflow-auto">
            <table className="w-full caption-bottom text-sm">
              <thead className="[&_tr]:border-b">
                <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground w-[100px]">Mã vé</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Khách hàng</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Loại vé</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Đơn giá</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Trạng thái</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground text-right">Ngày mua</th>
                </tr>
              </thead>
              <tbody className="[&_tr:last-child]:border-0">
                {MOCK_SALES.map((sale) => (
                  <tr key={sale.id} className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                    <td className="p-4 align-middle font-medium">{sale.id}</td>
                    <td className="p-4 align-middle">{sale.user}</td>
                    <td className="p-4 align-middle font-medium">{sale.type}</td>
                    <td className="p-4 align-middle">{sale.price.toLocaleString("vi-VN")}₫</td>
                    <td className="p-4 align-middle">
                      <Badge variant={sale.status === "Thanh toán" ? "secondary" : "outline"}>
                        {sale.status}
                      </Badge>
                    </td>
                    <td className="p-4 align-middle text-right">{sale.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
