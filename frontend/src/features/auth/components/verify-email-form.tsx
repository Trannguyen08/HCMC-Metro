"use client";

import { useRouter } from "next/navigation";
import * as React from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "../hooks/use-auth";
import { getPostAuthRedirect } from "../lib/get-post-auth-redirect";

export function VerifyEmailForm() {
  const router = useRouter();
  const { verifyEmailOtp, error: authError, setError } = useAuth();

  const [email, setEmail] = React.useState<string>("");
  const [token, setToken] = React.useState<string>("");
  const [otp, setOtp] = React.useState<string>("");
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    
    // Check URL search params first (for login redirect case)
    const searchParams = new URLSearchParams(window.location.search);
    const queryEmail = searchParams.get("email");
    const queryToken = searchParams.get("token");

    const storedEmail = queryEmail || sessionStorage.getItem("metro.pendingEmail") || "";
    const storedToken = queryToken || sessionStorage.getItem("metro.pendingVerificationToken") || "";
    
    setEmail(storedEmail);
    setToken(storedToken);
    
    if (!storedEmail || !storedToken) {
      router.replace("/register");
    }
  }, [router]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!otp.trim()) {
      setError("Vui lòng nhập mã OTP.");
      return;
    }
    if (!token) {
      setError("Thiếu thông tin xác thực. Vui lòng đăng ký lại.");
      return;
    }
    setLoading(true);
    try {
      const user = await verifyEmailOtp({ verification_token: token, otp });
      if (typeof window !== "undefined") {
        sessionStorage.removeItem("metro.pendingEmail");
        sessionStorage.removeItem("metro.pendingVerificationToken");
      }
      router.replace(getPostAuthRedirect(user));
    } catch (err: any) {
      // Error handled by store
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="w-full max-w-md shadow-card">
      <CardHeader>
        <CardTitle className="text-center text-lg">Xác thực email</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Mã OTP đã được gửi tới email
            {email ? <span className="font-medium"> {email}</span> : " của bạn"}.
            Vui lòng nhập mã trong email để hoàn tất đăng ký.
          </p>

          <div className="space-y-1">
            <Label htmlFor="otp">Mã OTP</Label>
            <Input
              id="otp"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              placeholder="Nhập 6 số OTP"
              inputMode="numeric"
              maxLength={6}
            />
          </div>



          <Button className="w-full" type="submit" disabled={loading}>
            {loading ? "Đang xác thực..." : "Xác thực email"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
