"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import * as React from "react";
import { TrainFront } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "../hooks/use-auth";

export function RegisterForm() {
  const router = useRouter();
  const { register, error: authError, setError } = useAuth();

  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [birthDate, setBirthDate] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const maxBirthDate = React.useMemo(() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() - 12);
    return d.toISOString().split("T")[0];
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!birthDate) return setError("Vui lòng chọn ngày sinh.");
    if (birthDate > maxBirthDate) return setError("Bạn phải từ 12 tuổi trở lên để đăng ký.");
    if (password !== confirmPassword) return setError("Xác nhận mật khẩu không khớp.");

    setLoading(true);
    try {
      const res = await register({
        full_name: name,
        email,
        phone,
        date_of_birth: birthDate || null,
        password,
      });
      if (typeof window !== "undefined") {
        sessionStorage.setItem("metro.pendingEmail", res.email);
        sessionStorage.setItem("metro.pendingVerificationToken", res.verification_token);
      }
      router.push("/verify-email");
    } catch {
      // Error handled by store
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="w-full max-w-lg shadow-card">
      <CardHeader className="space-y-3">
        <div className="flex items-center justify-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl metro-gradient text-white">
            <TrainFront className="h-5 w-5" />
          </div>
          <div className="text-center leading-tight">
            <div className="font-heading text-base font-extrabold">HCMC METRO</div>
            <div className="text-xs text-muted-foreground">Tạo tài khoản mới</div>
          </div>
        </div>
        <CardTitle className="text-center text-lg">Đăng ký</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1">
              <Label>Họ tên</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nguyễn Văn A" required />
            </div>
            <div className="space-y-1">
              <Label>Số điện thoại</Label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="090..." required />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-[minmax(0,1.6fr)_180px]">
            <div className="space-y-1">
              <Label>Email</Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="user@metrohcm.vn"
                required
              />
            </div>
            <div className="space-y-1">
              <Label>Ngày sinh</Label>
              <Input
                type="date"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                max={maxBirthDate}
                required
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1">
              <Label>Mật khẩu</Label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="********"
                required
              />
            </div>
            <div className="space-y-1">
              <Label>Xác nhận mật khẩu</Label>
              <Input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="********"
                required
              />
            </div>
          </div>

          {authError && <p className="text-sm text-rose-600">{authError}</p>}

          <Button className="w-full" type="submit" disabled={loading}>
            {loading ? "Đang tạo tài khoản..." : "Tạo tài khoản"}
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            Đã có tài khoản?{" "}
            <Link href="/login" className="font-medium text-primary hover:underline">
              Đăng nhập
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
