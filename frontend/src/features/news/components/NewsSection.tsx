"use client";

import * as React from "react";
import Link from "next/link";
import { format } from "date-fns";
import { ArrowRight, CalendarDays, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { newsService } from "../services/news-service";
import { News } from "../types";

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1473445361085-b9a07f55608b?auto=format&fit=crop&q=80&w=1200";

export function NewsSection() {
  const [news, setNews] = React.useState<News[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    setLoading(true);
    newsService
      .getNews({ limit: 4 })
      .then(setNews)
      .catch((err) => console.error("Failed to fetch news:", err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <section
      id="tin-tuc"
      className="relative overflow-hidden rounded-[28px] border border-[#0055A5]/10 bg-[linear-gradient(180deg,rgba(0,85,165,0.08)_0%,rgba(255,255,255,0.95)_42%,#ffffff_100%)] p-5 sm:p-6"
    >
      <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-[#0055A5]/15 blur-3xl" />
      <div className="pointer-events-none absolute -left-16 bottom-0 h-40 w-40 rounded-full bg-[#0077CC]/10 blur-3xl" />

      <div className="relative space-y-5">
        <div className="flex items-end justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#0055A5]/20 bg-white/80 px-3 py-1 text-xs font-semibold text-[#0055A5]">
              <Sparkles className="h-3.5 w-3.5" />
              Cập nhật mới
            </div>
            <h2 className="font-heading text-2xl font-bold tracking-tight text-slate-900">Tin tức</h2>
            <p className="max-w-2xl text-sm text-slate-600">Cập nhật hoạt động, tin tức mới nhất từ hệ thống Metro HCM.</p>
          </div>
          <Button
            asChild
            className="rounded-full bg-[#0055A5] px-5 text-white shadow-[0_10px_30px_rgba(0,85,165,0.28)] hover:bg-[#004b91]"
          >
            <Link href="/tin-tuc">
              Xem thêm
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>

        <div className="grid gap-4 lg:grid-cols-4">
        {loading
          ? Array.from({ length: 4 }).map((_, idx) => (
              <Card key={idx} className="overflow-hidden border-[#0055A5]/15 bg-white/95">
                <div className="p-5">
                  <Skeleton className="h-40 w-full" />
                  <Skeleton className="mt-4 h-4 w-24" />
                  <Skeleton className="mt-3 h-5 w-4/5" />
                  <Skeleton className="mt-2 h-4 w-full" />
                  <Skeleton className="mt-2 h-4 w-11/12" />
                </div>
              </Card>
            ))
          : news.length > 0
            ? news.map((item) => (
                <Link key={item.id} href={`/tin-tuc/${item.slug}`} className="block">
                  <Card className="group overflow-hidden border-[#0055A5]/15 bg-white/95 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_18px_36px_rgba(0,85,165,0.18)]">
                    <div className="relative flex h-40 items-center justify-center overflow-hidden bg-muted">
                      <img
                        src={item.thumbnail_url || FALLBACK_IMAGE}
                        alt={item.title}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                        onError={(event) => {
                          event.currentTarget.onerror = null;
                          event.currentTarget.src = FALLBACK_IMAGE;
                        }}
                      />
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#032f5f]/80 to-transparent p-3">
                        <div className="inline-flex items-center gap-1.5 rounded-full bg-[#0055A5] px-2.5 py-1 text-xs font-semibold text-white shadow-[0_8px_18px_rgba(0,85,165,0.35)]">
                          <CalendarDays className="h-3.5 w-3.5" />
                          {item.published_at ? format(new Date(item.published_at), "dd/MM/yyyy") : "Mới"}
                        </div>
                      </div>
                    </div>
                    <CardHeader className="p-4 pb-1">
                      <CardTitle className="line-clamp-2 text-lg text-slate-900 group-hover:text-[#004b91]">
                        {item.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="line-clamp-3 p-4 pt-1 text-sm text-slate-600">{item.summary}</CardContent>
                  </Card>
                </Link>
              ))
            : (
              <div className="col-span-1 rounded-2xl border border-dashed border-[#0055A5]/25 bg-white/80 py-8 text-center text-slate-600 lg:col-span-4">
                Đang cập nhật tin tức.
              </div>
            )}
        </div>
      </div>
    </section>
  );
}

