"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { format } from "date-fns";
import {
  ArrowLeft,
  Calendar,
  Check,
  Clock,
  ExternalLink,
  Newspaper,
  Share2,
  User,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { newsService } from "../services/news-service";
import { News } from "../types";

const FALLBACK_NEWS_IMAGE = "/images/news/metro-line-1-train.jpg";

function renderInlineBold(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, idx) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={idx} className="font-semibold text-slate-950">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return <span key={idx}>{part}</span>;
  });
}

function ArticleBody({ content, fallbackSummary }: { content?: string | null; fallbackSummary?: string }) {
  const rawText = (content || fallbackSummary || "").trim();
  if (!rawText) {
    return <p className="text-slate-600">Nội dung bài viết đang được cập nhật.</p>;
  }

  const blocks = rawText.split(/\n{2,}/);

  return (
    <div className="space-y-5 text-[15.5px] leading-8 text-slate-700">
      {blocks.map((block, i) => {
        const lines = block.split("\n").map((l) => l.trim()).filter(Boolean);
        if (lines.length === 0) return null;

        if (lines.length === 1 && lines[0].startsWith("### ")) {
          return (
            <h2 key={i} className="pt-2 text-xl font-bold tracking-tight text-slate-950 sm:text-2xl">
              {lines[0].slice(4)}
            </h2>
          );
        }

        if (lines.every((l) => l.startsWith("- ") || l.startsWith("• "))) {
          return (
            <ul key={i} className="space-y-2.5 rounded-2xl border border-slate-100 bg-slate-50/70 p-5">
              {lines.map((line, j) => (
                <li key={j} className="flex items-start gap-3">
                  <span className="mt-2.5 h-2 w-2 shrink-0 rounded-full bg-[#0055A5]" />
                  <span>{renderInlineBold(line.slice(2))}</span>
                </li>
              ))}
            </ul>
          );
        }

        if (lines.every((l) => /^\d+\.\s/.test(l))) {
          return (
            <ol key={i} className="space-y-2.5 rounded-2xl border border-slate-100 bg-slate-50/70 p-5">
              {lines.map((line, j) => (
                <li key={j} className="flex items-start gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#0055A5] text-xs font-bold text-white">
                    {j + 1}
                  </span>
                  <span>{renderInlineBold(line.replace(/^\d+\.\s*/, ""))}</span>
                </li>
              ))}
            </ol>
          );
        }

        return (
          <div key={i} className="space-y-3">
            {lines.map((line, j) => {
              if (line.startsWith("### ")) {
                return (
                  <h2 key={j} className="pt-2 text-xl font-bold tracking-tight text-slate-950">
                    {line.slice(4)}
                  </h2>
                );
              }
              return <p key={j}>{renderInlineBold(line)}</p>;
            })}
          </div>
        );
      })}
    </div>
  );
}

