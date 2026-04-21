"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TrainFront, Eye, EyeOff, Loader2, ArrowLeft, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import api from "@/lib/api";
import { useAuthStore } from "@/store/use-auth-store";
import { AuthUser } from "@/features/auth/types";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [email, setEmail] = useState("");
  const [token, setToken] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [otpVerified, setOtpVerified] = useState(false);

  // Timer state (3 minutes = 180s)
  const [timeLeft, setTimeLeft] = useState(180);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (step === 2 && timeLeft > 0) {
      timer = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [step, timeLeft]);

  const handleSendOTP = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!email) {
      setError("Vui lòng nhập email.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await api.post("/auth/forgot-password/", { email });
      setToken(res.data.verification_token);
      setStep(2);
      setTimeLeft(180);
      setOtpVerified(false);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Email không tìm thấy trong hệ thống.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyAndReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp || newPassword.length < 6) {
      setError("Vui lòng điền đủ mã OTP và mật khẩu ít nhất 6 ký tự.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Mật khẩu nhập lại không khớp.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await api.post("/auth/forgot-password/verify/", {
        verification_token: token,
        otp,
        new_password: newPassword
      });
      // Store tokens
      localStorage.setItem("metro.access", res.data.access);
      localStorage.setItem("metro.refresh", res.data.refresh);
      // Auto Login
      useAuthStore.getState().setUser(res.data.user as AuthUser);
      router.replace("/");
    } catch (err: any) {
      setError(err.response?.data?.detail || "OTP không hợp lệ hoặc đã hết hạn.");
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const min = Math.floor(seconds / 60);
    const sec = seconds % 60;
    return `${min}:${sec.toString().padStart(2, "0")}`;
  };

  return (
    <div className="relative flex min-h-[70vh] items-center justify-center py-10">
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
              <div className="text-xs text-muted-foreground">Khôi phục mật khẩu</div>
            </div>
          </div>
          <CardTitle className="text-center text-lg">
            {step === 1 && "Nhập email của bạn"}
            {step === 2 && "Nhập mã xác nhận (OTP)"}
            {step === 3 && "Đặt mật khẩu mới"}
          </CardTitle>
          <CardDescription className="text-center">
            {step === 1 && "Chúng tôi sẽ gửi một mã OTP 6 số đến email của bạn."}
            {step === 2 && `Mã OTP đã được gửi đến ${email}`}
            {step === 3 && "Vui lòng nhập và ghi nhớ mật khẩu mới."}
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          {error && <div className="mb-4 text-sm text-rose-600 bg-rose-50 p-2 rounded">{error}</div>}

          {step === 1 && (
            <form onSubmit={handleSendOTP} className="space-y-4">
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nhap@email.com"
                  autoFocus
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Gửi mã xác nhận
              </Button>
            </form>
          )}

          {(step === 2 || step === 3) && (
            <form onSubmit={handleVerifyAndReset} className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label>Mã OTP (6 chữ số)</Label>
                  {step === 2 && (
                    <span className="text-xs text-rose-600 font-medium">Hết hạn sau: {formatTime(timeLeft)}</span>
                  )}
                </div>
                <Input
                  value={otp}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, "");
                    setOtp(value);
                    if (value.length === 6) {
                      setStep(3);
                      setOtpVerified(true);
                    } else {
                      setOtpVerified(false);
                    }
                  }}
                  maxLength={6}
                  placeholder="------"
                  className="text-center tracking-widest font-bold text-lg"
                  autoFocus
                />
                {otpVerified && (
                  <div className="flex items-center justify-center gap-1.5 mt-1 text-xs font-medium text-emerald-600 animate-in fade-in slide-in-from-top-1">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span>Mã OTP hợp lệ</span>
                  </div>
                )}
              </div>

              {step === 3 && (
                <>
                  <div className="space-y-2">
                    <Label>Mật khẩu mới</Label>
                    <div className="relative">
                      <Input
                        type={showPassword ? "text" : "password"}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Ít nhất 6 ký tự"
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Nhập lại mật khẩu</Label>
                    <div className="relative">
                      <Input
                        type={showConfirmPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Nhập lại mật khẩu mới"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                </>
              )}

              {step === 3 ? (
                <Button type="submit" className="w-full" disabled={loading || newPassword.length < 6}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Xác nhận & Đăng nhập
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  disabled={timeLeft > 0 || loading}
                  onClick={() => handleSendOTP()}
                >
                  Gửi lại mã mới {timeLeft > 0 ? `(${timeLeft}s)` : ""}
                </Button>
              )}
            </form>
          )}

          <div className="mt-6 text-center">
            <Link href="/login" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary">
              <ArrowLeft className="mr-2 h-4 w-4" /> Quay lại đăng nhập
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
