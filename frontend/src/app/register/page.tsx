"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import * as React from "react";
import { TrainFront } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth";

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();

  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [agree, setAgree] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!agree) return setError("Vui lòng đồng ý điều khoản để tiếp tục.");
    if (password !== confirmPassword) return setError("Xác nhận mật khẩu không khớp.");

    setLoading(true);
    try {
      await register({ name, email, phone, password });
      router.push("/profile");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Đăng ký thất bại.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative flex min-h-[75vh] items-center justify-center">
      <div className="pointer-events-none absolute inset-0 -z-10 opacity-60">
        <div className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-[#0055A5]/12 blur-3xl" />
        <div className="absolute -right-24 top-12 h-72 w-72 rounded-full bg-[#00A86B]/12 blur-3xl" />
      </div>

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
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nguyễn Văn A" />
              </div>
              <div className="space-y-1">
                <Label>Số điện thoại</Label>
                <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="090..." />
              </div>
            </div>

            <div className="space-y-1">
              <Label>Email</Label>
              <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="user@metrohcm.vn" />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1">
                <Label>Mật khẩu</Label>
                <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
              </div>
              <div className="space-y-1">
                <Label>Xác nhận mật khẩu</Label>
                <Input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="••••••••" />
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Checkbox id="agree" checked={agree} onCheckedChange={(v) => setAgree(Boolean(v))} />
              <Label htmlFor="agree" className="text-sm text-muted-foreground">
                Tôi đồng ý với <Link href="/#dieu-khoan" className="text-primary hover:underline">điều khoản sử dụng</Link>.
              </Label>
            </div>

            {error && <p className="text-sm text-rose-600">{error}</p>}

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
    </div>
  );
}

