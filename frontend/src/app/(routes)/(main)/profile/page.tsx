"use client";

import * as React from "react";
import Link from "next/link";
import { LogIn, UserCircle2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/features/auth/hooks/use-auth";
import api from "@/lib/api";

export default function ProfilePage() {
  const { user, isAuthenticated, updateProfile, logout } = useAuth();

  const [name, setName] = React.useState(user?.full_name ?? "");
  const [email, setEmail] = React.useState(user?.email ?? "");
  const [phone, setPhone] = React.useState(user?.phone ?? "");
  const [saved, setSaved] = React.useState(false);

  React.useEffect(() => {
    setName(user?.full_name ?? "");
    setEmail(user?.email ?? "");
    setPhone(user?.phone ?? "");
  }, [user]);

  const loadProfile = React.useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const meRes = await api.get("/auth/me/");
      const me = meRes.data;
      updateProfile({
        full_name: me.full_name,
        email: me.email,
        phone: me.phone,
        date_of_birth: me.date_of_birth,
        avatar_url: me.avatar_url,
        email_verified: me.email_verified,
        is_admin: me.is_admin,
      });
    } catch (err: any) {
      if (err?.response?.status === 401) {
        await logout();
      }
      console.error("Failed to load profile", err);
    }
  }, [isAuthenticated, updateProfile, logout]);

  React.useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  if (!isAuthenticated) {
    return (
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="text-lg">Chưa đăng nhập</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">Vui lòng đăng nhập để xem thông tin hồ sơ và quản lý vé của bạn.</p>
          <Button asChild>
            <Link href="/login">
              <LogIn className="h-4 w-4" />
              Đăng nhập
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
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
            <div className="font-medium">{user?.full_name}</div>
            <div className="text-sm text-muted-foreground">{user?.email}</div>
          </div>
          <Button variant="outline" size="sm" type="button" onClick={() => alert("Upload avatar (mock).")}>Tải ảnh</Button>
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
              updateProfile({ full_name: name, email, phone });
              setSaved(true);
              window.setTimeout(() => setSaved(false), 1200);
            }}
          >
            Lưu thay đổi
          </Button>
          {saved && <span className="text-sm text-metro-green">Đã lưu!</span>}
        </div>
      </CardContent>
    </Card>
  );
}
