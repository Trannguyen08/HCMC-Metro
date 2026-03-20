"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import * as React from "react";
import { Chrome, TrainFront } from "lucide-react";
import { useGoogleLogin } from "@react-oauth/google";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth";
import api from "@/lib/api";

const KEYS = {
  user: "metro.user",
  access: "metro.access",
  refresh: "metro.refresh",
} as const;

export default function LoginPage() {
  const router = useRouter();
  const { login, loginWithGoogle, updateProfile } = useAuth();
  const [identifier, setIdentifier] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [googleLoading, setGoogleLoading] = React.useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const user = await login({ identifier, password });
      if (user.is_admin) {
        router.push("/admin");
      } else {
        router.push("/");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Đăng nhập thất bại.");
    } finally {
      setLoading(false);
    }
  }

  const handleGoogleSuccess = async (credentialResponse: any) => {
    try {
      const user = await loginWithGoogle(credentialResponse.access_token);
      if (user.is_admin) {
        router.push("/admin");
      } else {
        router.push("/profile");
      }
    } catch (err: any) {
      setError(err.message || "Đăng nhập Google thất bại.");
    } finally {
      setGoogleLoading(false);
    }
  };

  const onGoogleLogin = useGoogleLogin({
    onSuccess: handleGoogleSuccess,
    onError: () => {
      setError("Đăng nhập Google thất bại.");
      setGoogleLoading(false);
    },
    onNonOAuthError: () => setGoogleLoading(false),
  });

  const triggerGoogleLogin = () => {
    setError(null);
    setGoogleLoading(true);
    onGoogleLogin();
  };

  return (
    <div className="relative flex min-h-[70vh] items-center justify-center">
      <div className="pointer-events-none absolute inset-0 -z-10 opacity-60">
        <div className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-[#0055A5]/12 blur-3xl" />
        <div className="absolute -right-24 top-12 h-72 w-72 rounded-full bg-[#00A86B]/12 blur-3xl" />
      </div>

      <Card className="w-full max-w-md shadow-card">
        <CardHeader className="space-y-3">
          <div className="flex items-center justify-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl metro-gradient text-white">
              <TrainFront className="h-5 w-5" />
            </div>
            <div className="text-center leading-tight">
              <div className="font-heading text-base font-extrabold">HCMC METRO</div>
              <div className="text-xs text-muted-foreground">Đăng nhập hệ thống</div>
            </div>
          </div>
          <CardTitle className="text-center text-lg">Chào mừng bạn quay lại</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-1">
              <Label>Email/SĐT</Label>
              <Input
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="vd: user@metrohcm.vn hoặc 090..."
                autoComplete="username"
              />
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <Label>Mật khẩu</Label>
                <Link
                  href="/#faq"
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  Quên mật khẩu?
                </Link>
              </div>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
              />
            </div>

            {error && <p className="text-sm text-rose-600">{error}</p>}

            <Button className="w-full" type="submit" disabled={loading || googleLoading}>
              {loading ? "Đang đăng nhập..." : "Đăng nhập"}
            </Button>

            <Button
              className="w-full"
              variant="outline"
              type="button"
              disabled={loading || googleLoading}
              onClick={triggerGoogleLogin}
            >
              <Chrome className="h-4 w-4" />
              {googleLoading ? "Đang mở Google..." : "Đăng nhập với Google"}
            </Button>

            <p className="text-center text-sm text-muted-foreground">
              Chưa có tài khoản?{" "}
              <Link href="/register" className="font-medium text-primary hover:underline">
                Đăng ký
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
