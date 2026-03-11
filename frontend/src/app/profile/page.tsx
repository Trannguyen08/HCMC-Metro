"use client";

import Link from "next/link";
import * as React from "react";
import { useTheme } from "next-themes";
import { Bell, Globe, LogIn, QrCode, ShieldCheck, UserCircle2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/auth";
import { MOCK_TICKET_HISTORY } from "@/lib/mock-data";

function TicketStatusBadge({ status }: { status: string }) {
  const variant = status === "Thành công" ? "secondary" : status === "Đã hủy" ? "outline" : "default";
  return <Badge variant={variant as any}>{status}</Badge>;
}

export default function ProfilePage() {
  const { user, isAuthenticated, updateProfile, logout } = useAuth();
  const { theme, setTheme } = useTheme();

  const [name, setName] = React.useState(user?.name ?? "");
  const [email, setEmail] = React.useState(user?.email ?? "");
  const [phone, setPhone] = React.useState(user?.phone ?? "");
  const [saved, setSaved] = React.useState(false);

  React.useEffect(() => {
    setName(user?.name ?? "");
    setEmail(user?.email ?? "");
    setPhone(user?.phone ?? "");
  }, [user]);

  if (!isAuthenticated) {
    return (
      <div className="mx-auto max-w-2xl">
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="text-lg">Bạn chưa đăng nhập</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Vui lòng đăng nhập để xem hồ sơ, lịch sử vé và cài đặt.
            </p>
            <Button asChild>
              <Link href="/login">
                <LogIn className="h-4 w-4" />
                Đăng nhập
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div className="space-y-1">
          <h1 className="font-heading text-2xl font-bold tracking-tight">Hồ sơ</h1>
          <p className="text-sm text-muted-foreground">
            Quản lý thông tin cá nhân và vé của bạn (mock).
          </p>
        </div>
        <Button variant="outline" onClick={logout}>
          Đăng xuất
        </Button>
      </div>

      <Tabs defaultValue="profile">
        <TabsList className="w-full justify-start">
          <TabsTrigger value="profile">Thông tin cá nhân</TabsTrigger>
          <TabsTrigger value="history">Lịch sử vé</TabsTrigger>
          <TabsTrigger value="active">Vé đang dùng</TabsTrigger>
          <TabsTrigger value="settings">Cài đặt</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <Card className="shadow-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Thông tin cá nhân</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3 rounded-xl border bg-background p-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                  <UserCircle2 className="h-7 w-7 text-muted-foreground" />
                </div>
                <div className="flex-1">
                  <div className="font-medium">{user?.name}</div>
                  <div className="text-sm text-muted-foreground">{user?.email}</div>
                </div>
                <Button variant="outline" size="sm" type="button" onClick={() => alert("Upload avatar (mock).")}>
                  Tải ảnh
                </Button>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-1 md:col-span-1">
                  <Label>Họ tên</Label>
                  <Input value={name} onChange={(e) => setName(e.target.value)} />
                </div>
                <div className="space-y-1 md:col-span-1">
                  <Label>Email</Label>
                  <Input value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
                <div className="space-y-1 md:col-span-1">
                  <Label>Số điện thoại</Label>
                  <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Button
                  type="button"
                  onClick={() => {
                    updateProfile({ name, email, phone });
                    setSaved(true);
                    window.setTimeout(() => setSaved(false), 1200);
                  }}
                >
                  Lưu thay đổi
                </Button>
                {saved && <span className="text-sm text-metro-green">Đã lưu</span>}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <Card className="shadow-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Lịch sử vé</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto rounded-xl border">
                <table className="w-full text-sm">
                  <thead className="bg-muted/60 text-left text-muted-foreground">
                    <tr>
                      <th className="px-4 py-3 font-medium">Mã vé</th>
                      <th className="px-4 py-3 font-medium">Lộ trình</th>
                      <th className="px-4 py-3 font-medium">Ngày</th>
                      <th className="px-4 py-3 font-medium">Loại vé</th>
                      <th className="px-4 py-3 font-medium">Giá</th>
                      <th className="px-4 py-3 font-medium">Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody>
                    {MOCK_TICKET_HISTORY.map((t) => (
                      <tr key={t.id} className="border-t">
                        <td className="px-4 py-3 font-medium">{t.id}</td>
                        <td className="px-4 py-3">{t.route}</td>
                        <td className="px-4 py-3">{t.date}</td>
                        <td className="px-4 py-3">{t.type}</td>
                        <td className="px-4 py-3">{t.priceVnd.toLocaleString("vi-VN")}đ</td>
                        <td className="px-4 py-3">
                          <TicketStatusBadge status={t.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="active">
          <div className="grid gap-4 lg:grid-cols-2">
            {[1, 2].map((n) => (
              <Card key={n} className="card-hover shadow-card">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Vé đang dùng #{n}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="rounded-xl border bg-background p-4 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Loại vé</span>
                      <span className="font-medium">Một chiều</span>
                    </div>
                    <Separator className="my-3" />
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Hiệu lực</span>
                      <span className="font-medium">Trong ngày</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between rounded-xl border bg-muted/40 p-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm font-medium">
                        <QrCode className="h-4 w-4 text-metro-blue" />
                        QR Code (placeholder)
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Xuất trình tại cổng soát vé
                      </div>
                    </div>
                    <div className="h-16 w-16 rounded-lg border bg-background" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="settings">
          <Card className="shadow-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Cài đặt</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-start justify-between gap-4 rounded-xl border bg-background p-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 font-medium">
                    <Bell className="h-4 w-4 text-metro-green" />
                    Thông báo
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Nhận thông báo về chuyến đi, ưu đãi và tin tức.
                  </div>
                </div>
                <Button variant="outline" size="sm" type="button" onClick={() => alert("Đã bật/tắt (mock).")}>
                  Bật/Tắt
                </Button>
              </div>

              <div className="flex items-start justify-between gap-4 rounded-xl border bg-background p-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 font-medium">
                    <Globe className="h-4 w-4 text-metro-blue" />
                    Ngôn ngữ
                  </div>
                  <div className="text-sm text-muted-foreground">Chọn ngôn ngữ hiển thị.</div>
                </div>
                <div className="w-44">
                  <Select defaultValue="vi">
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn ngôn ngữ" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="vi">Việt Nam</SelectItem>
                      <SelectItem value="en">English</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-start justify-between gap-4 rounded-xl border bg-background p-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 font-medium">
                    <ShieldCheck className="h-4 w-4 text-metro-green" />
                    Giao diện
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Chuyển chế độ sáng/tối theo hệ thống hoặc thủ công.
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant={theme === "light" ? "default" : "outline"}
                    size="sm"
                    type="button"
                    onClick={() => setTheme("light")}
                  >
                    Sáng
                  </Button>
                  <Button
                    variant={theme === "dark" ? "default" : "outline"}
                    size="sm"
                    type="button"
                    onClick={() => setTheme("dark")}
                  >
                    Tối
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

