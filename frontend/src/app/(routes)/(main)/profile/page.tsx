"use client";

import * as React from "react";
import Link from "next/link";
import { LogIn, UserCircle2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { authService } from "@/features/auth/services/auth-service";
import api from "@/lib/api";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2 } from "lucide-react";

export default function ProfilePage() {
  const { user, isAuthenticated, updateProfile, logout, syncSession } = useAuth();
  
  const [name, setName] = React.useState(user?.full_name ?? "");
  const [email, setEmail] = React.useState(user?.email ?? "");
  const [phone, setPhone] = React.useState(user?.phone ?? "");
  const [isUploading, setIsUploading] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    setName(user?.full_name ?? "");
    setEmail(user?.email ?? "");
    setPhone(user?.phone ?? "");
  }, [user]);

  React.useEffect(() => {
    if (isAuthenticated) {
      syncSession();
    }
  }, [isAuthenticated, syncSession]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const url = await authService.uploadAvatar(file);
      await updateProfile({ avatar_url: url });
    } catch (err) {
      console.error("Upload failed", err);
    } finally {
      setIsUploading(false);
    }
  };

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
          <Avatar className="h-14 w-14">
            <AvatarImage src={user?.avatar_url} />
            <AvatarFallback>
              <UserCircle2 className="h-7 w-7 text-muted-foreground" />
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="font-medium">{user?.full_name}</div>
            <div className="text-sm text-muted-foreground">{user?.email}</div>
          </div>
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept="image/*"
            onChange={handleFileChange}
          />
          <Button
            variant="outline"
            size="sm"
            type="button"
            disabled={isUploading}
            onClick={() => fileInputRef.current?.click()}
          >
            {isUploading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
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
              updateProfile({ full_name: name, email, phone });
            }}
          >
            Lưu thay đổi
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
