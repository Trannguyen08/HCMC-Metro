"use client";

import * as React from "react";
import { CalendarDays, Image as ImageIcon } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import api from "@/lib/api";

interface News {
  id: string;
  title: string;
  summary: string;
  thumbnail_url: string;
  slug: string;
  published_at: string;
}

export function NewsSection() {
  const [news, setNews] = React.useState<News[]>([]);
  const [loading, setLoading] = React.useState(true);
  const router = useRouter();

  React.useEffect(() => {
    setLoading(true);
    api.get("/news/?limit=3")
      .then((res: any) => {
        setNews(res.data);
      })
      .catch((err) => console.error("Failed to fetch news:", err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <section id="tin-tuc" className="space-y-4">
      <div className="flex items-end justify-between gap-4">
        <div className="space-y-1">
          <h2 className="font-heading text-xl font-bold tracking-tight">Tin tức</h2>
          <p className="text-sm text-muted-foreground">
            Cập nhật hoạt động, tin tức mới nhất từ hệ thống Metro HCM.
          </p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {loading
          ? Array.from({ length: 3 }).map((_, idx) => (
              <Card key={idx}>
                <div className="p-6">
                  <Skeleton className="h-40 w-full" />
                  <Skeleton className="mt-4 h-4 w-24" />
                  <Skeleton className="mt-3 h-5 w-4/5" />
                  <Skeleton className="mt-2 h-4 w-full" />
                  <Skeleton className="mt-2 h-4 w-11/12" />
                </div>
              </Card>
            ))
          : news.length > 0 ? news.map((item) => (
              <Card 
                key={item.id} 
                className="card-hover overflow-hidden cursor-pointer"
                onClick={() => router.push(`/tin-tuc/${item.slug}`)}
              >
                <div className="relative flex h-40 items-center justify-center bg-muted overflow-hidden">
                  {item.thumbnail_url ? (
                    <img src={item.thumbnail_url} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  ) : (
                    <ImageIcon className="h-8 w-8 text-muted-foreground" />
                  )}
                </div>
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <CalendarDays className="h-4 w-4" />
                    {item.published_at ? format(new Date(item.published_at), "dd/MM/yyyy HH:mm") : "Chưa xuất bản"}
                  </div>
                  <CardTitle className="text-base line-clamp-2 group-hover:text-metro-blue transition-colors">{item.title}</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground line-clamp-3">
                  {item.summary}
                </CardContent>
              </Card>
            )) : (
              <div className="col-span-1 lg:col-span-3 text-center text-muted-foreground py-8">
                Đang cập nhật tin tức.
              </div>
            )}
      </div>
    </section>
  );
}

