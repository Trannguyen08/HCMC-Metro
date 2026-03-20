"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { Calendar, ChevronRight, Filter } from "lucide-react";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardFooter 
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import api from "@/lib/api";

interface News {
  id: string;
  category_name: string;
  title: string;
  summary: string;
  thumbnail_url: string;
  slug: string;
  published_at: string;
}

interface Category {
  id: number;
  name: string;
  slug: string;
}

export default function NewsListPage() {
  const [news, setNews] = useState<News[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch categories
    api.get("/news/categories/")
      .then((res: any) => setCategories(res.data))
      .catch((err: any) => console.error("Fetch categories failed:", err));
  }, []);

  useEffect(() => {
    setLoading(true);
    const url = selectedCategory 
      ? `/news/?category=${selectedCategory}` 
      : "/news/";
    
    api.get(url)
      .then((res: any) => setNews(res.data))
      .catch((err: any) => console.error("Fetch news failed:", err))
      .finally(() => setLoading(false));
  }, [selectedCategory]);

  return (
    <div className="space-y-8 pb-12">
      <div className="space-y-2">
        <h1 className="text-3xl font-heading font-bold tracking-tight">Tin tức & Sự kiện</h1>
        <p className="text-muted-foreground">Cập nhật những thông tin mới nhất về hệ thống Metro TP.HCM.</p>
      </div>

      <div className="flex flex-wrap gap-2 items-center">
        <Button 
          variant={selectedCategory === null ? "default" : "outline"} 
          size="sm"
          onClick={() => setSelectedCategory(null)}
          className="rounded-full"
        >
          Tất cả
        </Button>
        {categories.map((cat) => (
          <Button 
            key={cat.id}
            variant={selectedCategory === cat.slug ? "default" : "outline"} 
            size="sm"
            onClick={() => setSelectedCategory(cat.slug)}
            className="rounded-full"
          >
            {cat.name}
          </Button>
        ))}
      </div>

      {loading ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="overflow-hidden border-none shadow-sm ring-1 ring-border">
              <Skeleton className="aspect-video w-full" />
              <CardHeader className="space-y-2">
                <Skeleton className="h-4 w-1/4" />
                <Skeleton className="h-6 w-full" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3 mt-2" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : news.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {news.map((item) => (
            <Link key={item.id} href={`/tin-tuc/${item.slug}`}>
              <Card className="h-full group overflow-hidden border-none shadow-sm ring-1 ring-border transition-all hover:shadow-md hover:ring-metro-blue/30">
                <div className="relative aspect-video overflow-hidden">
                  <img 
                    src={item.thumbnail_url || "https://images.unsplash.com/photo-1556155092-490a1ba16284?q=80&w=2070&auto=format&fit=crop"} 
                    alt={item.title}
                    className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-105"
                  />
                  <Badge className="absolute top-3 left-3 bg-white/90 text-metro-blue hover:bg-white border-none shadow-sm">
                    {item.category_name}
                  </Badge>
                </div>
                <CardHeader className="space-y-2 pb-2">
                  <div className="flex items-center text-xs text-muted-foreground gap-1.5">
                    <Calendar className="h-3.5 w-3.5" />
                    {item.published_at ? format(new Date(item.published_at), "dd MMMM, yyyy", { locale: vi }) : "Chưa xuất bản"}
                  </div>
                  <CardTitle className="text-xl leading-tight group-hover:text-metro-blue transition-colors">
                    {item.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pb-4">
                  <p className="text-sm text-muted-foreground line-clamp-3">
                    {item.summary}
                  </p>
                </CardContent>
                <CardFooter className="pt-0 text-sm font-medium text-metro-blue flex items-center gap-1">
                  Xem chi tiết <ChevronRight className="h-4 w-4" />
                </CardFooter>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <div className="py-20 text-center border rounded-xl bg-muted/20">
          <p className="text-muted-foreground">Không có tin tức nào trong danh mục này.</p>
          <Button variant="link" onClick={() => setSelectedCategory(null)}>Xem tất cả tin tức</Button>
        </div>
      )}
    </div>
  );
}
