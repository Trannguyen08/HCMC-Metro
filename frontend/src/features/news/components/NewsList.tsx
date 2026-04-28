"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import {
  ArrowRight,
  Clock3,
  Filter,
  Newspaper,
  Search,
  Sparkles,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { newsService } from "../services/news-service";
import { News, NewsCategory } from "../types";
import { useDebounce } from "@/hooks/use-debounce";

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&q=80&w=1200";

function formatNewsDate(value?: string) {
  if (!value) return "Mới cập nhật";
  return format(new Date(value), "dd/MM/yyyy");
}

function NewsCard({
  item,
  featured = false,
}: {
  item: News;
  featured?: boolean;
}) {
  return (
    <Link href={`/tin-tuc/${item.slug}`} className="group block">
      <article
        className={
          featured
            ? "grid overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_20px_60px_rgba(15,23,42,0.06)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_24px_70px_rgba(15,23,42,0.09)] lg:grid-cols-[1fr_3fr]"
            : "flex h-full flex-col overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_18px_40px_rgba(15,23,42,0.08)]"
        }
      >
        <div className={featured ? "relative min-h-[200px] lg:min-h-[280px]" : "relative aspect-[4/3]"}>
          <img
            src={item.thumbnail_url || FALLBACK_IMAGE}
            alt={item.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            onError={(event) => {
              event.currentTarget.onerror = null;
              event.currentTarget.src = FALLBACK_IMAGE;
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/35 via-transparent to-transparent" />
        </div>

        <div className={featured ? "flex flex-col justify-between p-6 sm:p-8" : "flex flex-1 flex-col p-5"}>
          <div>
            <div className="mb-3 flex items-center gap-2">
              <Badge className="rounded-full border-0 bg-primary/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-primary hover:bg-primary/10">
                {item.category_name || "Tin tức"}
              </Badge>
              {featured ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500">
                  <Sparkles className="h-3.5 w-3.5" />
                  Nổi bật
                </span>
              ) : null}
            </div>

            <h2
              className={
                featured
                  ? "max-w-xl text-2xl font-bold leading-tight tracking-tight text-slate-900 transition-colors group-hover:text-primary sm:text-[32px]"
                  : "line-clamp-2 text-lg font-bold leading-snug text-slate-900 transition-colors group-hover:text-primary"
              }
            >
              {item.title}
            </h2>

            <p
              className={
                featured
                  ? "mt-4 max-w-xl text-[15px] leading-7 text-slate-600"
                  : "mt-3 line-clamp-3 text-sm leading-6 text-slate-600"
              }
            >
              {item.summary}
            </p>
          </div>

          <div className="mt-6 flex items-center justify-between gap-4">
            <div className="inline-flex items-center gap-2 text-sm text-slate-500">
              <Clock3 className="h-4 w-4" />
              {formatNewsDate(item.published_at)}
            </div>

            {featured ? (
              <span className="inline-flex items-center gap-2 text-sm font-semibold text-primary">
                Xem chi tiết
                <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
              </span>
            ) : null}
          </div>
        </div>
      </article>
    </Link>
  );
}

export function NewsList() {
  const [news, setNews] = useState<News[]>([]);
  const [categories, setCategories] = useState<NewsCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounce(searchQuery, 500);

  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const PAGE_SIZE = 7;

  useEffect(() => {
    newsService
      .getCategories()
      .then(setCategories)
      .catch((err) => console.error("Fetch categories failed:", err));
  }, []);

  useEffect(() => {
    const fetchInitialNews = async () => {
      setLoading(true);
      setOffset(0);
      try {
        const data = await newsService.getNews({
          category: selectedCategory === "all" ? undefined : selectedCategory,
          search: debouncedSearch || undefined,
          offset: 0,
          limit: PAGE_SIZE,
        });
        setNews(data);
        setHasMore(data.length === PAGE_SIZE);
      } catch (err) {
        console.error("Fetch news failed:", err);
      } finally {
        setLoading(false);
      }
    };

    void fetchInitialNews();
  }, [selectedCategory, debouncedSearch]);

  const loadMore = async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    const newOffset = offset + PAGE_SIZE;

    try {
      const data = await newsService.getNews({
        category: selectedCategory === "all" ? undefined : selectedCategory,
        search: debouncedSearch || undefined,
        offset: newOffset,
        limit: PAGE_SIZE,
      });

      if (data.length > 0) {
        setNews((prev) => [...prev, ...data]);
        setOffset(newOffset);
        setHasMore(data.length === PAGE_SIZE);
      } else {
        setHasMore(false);
      }
    } catch (err) {
      console.error("Load more failed:", err);
    } finally {
      setLoadingMore(false);
    }
  };

  const featuredNews = useMemo(() => news[0] ?? null, [news]);
  const remainingNews = useMemo(() => news.slice(1), [news]);

  return (
    <div className="mx-auto max-w-6xl px-4 pb-16 pt-4">
      <section className="relative overflow-hidden rounded-[32px] border border-slate-200 bg-[linear-gradient(180deg,#f8fbff_0%,#ffffff_58%)] px-6 py-8 shadow-sm sm:px-8 sm:py-10">
        <div className="pointer-events-none absolute right-0 top-0 h-44 w-44 rounded-full bg-primary/10 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 left-0 h-32 w-32 rounded-full bg-sky-100 blur-3xl" />

        <div className="relative space-y-6">
          <div className="max-w-3xl space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-white/90 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
              <Newspaper className="h-3.5 w-3.5" />
              Bản tin metro
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              Tin tức và cập nhật hệ thống
            </h1>
            <p className="text-sm leading-7 text-slate-600 sm:text-base">
              Theo dõi các thông báo vận hành, tin tức dịch vụ và những cập nhật mới nhất từ HCMC Metro trong một giao diện gọn, dễ đọc và tập trung vào nội dung.
            </p>
          </div>

          <div className="grid gap-3 rounded-[24px] border border-slate-200 bg-white/95 p-3 shadow-[0_12px_40px_rgba(15,23,42,0.04)] md:grid-cols-[minmax(0,1fr)_240px]">
            <div className="flex h-12 items-center rounded-2xl bg-slate-50 px-4">
              <Search className="mr-3 h-4 w-4 shrink-0 text-slate-400" />
              <input
                type="text"
                placeholder="Tìm kiếm tiêu đề bài viết..."
                className="h-full w-full bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
              />
            </div>

            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="h-12 rounded-2xl border-0 bg-slate-50 px-4 text-sm shadow-none focus:ring-0">
                <div className="flex items-center gap-2 text-slate-700">
                  <Filter className="h-4 w-4 text-slate-400" />
                  <SelectValue placeholder="Tất cả" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.slug || cat.id.toString()}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </section>

      <section className="mt-8 space-y-6">
        {loading ? (
          <>
            <div className="grid overflow-hidden rounded-[28px] border border-slate-200 bg-white lg:grid-cols-[1.2fr_1fr]">
              <Skeleton className="min-h-[280px] w-full rounded-none lg:min-h-[360px]" />
              <div className="space-y-4 p-6 sm:p-8">
                <Skeleton className="h-6 w-28 rounded-full" />
                <Skeleton className="h-10 w-4/5" />
                <Skeleton className="h-10 w-2/3" />
                <Skeleton className="h-5 w-full" />
                <Skeleton className="h-5 w-11/12" />
                <Skeleton className="h-5 w-3/4" />
              </div>
            </div>

            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="overflow-hidden rounded-[24px] border border-slate-200 bg-white p-5">
                  <Skeleton className="aspect-[4/3] w-full rounded-2xl" />
                  <Skeleton className="mt-4 h-5 w-24 rounded-full" />
                  <Skeleton className="mt-4 h-6 w-full" />
                  <Skeleton className="mt-2 h-6 w-4/5" />
                  <Skeleton className="mt-4 h-4 w-full" />
                  <Skeleton className="mt-2 h-4 w-5/6" />
                </div>
              ))}
            </div>
          </>
        ) : news.length > 0 && featuredNews ? (
          <>
            <NewsCard item={featuredNews} featured />

            {remainingNews.length > 0 ? (
              <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                {remainingNews.map((item) => (
                  <NewsCard key={item.id} item={item} />
                ))}
              </div>
            ) : null}

            {hasMore ? (
              <div className="flex justify-center pt-2">
                <Button
                  variant="outline"
                  onClick={loadMore}
                  disabled={loadingMore}
                  className="h-11 rounded-full border-slate-300 px-6 text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:text-primary"
                >
                  {loadingMore ? "Đang tải..." : "Xem thêm bài viết"}
                </Button>
              </div>
            ) : null}
          </>
        ) : (
          <div className="rounded-[28px] border border-dashed border-slate-300 bg-slate-50 px-6 py-16 text-center">
            <div className="mx-auto max-w-md space-y-3">
              <h2 className="text-xl font-semibold text-slate-900">Chưa tìm thấy bài viết phù hợp</h2>
              <p className="text-sm leading-6 text-slate-500">
                Hãy thử đổi từ khóa hoặc đưa bộ lọc về trạng thái mặc định để xem thêm các bản tin khác.
              </p>
              <Button
                variant="outline"
                className="mt-2 rounded-full border-slate-300"
                onClick={() => {
                  setSearchQuery("");
                  setSelectedCategory("all");
                }}
              >
                Xóa bộ lọc
              </Button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
