"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import api from "@/lib/api";

export default function PaymentReturnPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState<boolean | null>(null);
  const [message, setMessage] = useState("Dang xac thuc thanh toan...");

  const payload = useMemo(() => Object.fromEntries(searchParams.entries()), [searchParams]);

  useEffect(() => {
    const verify = async () => {
      if (!payload.orderCode) {
        setSuccess(false);
        setMessage("Du lieu tra ve tu PayOS khong hop le.");
        setLoading(false);
        return;
      }

      try {
        const res = await api.post("/payments/payos/verify-return/", payload);
        if (res.data?.success && res.data?.ticket_id) {
          setSuccess(true);
          setMessage("Thanh toan thanh cong, dang chuyen sang trang ve...");
          setTimeout(() => {
            router.replace(`/dat-ve/thanh-cong?id=${res.data.ticket_id}`);
          }, 800);
          return;
        }

        setSuccess(false);
        setMessage(res.data?.detail || "Thanh toan chua thanh cong.");
      } catch (err: any) {
        setSuccess(false);
        setMessage(err.response?.data?.detail || "Khong the xac thuc thanh toan. Vui long thu lai.");
      } finally {
        setLoading(false);
      }
    };

    verify();
  }, [payload, router]);

  return (
    <div className="container mx-auto max-w-xl px-4 py-16">
      <Card className="border-none shadow-lg">
        <CardHeader>
          <CardTitle>Ket qua thanh toan</CardTitle>
          <CardDescription>He thong dang dong bo trang thai giao dich PayOS.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div
            className={`flex items-center gap-3 rounded-lg p-4 ${
              success === true
                ? "bg-emerald-50 text-emerald-700"
                : success === false
                  ? "bg-rose-50 text-rose-700"
                  : "bg-slate-50 text-slate-700"
            }`}
          >
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : success ? (
              <CheckCircle2 className="h-5 w-5" />
            ) : (
              <AlertCircle className="h-5 w-5" />
            )}
            <span>{message}</span>
          </div>

          {!loading && success === false && (
            <div className="flex gap-3">
              <Button onClick={() => router.push("/dat-ve")} className="flex-1">
                Quay lai dat ve
              </Button>
              <Button variant="outline" onClick={() => router.push("/")} className="flex-1">
                Ve trang chu
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
