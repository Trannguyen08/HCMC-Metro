"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import {
  ArrowUpRight,
  Calendar,
  Clock,
  ExternalLink,
  Filter,
  Newspaper,
  Search,
  User,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { newsService } from "../services/news-service";
import { News, NewsCategory } from "../types";

const PAGE_SIZE = 10;
const FALLBACK_NEWS_IMAGE = "/images/news/metro-line-1-train.jpg";

function formatPublishedDate(dateValue?: string) {
  if (!dateValue) return "Mới cập nhật";
  const parsed = new Date(dateValue);
  if (Number.isNaN(parsed.getTime())) return "Mới cập nhật";
  return format(parsed, "dd/MM/yyyy");
}

function estimateReadingMinutes(item: News) {
  const words = `${item.summary || ""} ${item.content || ""}`.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(2, Math.ceil(words / 180));
}

function NewsCard({ item, featured = false }: { item: News; featured?: boolean }) {
  const [imgSrc, setImgSrc] = useState(item.thumbnail_url || FALLBACK_NEWS_IMAGE);
  const articleHref = `/tin-tuc/${item.id}-${item.slug || "metro"}`;
  const categoryName = item.category_name || "Tin tức chung";
  const publishedDate = formatPublishedDate(item.published_at || item.created_at);
  const readMinutes = estimateReadingMinutes(item);

  if (featured) {
    return (
      <Link
        href={articleHref}
        className="group grid overflow-hidden rounded-[30px] border border-slate-200/90 bg-white shadow-[0_20px_55px_rgba(15,23,42,0.06)] transition-all duration-300 hover:-translate-y-0.5 hover:border-[#0055A5]/30 hover:shadow-[0_24px_60px_rgba(0,85,165,0.12)] lg:grid-cols-[1.18fr_1fr]"
      >
        <div className="relative min-h-[280px] overflow-hidden bg-slate-100 lg:min-h-[380px]">
          <img
            src={imgSrc}
            alt={item.title}
            referrerPolicy="no-referrer"
            onError={() => {
              if (imgSrc !== FALLBACK_NEWS_IMAGE) setImgSrc(FALLBACK_NEWS_IMAGE);
            }}
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-transparent lg:hidden" />
          <div className="absolute left-5 top-5 flex items-center gap-2">
            <Badge className="rounded-full bg-[#0055A5] px-3.5 py-1 text-xs font-semibold text-white shadow-sm hover:bg-[#0055A5]">
              Tin nổi bật
            </Badge>
            <Badge className="rounded-full border border-white/25 bg-white/90 px-3 py-1 text-xs font-semibold text-slate-800 backdrop-blur-md hover:bg-white">
              {categoryName}
            </Badge>
          </div>
        </div>

        <div className="flex flex-col justify-between p-6 sm:p-8 lg:p-10">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-slate-500">
              <span className="inline-flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-[#0055A5]" />
                {publishedDate}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-emerald-600" />
                {readMinutes} phút đọc
              </span>
            </div>

            <h2 className="text-2xl font-bold leading-snug tracking-tight text-slate-950 transition-colors group-hover:text-[#0055A5] sm:text-3xl">
              {item.title}
            </h2>

            <p className="line-clamp-4 text-sm leading-7 text-slate-600 sm:text-base">
              {item.summary}
            </p>
          </div>

          <div className="mt-8 flex items-center justify-between border-t border-slate-100 pt-5">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <User className="h-3.5 w-3.5 text-slate-400" />
              <span className="font-medium text-slate-700">
                {item.source_name ? `${item.source_name}${item.author ? ` · ${item.author}` : ""}` : (item.author || "Ban biên tập HCMC Metro")}
              </span>
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-50 px-4 py-2 text-xs font-semibold text-[#0055A5] transition-colors group-hover:bg-[#0055A5] group-hover:text-white">
              Đọc chi tiết
              <ArrowUpRight className="h-4 w-4" />
            </span>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link
      href={articleHref}
      className="group flex h-full flex-col overflow-hidden rounded-[26px] border border-slate-200/85 bg-white shadow-[0_10px_35px_rgba(15,23,42,0.04)] transition-all duration-300 hover:-translate-y-1 hover:border-[#0055A5]/30 hover:shadow-[0_20px_50px_rgba(0,85,165,0.1)]"
    >
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-slate-100">
        <img
          src={imgSrc}
          alt={item.title}
          referrerPolicy="no-referrer"
          onError={() => {
            if (imgSrc !== FALLBACK_NEWS_IMAGE) setImgSrc(FALLBACK_NEWS_IMAGE);
          }}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-950/35 via-transparent to-transparent" />
        <Badge className="absolute left-3.5 top-3.5 rounded-full bg-white/95 px-3 py-1 text-xs font-semibold text-slate-800 shadow-sm backdrop-blur-md hover:bg-white">
          {categoryName}
        </Badge>
      </div>

      <div className="flex flex-1 flex-col justify-between p-5">
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="inline-flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-[#0055A5]" />
              {publishedDate}
            </span>
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3 w-3 text-slate-400" />
              {readMinutes} phút
            </span>
          </div>

          <h3 className="line-clamp-2 text-lg font-bold leading-snug text-slate-900 transition-colors group-hover:text-[#0055A5]">
            {item.title}
          </h3>

          <p className="line-clamp-3 text-sm leading-relaxed text-slate-600">
            {item.summary}
          </p>
        </div>

        <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-3.5 text-xs font-semibold text-[#0055A5]">
          <span className="truncate text-slate-500 font-normal">
            {item.source_name || "HCMC Metro Portal"}
          </span>
          <span className="inline-flex shrink-0 items-center gap-1 group-hover:underline">
            Đọc tiếp
            <ArrowUpRight className="h-3.5 w-3.5" />
          </span>
        </div>
      </div>
    </Link>
  );
}

export function NewsList() {
  const router = useRouter();
  const [news, setNews] = useState<News[]>([]);
  const [categories, setCategories] = useState<NewsCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [debouncedSearch, setDebouncedSearch] = useState<string>("");
  const [offset, setOffset] = useState<number>(0);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery.trim());
    }, 350);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    const fetchCats = async () => {
      try {
        const data = await newsService.getCategories();
        setCategories(data);
      } catch (err) {
        console.error("Failed to fetch news categories:", err);
      }
    };
    void fetchCats();
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
    <div className="mx-auto max-w-6xl space-y-8 px-4 pb-16 pt-4">
      <section className="relative overflow-hidden rounded-[32px] border border-slate-200 bg-[linear-gradient(135deg,#f0f7ff_0%,#ffffff_55%,#f8fafc_100%)] px-6 py-8 shadow-sm sm:px-9 sm:py-10">
        <div className="pointer-events-none absolute -right-10 -top-10 h-56 w-56 rounded-full bg-[#0055A5]/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-10 left-10 h-40 w-40 rounded-full bg-sky-200/40 blur-3xl" />

        <div className="relative space-y-6">
          <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
            <div className="max-w-3xl space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-[#0055A5]/20 bg-white px-3.5 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-[#0055A5] shadow-xs">
                <Newspaper className="h-3.5 w-3.5" />
                Bản tin Metro TP.HCM
              </div>
              <h1 className="text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
                Tin tức vận hành & cập nhật hệ thống
              </h1>
              <p className="text-sm leading-7 text-slate-600 sm:text-base">
                Tổng hợp thông tin chính thức về tuyến Metro số 1 (Bến Thành – Suối Tiên), mạng lưới 17 tuyến buýt điện kết nối, chính sách giá vé và quy hoạch đô thị TOD tại TP.HCM.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 self-start lg:self-auto">
              <a
                href="https://hurc.vn"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-2xl border border-[#0055A5]/25 bg-[#0055A5] px-4 py-3 text-xs font-semibold text-white shadow-sm transition hover:bg-[#004488]"
              >
                Trang tin chính thức HURC1
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
              <a
                href="https://maur.hochiminhcity.gov.vn"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-xs font-semibold text-slate-700 shadow-xs transition hover:border-[#0055A5]/40 hover:text-[#0055A5]"
              >
                Cổng thông tin MAUR
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
              <div className="flex items-center gap-3 rounded-2xl border border-slate-200/80 bg-white/90 px-4 py-2.5 shadow-xs">
                <div>
                  <p className="text-[11px] text-slate-500">Bản tin uy tín</p>
                  <p className="text-base font-bold text-slate-950">{loading ? "..." : `${news.length} bài viết`}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Search + Dropdown */}
          <div className="grid gap-3 rounded-[24px] border border-slate-200 bg-white/95 p-3 shadow-[0_12px_35px_rgba(15,23,42,0.04)] md:grid-cols-[minmax(0,1fr)_240px]">
            <div className="flex h-12 items-center rounded-2xl bg-slate-50 px-4">
              <Search className="mr-3 h-4 w-4 shrink-0 text-slate-400" />
              <input
                type="text"
                placeholder="Tìm kiếm bài viết theo tiêu đề hoặc nội dung..."
                className="h-full w-full bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
              />
            </div>

            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="h-12 rounded-2xl border-0 bg-slate-50 px-4 text-sm shadow-none focus:ring-0">
                <div className="flex items-center gap-2 text-slate-700">
                  <Filter className="h-4 w-4 text-[#0055A5]" />
                  <SelectValue placeholder="Tất cả chuyên mục" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả chuyên mục</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.slug || cat.id.toString()}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Quick Category Pills */}
          {categories.length > 0 ? (
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setSelectedCategory("all")}
                className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-all ${
                  selectedCategory === "all"
                    ? "bg-[#0055A5] text-white shadow-sm"
                    : "border border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900"
                }`}
              >
                Tất cả
              </button>
              {categories.map((cat) => {
                const value = cat.slug || cat.id.toString();
                const isActive = selectedCategory === value;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedCategory(value)}
                    className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-all ${
                      isActive
                        ? "bg-[#0055A5] text-white shadow-sm"
                        : "border border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900"
                    }`}
                  >
                    {cat.name}
                  </button>
                );
              })}
            </div>
          ) : null}
        </div>
      </section>

      <section className="space-y-7">
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
              </div>
            </div>

            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="overflow-hidden rounded-[24px] border border-slate-200 bg-white p-5">
                  <Skeleton className="aspect-[16/10] w-full rounded-2xl" />
                  <Skeleton className="mt-4 h-5 w-24 rounded-full" />
                  <Skeleton className="mt-4 h-6 w-full" />
                  <Skeleton className="mt-2 h-6 w-4/5" />
                  <Skeleton className="mt-4 h-4 w-full" />
                </div>
              ))}
            </div>
          </>
        ) : news.length > 0 && featuredNews ? (
          <>
            <NewsCard item={featuredNews} featured />

            {remainingNews.length > 0 ? (
              <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
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
                  className="h-11 rounded-full border-slate-300 px-6 text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:text-[#0055A5]"
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
                Hãy thử đổi từ khóa hoặc chọn lại chuyên mục để xem thêm các bản tin khác.
              </p>
              <Button
                variant="outline"
                className="mt-2 rounded-full border-slate-300"
                onClick={() => {
                  setSearchQuery("");
                  setSelectedCategory("all");
                  router.refresh();
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
