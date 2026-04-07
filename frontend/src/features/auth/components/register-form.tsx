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
  const [agree, setAgree] = React.useState(false);
  const [loading, setLoading] = React.useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!agree) return setError("Vui long dong y dieu khoan de tiep tuc.");
    if (password !== confirmPassword) return setError("Xac nhan mat khau khong khop.");

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
            <div className="text-xs text-muted-foreground">Tao tai khoan moi</div>
          </div>
        </div>
        <CardTitle className="text-center text-lg">Dang ky</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1">
              <Label>Ho ten</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nguyen Van A" />
            </div>
            <div className="space-y-1">
              <Label>So dien thoai</Label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="090..." />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1">
              <Label>Email</Label>
              <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="user@metrohcm.vn" />
            </div>
            <div className="space-y-1">
              <Label>Ngay sinh</Label>
              <Input
                type="date"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                max={new Date().toISOString().split("T")[0]}
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1">
              <Label>Mat khau</Label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="********"
              />
            </div>
            <div className="space-y-1">
              <Label>Xac nhan mat khau</Label>
              <Input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="********"
              />
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Checkbox id="agree" checked={agree} onCheckedChange={(v) => setAgree(Boolean(v))} />
            <Label htmlFor="agree" className="text-sm text-muted-foreground">
              Toi dong y voi{" "}
              <Link href="/#dieu-khoan" className="text-primary hover:underline">
                dieu khoan su dung
              </Link>
              .
            </Label>
          </div>

          {authError && <p className="text-sm text-rose-600">{authError}</p>}

          <Button className="w-full" type="submit" disabled={loading}>
            {loading ? "Dang tao tai khoan..." : "Tao tai khoan"}
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            Da co tai khoan?{" "}
            <Link href="/login" className="font-medium text-primary hover:underline">
              Dang nhap
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
