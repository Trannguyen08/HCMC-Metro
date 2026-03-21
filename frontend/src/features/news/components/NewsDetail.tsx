"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { Calendar, ChevronLeft, Share2, Printer, MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { newsService } from "../services/news-service";
import { News } from "../types";

export function NewsDetail() {
  const { slug } = useParams();
  const router = useRouter();
  const [news, setNews] = useState<News | null>(null);
  const [loading, setLoading] = useState(true);
  const [relatedNews, setRelatedNews] = useState<News[]>([]);
  const [loadingRelated, setLoadingRelated] = useState(false);
  const [errorRelated, setErrorRelated] = useState(false);

  useEffect(() => {
    if (!slug || typeof slug !== "string") return;
    
    setLoading(true);
    newsService.getNewsDetail(slug)
      .then((data) => {
        setNews(data);
        if (data.category) {
          setLoadingRelated(true);
          setErrorRelated(false);
          newsService.getNews({ 
            category: data.category.toString(), 
            exclude: data.id, 
            limit: 5 
          })
            .then(setRelatedNews)
            .catch((err) => {
              console.error("Fetch related news failed", err);
              setErrorRelated(true);
            })
            .finally(() => setLoadingRelated(false));
        }
      })
      .catch((err) => {
        console.error("Fetch news detail failed:", err);
      })
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto space-y-6 pb-20">
        <Skeleton className="h-10 w-3/4" />
        <div className="flex gap-4">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-32" />
        </div>
        <Skeleton className="aspect-video w-full rounded-xl" />
        <div className="space-y-4">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      </div>
    );
  }

  if (!news) {
    return (
      <div className="py-20 text-center space-y-4">
        <h2 className="text-2xl font-bold">Không tìm thấy bài viết</h2>
        <p className="text-muted-foreground">Bài viết bạn yêu cầu không tồn tại hoặc đã bị gỡ bỏ.</p>
        <Button onClick={() => router.push("/tin-tuc")}>Quay lại danh sách tin tức</Button>
      </div>
    );
  }

  return (
    <article className="max-w-4xl mx-auto pb-20">
      <Button 
        variant="ghost" 
        size="sm" 
        className="mb-6 -ml-2 text-muted-foreground hover:text-metro-blue"
        onClick={() => router.push("/tin-tuc")}
      >
        <ChevronLeft className="mr-1 h-4 w-4" /> Quay lại tin tức
      </Button>

      <div className="space-y-6">
        <div className="space-y-4">
          <Badge className="bg-metro-blue/10 text-metro-blue hover:bg-metro-blue/20 border-none px-3 py-1 text-xs">
            {news.category_name}
          </Badge>
          <h1 className="text-3xl md:text-4xl font-heading font-extrabold tracking-tight leading-tight">
            {news.title}
          </h1>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted-foreground border-b pb-6">
            <div className="flex items-center gap-1.5">
              <Calendar className="h-4 w-4" />
              {news.published_at ? format(new Date(news.published_at), "dd/MM/yyyy HH:mm") : "Chưa xuất bản"}
            </div>
            <div className="flex items-center gap-1.5">
              <MapPin className="h-4 w-4" />
              TP. Hồ Chí Minh
            </div>
            <div className="ml-auto flex items-center gap-2">
               <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                 <Share2 className="h-4 w-4" />
               </Button>
               <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={() => window.print()}>
                 <Printer className="h-4 w-4" />
               </Button>
            </div>
          </div>
        </div>

        <div className="relative aspect-video overflow-hidden rounded-2xl shadow-lg ring-1 ring-border">
          <img 
            src={news.thumbnail_url || "https://images.unsplash.com/photo-1556155092-490a1ba16284?q=80&w=2070&auto=format&fit=crop"} 
            alt={news.title}
            className="object-cover w-full h-full"
          />
        </div>

        <div className="prose prose-metro lg:prose-lg max-w-none">
          <p className="text-xl font-medium leading-relaxed text-foreground/90 bg-muted/30 p-6 rounded-xl border-l-4 border-metro-blue italic">
            {news.summary}
          </p>
          
          <div className="mt-8 space-y-6 text-foreground/80 leading-loose">
            <p>
              Đây là nội dung chi tiết của bài viết. Trong thực tế, bạn có thể sử dụng một Rich Text Editor để quản lý nội dung này 
              với đầy đủ định dạng HTML, hình ảnh và video. 
            </p>
            <p>
              Hệ thống Metro TP.HCM (Management Authority for Urban Railways - MAUR) đang nỗ lực đẩy nhanh tiến độ 
              hoàn thành các tuyến đường sắt đô thị, nhằm giải quyết vấn đề giao thông và thúc đẩy phát triển kinh tế bền vững cho thành phố.
            </p>
            <h3 className="text-2xl font-bold text-foreground mt-8 mb-4">Mục tiêu phát triển</h3>
            <p>
              Tuyến Metro số 1 (Bến Thành - Suối Tiên) là dự án trọng điểm, dự kiến sẽ thay đổi diện mạo giao thông công cộng. 
              Người dân sẽ có những trải nghiệm di chuyển hiện đại, an toàn và nhanh chóng.
            </p>
            <img 
              src="https://images.unsplash.com/photo-1519003722824-194d4455a60c?q=80&w=2075&auto=format&fit=crop" 
              alt="Hệ thống Metro" 
              className="rounded-xl w-full shadow-md my-8"
            />
            <p>
              Chúng tôi sẽ tiếp tục cập nhật những thông tin mới nhất về lộ trình, giá vé và các tiện ích đi kèm trong các bản tin tiếp theo. 
              Hãy theo dõi thường xuyên để không bỏ lỡ các thông tin quan trọng.
            </p>
          </div>
        </div>
        
        <div className="mt-12 pt-8 border-t flex flex-col md:flex-row items-center justify-between gap-6">
           <div className="flex items-center gap-4">
             <div className="h-12 w-12 rounded-full metro-gradient flex items-center justify-center text-white font-bold">
               M
             </div>
             <div>
               <div className="font-bold">Ban Quản lý Đường sắt Đô thị (MAUR)</div>
               <div className="text-xs text-muted-foreground">Phòng Quan hệ Công chúng & Truyền thông</div>
             </div>
           </div>
           
           <Button variant="outline" className="rounded-full shadow-sm" asChild>
             <a href="#" target="_blank" rel="noopener noreferrer">Xem bài viết đầy đủ</a>
           </Button>
        </div>
      </div>

      <div className="mt-16 pt-10 border-t">
        <h2 className="text-2xl font-bold mb-6">Tin tức liên quan</h2>
        {loadingRelated ? (
          <div className="flex gap-4 overflow-x-auto pb-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="min-w-[250px] space-y-3">
                <Skeleton className="h-32 w-full rounded-xl" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            ))}
          </div>
        ) : errorRelated ? (
          <p className="text-destructive font-medium bg-destructive/10 p-4 rounded-lg inline-block">Không thể tải tin tức liên quan</p>
        ) : relatedNews.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {relatedNews.map((item) => (
              <div 
                key={item.id} 
                className="group cursor-pointer rounded-xl border bg-card text-card-foreground shadow-sm overflow-hidden hover:shadow-md transition-all"
                onClick={() => router.push(`/tin-tuc/${item.slug}`)}
              >
                <div className="relative aspect-video overflow-hidden bg-muted">
                  <img 
                    src={item.thumbnail_url || "https://images.unsplash.com/photo-1556155092-490a1ba16284?q=80&w=2070&auto=format&fit=crop"} 
                    alt={item.title}
                    className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <div className="p-4 space-y-2">
                  <h3 className="font-semibold line-clamp-2 text-sm leading-tight group-hover:text-metro-blue transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {item.published_at ? format(new Date(item.published_at), "dd/MM/yyyy HH:mm") : "Chưa xuất bản"}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground">Không có tin tức liên quan.</p>
        )}
      </div>
    </article>
  );
}
