"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { Clock, Search, Filter } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
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
  const PAGE_SIZE = 10;

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
    fetchInitialNews();
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

  return (
    <div className="max-w-4xl mx-auto pb-12 px-4">
      {/* Header */}
      <div className="flex flex-col gap-5 pt-6 pb-6">
        <div className="flex items-center gap-2.5">
          {/* Icon clipboard/news */}
          <div className="p-1.5 bg-blue-50 rounded-md">
            <svg className="h-5 w-5 text-metro-blue" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="8" y="2" width="8" height="4" rx="1" ry="1"/>
              <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
              <line x1="9" y1="12" x2="15" y2="12"/>
              <line x1="9" y1="16" x2="13" y2="16"/>
            </svg>
          </div>
          <h1 className="text-xl font-bold text-slate-800">Tin tức &amp; Sự kiện</h1>
        </div>

        {/* Search + Filter — merged single bar */}
        <div className="flex items-center h-11 bg-white border border-slate-200 rounded-lg overflow-hidden">
          {/* Search icon */}
          <Search className="ml-3 h-4 w-4 text-slate-400 shrink-0" />

          {/* Search input — grows to fill */}
          <input
            type="text"
            placeholder="Tìm kiếm tiêu đề bài viết..."
            className="flex-1 h-full px-3 text-sm bg-transparent outline-none text-slate-700 placeholder:text-slate-400"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />

          {/* Divider */}
          <div className="w-px h-5 bg-slate-200 shrink-0" />

          {/* Category select — right side, fixed width */}
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="h-full w-[200px] border-none shadow-none rounded-none bg-transparent text-sm pl-3 pr-3 focus:ring-0">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-slate-400 shrink-0" />
                <SelectValue placeholder="Tất cả tin tức" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả tin tức</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat.id} value={cat.slug || cat.id.toString()}>
                  {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* News List */}
      <div className="divide-y divide-slate-100 px-[100px]">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex gap-4 py-5">
              <Skeleton className="w-[120px] h-[90px] rounded-lg shrink-0" />
              <div className="flex-1 space-y-2.5 pt-1">
                <Skeleton className="h-3.5 w-20" />
                <Skeleton className="h-5 w-full" />
                <Skeleton className="h-5 w-4/5" />
                <Skeleton className="h-3.5 w-1/3" />
              </div>
            </div>
          ))
        ) : news.length > 0 ? (
          <>
            {news.map((item) => (
              <Link key={item.id} href={`/tin-tuc/${item.slug}`} className="group flex gap-4 py-5 hover:bg-slate-50/60 transition-colors rounded-lg px-1 -mx-1">
                <div className="w-[150px] h-[150px] rounded-lg overflow-hidden shrink-0 bg-slate-100">
                  <img
                    src={
                      item.thumbnail_url ||
                      "https://images.unsplash.com/photo-1556155092-490a1ba16284?auto=format&fit=crop&q=80&w=400"
                    }
                    alt={item.title}
                    className="w-[150px] h-[150px] object-cover"
                  />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                  <div>
                    {/* Category badge */}
                    <Badge
                      variant="secondary"
                      className="mb-2 bg-blue-50 text-metro-blue border-none uppercase text-[10px] font-bold tracking-wider px-2 py-0.5"
                    >
                      {item.category_name}
                    </Badge>

                    {/* Title */}
                    <h2 className="text-sm font-semibold text-slate-800 leading-snug line-clamp-2 group-hover:text-metro-blue transition-colors">
                      {item.title}
                    </h2>

                    {/* Summary — optional, shown on larger screens */}
                    <p className="md:block mt-1 text-xs text-slate-500 line-clamp-2 leading-relaxed">
                      {item.summary}
                    </p>
                  </div>

                  {/* Date */}
                  <div className="flex items-center gap-1 text-[11px] text-slate-400 mt-1.5">
                    <Clock className="h-3 w-3" />
                    <span>
                      {item.published_at
                        ? format(new Date(item.published_at), "dd/MM/yyyy")
                        : "01/01/2024"}
                    </span>
                  </div>
                </div>
              </Link>
            ))}

            {/* Load More */}
            {hasMore && (
              <div className="flex justify-center pt-6">
                <Button
                  variant="outline"
                  onClick={loadMore}
                  disabled={loadingMore}
                  className="rounded-full px-7 h-9 text-sm text-slate-600 border-slate-200 hover:bg-slate-50 hover:text-metro-blue transition-all"
                >
                  {loadingMore ? "Đang tải..." : "Xem thêm tin cũ"}
                </Button>
              </div>
            )}
          </>
        ) : (
          <div className="py-20 text-center border-2 border-dashed rounded-2xl bg-slate-50 mt-2">
            <p className="text-slate-500 text-sm">Không tìm thấy tin tức nào phù hợp.</p>
            <Button
              variant="link"
              className="mt-2 text-metro-blue text-sm"
              onClick={() => {
                setSearchQuery("");
                setSelectedCategory("all");
              }}
            >
              Đặt lại bộ lọc
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}