export function NewsDetail() {
  const { slug } = useParams();
  const router = useRouter();
  const [news, setNews] = useState<News | null>(null);
  const [relatedNews, setRelatedNews] = useState<News[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingRelated, setLoadingRelated] = useState(true);
  const [errorRelated, setErrorRelated] = useState(false);
  const [copied, setCopied] = useState(false);
  const [imgSrc, setImgSrc] = useState(FALLBACK_NEWS_IMAGE);

  useEffect(() => {
    const fetchDetail = async () => {
      if (!slug) return;
      setLoading(true);
      try {
        const data = await newsService.getNewsDetail(slug as string);
        setNews(data);
        setImgSrc(data.thumbnail_url || FALLBACK_NEWS_IMAGE);

        setLoadingRelated(true);
        setErrorRelated(false);
        try {
          const related = await newsService.getNews({
            exclude: data.id,
            limit: 4,
          });
          setRelatedNews(related);
        } catch {
          setErrorRelated(true);
        } finally {
          setLoadingRelated(false);
        }
      } catch (err) {
        console.error("Failed to fetch news detail:", err);
      } finally {
        setLoading(false);
      }
    };
    void fetchDetail();
  }, [slug]);

  const handleCopyLink = () => {
    if (typeof window !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href).catch(() => undefined);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl space-y-6 px-4 py-8">
        <Skeleton className="h-9 w-36 rounded-full" />
        <Skeleton className="h-12 w-5/6" />
        <Skeleton className="aspect-[16/9] w-full rounded-[28px]" />
        <div className="space-y-3 pt-4">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-4/5" />
        </div>
      </div>
    );
  }

  if (!news) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center">
        <h2 className="text-2xl font-bold text-slate-900">Không tìm thấy bài viết</h2>
        <p className="mt-2 text-sm text-slate-500">Bài viết có thể đã bị gỡ hoặc đường dẫn không hợp lệ.</p>
        <Button onClick={() => router.push("/tin-tuc")} className="mt-6 rounded-full px-6">
          Quay lại danh sách tin tức
        </Button>
      </div>
    );
  }

  const wordCount = `${news.summary || ""} ${news.content || ""}`.trim().split(/\s+/).filter(Boolean).length;
  const readMinutes = Math.max(2, Math.ceil(wordCount / 180));
  const publishedDate = news.published_at
    ? format(new Date(news.published_at), "dd/MM/yyyy HH:mm")
    : "Mới cập nhật";

  return (
    <article className="mx-auto max-w-4xl px-4 pb-16 pt-6">
      <div className="mb-6 flex items-center justify-between gap-3">
        <Button
          variant="outline"
          onClick={() => router.push("/tin-tuc")}
          className="rounded-full border-slate-200 bg-white px-4 text-slate-700 shadow-xs hover:bg-slate-50"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Quay lại tin tức
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={handleCopyLink}
          className="rounded-full border-slate-200 bg-white text-xs font-medium text-slate-700"
        >
          {copied ? (
            <>
              <Check className="mr-1.5 h-3.5 w-3.5 text-emerald-600" />
              Đã sao chép link
            </>
          ) : (
            <>
              <Share2 className="mr-1.5 h-3.5 w-3.5" />
              Chia sẻ bài viết
            </>
          )}
        </Button>
      </div>

      {/* Article Header */}
      <header className="space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <Badge className="rounded-full bg-[#0055A5] px-3.5 py-1 text-xs font-semibold text-white hover:bg-[#0055A5]">
            {news.category_name || "Tin tức Metro"}
          </Badge>
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500">
            <Calendar className="h-3.5 w-3.5 text-[#0055A5]" />
            {publishedDate}
          </span>
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500">
            <Clock className="h-3.5 w-3.5 text-emerald-600" />
            {readMinutes} phút đọc
          </span>
        </div>

        <h1 className="text-3xl font-bold leading-tight tracking-tight text-slate-950 sm:text-4xl">
          {news.title}
        </h1>

        <div className="flex items-center gap-3 pt-1 text-sm text-slate-600">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#0055A5]/10 font-bold text-[#0055A5]">
            <User className="h-4 w-4" />
          </div>
          <div>
            <p className="font-semibold text-slate-900">{news.author || "Ban biên tập HCMC Metro"}</p>
            <p className="text-xs text-slate-500">{news.source_name || "Cổng thông tin Metro TP.HCM"}</p>
          </div>
        </div>
      </header>

      {/* Featured Image */}
      <div className="my-7 overflow-hidden rounded-[28px] border border-slate-200 bg-slate-100 shadow-[0_20px_50px_rgba(15,23,42,0.08)]">
        <img
          src={imgSrc}
          alt={news.title}
          referrerPolicy="no-referrer"
          onError={() => {
            if (imgSrc !== FALLBACK_NEWS_IMAGE) setImgSrc(FALLBACK_NEWS_IMAGE);
          }}
          className="aspect-[16/9] w-full object-cover"
        />
      </div>

      {/* Lead Summary + Full Body */}
      <div className="rounded-[28px] border border-slate-200/80 bg-white p-6 shadow-sm sm:p-9">
        {news.summary ? (
          <div className="mb-7 rounded-r-2xl border-l-4 border-[#0055A5] bg-slate-50/90 px-5 py-4 text-base font-medium leading-relaxed text-slate-800">
            {news.summary}
          </div>
        ) : null}

        <ArticleBody content={news.content} fallbackSummary={news.summary} />

        {/* Official & Reputable Source Links */}
        <div className="mt-8 flex flex-col gap-3 rounded-2xl border border-sky-100 bg-sky-50/60 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#0055A5]">
              <Newspaper className="h-3.5 w-3.5" />
              Nguồn tin & Cổng thông tin chính thức
            </div>
            <p className="text-sm text-slate-700">
              Tin thực tế tổng hợp từ <strong className="text-slate-950">{news.source_name || "báo chí uy tín"}</strong>.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {news.source_url ? (
              <Button asChild className="rounded-full bg-[#0055A5] text-xs font-semibold hover:bg-[#004488]">
                <a href={news.source_url} target="_blank" rel="noopener noreferrer">
                  Đọc bài gốc ({news.source_name || "Báo chính thống"})
                  <ExternalLink className="ml-1.5 h-3.5 w-3.5" />
                </a>
              </Button>
            ) : null}
            <Button
              asChild
              variant="outline"
              className="rounded-full border-slate-200 bg-white text-xs font-semibold text-slate-800 hover:bg-slate-50"
            >
              <a href="https://hurc.vn" target="_blank" rel="noopener noreferrer">
                Trang tin chính thức HURC1
                <ExternalLink className="ml-1.5 h-3.5 w-3.5 text-[#0055A5]" />
              </a>
            </Button>
          </div>
        </div>
      </div>

      {/* Related News */}
      <div className="mt-12 border-t border-slate-200 pt-10">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold tracking-tight text-slate-950">Tin tức liên quan</h2>
          <Button variant="ghost" size="sm" onClick={() => router.push("/tin-tuc")} className="text-[#0055A5]">
            Xem tất cả
          </Button>
        </div>

        {loadingRelated ? (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="aspect-[16/10] w-full rounded-2xl" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            ))}
          </div>
        ) : errorRelated ? (
          <p className="inline-block rounded-xl bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
            Không thể tải tin tức liên quan
          </p>
        ) : relatedNews.length > 0 ? (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {relatedNews.map((item) => (
              <div
                key={item.id}
                className="group cursor-pointer overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs transition-all hover:-translate-y-0.5 hover:shadow-md"
                onClick={() => router.push(`/tin-tuc/${item.id}-${item.slug || "metro"}`)}
              >
                <div className="relative aspect-[16/10] overflow-hidden bg-slate-100">
                  <img
                    src={item.thumbnail_url || FALLBACK_NEWS_IMAGE}
                    alt={item.title}
                    referrerPolicy="no-referrer"
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                </div>
                <div className="space-y-2 p-4">
                  <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-slate-900 transition-colors group-hover:text-[#0055A5]">
                    {item.title}
                  </h3>
                  <p className="flex items-center gap-1 text-xs text-slate-500">
                    <Calendar className="h-3 w-3 text-[#0055A5]" />
                    {item.published_at
                      ? format(new Date(item.published_at), "dd/MM/yyyy")
                      : "Mới cập nhật"}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-500">Không có tin tức liên quan.</p>
        )}
      </div>
    </article>
  );
}
