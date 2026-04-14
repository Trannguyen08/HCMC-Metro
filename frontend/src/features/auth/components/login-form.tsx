"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import * as React from "react";
import { Chrome, TrainFront } from "lucide-react";
import { GoogleLogin } from "@react-oauth/google";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "../hooks/use-auth";
import { useAuthStore } from "@/store/use-auth-store";
import { getPostAuthRedirect } from "../lib/get-post-auth-redirect";

export function LoginForm() {
  const router = useRouter();
  const { login, loginWithGoogle, error: authError, setError } = useAuth();
  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  const [identifier, setIdentifier] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [googleLoading, setGoogleLoading] = React.useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const result = await login({ identifier, password });
      
      // Handle unverified user redirect
      if ((result as any).requires_email_verification) {
        const data = result as any;
        router.push(`/verify-email?email=${encodeURIComponent(data.email)}&token=${data.verification_token}`);
        return;
      }

      const user = result as AuthUser;
      const pendingBooking = useAuthStore.getState().pendingBooking;
      router.replace(getPostAuthRedirect(user, pendingBooking));
    } catch {
      // Error handled by store
    } finally {
      setLoading(false);
    }
  }

  const handleGoogleSuccess = async (credentialResponse: any) => {
    const credential = credentialResponse?.credential;
    if (!credential) {
      setError("Khong nhan duoc token Google. Vui long thu lai.");
      setGoogleLoading(false);
      return;
    }

    try {
      const user = await loginWithGoogle({ credential });
      const pendingBooking = useAuthStore.getState().pendingBooking;
      router.replace(getPostAuthRedirect(user, pendingBooking));
    } catch {
      // Error handled by store
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md shadow-card">
      <CardHeader className="space-y-3">
        <div className="flex items-center justify-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl metro-gradient text-white">
            <TrainFront className="h-5 w-5" />
          </div>
          <div className="text-center leading-tight">
            <div className="font-heading text-base font-extrabold">HCMC METRO</div>
            <div className="text-xs text-muted-foreground">Dang nhap he thong</div>
          </div>
        </div>
        <CardTitle className="text-center text-lg">Chao mung ban quay lai</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-1">
            <Label>Email/SDT</Label>
            <Input
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="vd: user@metrohcm.vn hoac 090..."
              autoComplete="username"
            />
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <Label>Mat khau</Label>
              <Link href="/forgot-password" className="text-xs text-muted-foreground hover:text-foreground">
                Quen mat khau?
              </Link>
            </div>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="********"
              autoComplete="current-password"
            />
          </div>

          {authError && <p className="text-sm text-rose-600">{authError}</p>}

          <Button className="w-full" type="submit" disabled={loading || googleLoading}>
            {loading ? "Dang dang nhap..." : "Dang nhap"}
          </Button>

          <div className="w-full rounded-md border p-2">
            {googleClientId ? (
              <GoogleLogin
                theme="outline"
                size="large"
                text="signin_with"
                shape="rectangular"
                width="100%"
                onSuccess={(res) => {
                  setGoogleLoading(true);
                  void handleGoogleSuccess(res);
                }}
                onError={() => {
                  setError("Dang nhap Google that bai.");
                  setGoogleLoading(false);
                }}
              />
            ) : (
              <Button className="w-full" variant="outline" type="button" disabled>
                <Chrome className="h-4 w-4" />
                Thieu NEXT_PUBLIC_GOOGLE_CLIENT_ID
              </Button>
            )}
          </div>

          <p className="text-center text-sm text-muted-foreground">
            Chua co tai khoan?{" "}
            <Link href="/register" className="font-medium text-primary hover:underline">
              Dang ky
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
