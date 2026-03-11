"use client";

import * as React from "react";
import { CalendarDays, Image as ImageIcon } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { NEWS } from "@/lib/mock-data";

export function NewsSection() {
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const t = window.setTimeout(() => setLoading(false), 700);
    return () => window.clearTimeout(t);
  }, []);

  return (
    <section id="tin-tuc" className="space-y-4">
      <div className="flex items-end justify-between gap-4">
        <div className="space-y-1">
          <h2 className="font-heading text-xl font-bold tracking-tight">Tin tức</h2>
          <p className="text-sm text-muted-foreground">
            Cập nhật hoạt động Metro HCM (dữ liệu mô phỏng).
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
          : NEWS.map((item) => (
              <Card key={item.id} className="card-hover overflow-hidden">
                <div className="flex h-40 items-center justify-center bg-muted">
                  <ImageIcon className="h-8 w-8 text-muted-foreground" />
                </div>
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <CalendarDays className="h-4 w-4" />
                    {item.date}
                  </div>
                  <CardTitle className="text-base">{item.title}</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  {item.excerpt}
                </CardContent>
              </Card>
            ))}
      </div>
    </section>
  );
}

