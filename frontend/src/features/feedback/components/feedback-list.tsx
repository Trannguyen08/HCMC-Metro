"use client";

import * as React from "react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { Loader2, MessageSquare, Star } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { feedbackService } from "../services/feedback-service";
import { Feedback, FeedbackStatus, FeedbackType } from "../types";
import { cn } from "@/lib/utils";

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={cn(
            "h-3 w-3",
            i <= rating ? "fill-amber-400 text-amber-400" : "text-slate-300"
          )}
        />
      ))}
    </div>
  );
}

export function FeedbackList() {
  const [feedbacks, setFeedbacks] = React.useState<Feedback[]>([]);
  const [loading, setLoading] = React.useState(true);

  const fetchFeedbacks = React.useCallback(async () => {
    try {
      const data = await feedbackService.getMyFeedbacks();
      setFeedbacks(data);
    } catch (err) {
      console.error("Failed to fetch feedbacks", err);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchFeedbacks();
  }, [fetchFeedbacks]);

  const getStatusBadge = (status: FeedbackStatus) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">Chờ xử lý</Badge>;
      case "processing":
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Đang xử lý</Badge>;
      case "resolved":
        return <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">Đã giải quyết</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getTypeLabel = (type: FeedbackType) => {
    switch (type) {
      case "facility":
        return "Cơ sở vật chất";
      case "experience":
        return "Trải nghiệm";
      case "error":
        return "Lỗi hệ thống";
      default:
        return type;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (feedbacks.length === 0) {
    return (
      <div className="text-center py-12 border rounded-xl border-dashed bg-muted/20">
        <MessageSquare className="h-10 w-10 mx-auto text-muted-foreground mb-3 opacity-20" />
        <p className="text-sm text-muted-foreground">Bạn chưa gửi góp ý nào.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="font-medium text-sm text-muted-foreground">Lịch sử góp ý ({feedbacks.length})</h3>
      <div className="grid gap-4">
        {feedbacks.map((fb) => (
          <Card key={fb.id} className="shadow-sm overflow-hidden border-none ring-1 ring-border">
            <CardContent className="p-4">
              <div className="mb-3 flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      {getTypeLabel(fb.type)}
                    </span>
                    {fb.train_detail && (
                      <Badge variant="secondary" className="h-4 px-1.5 text-[10px] font-mono">
                        Tàu: {fb.train_detail.train_number}
                      </Badge>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {format(new Date(fb.created_at), "HH:mm, dd MMMM yyyy", { locale: vi })}
                  </div>
                  <div className="pt-0.5">
                    <StarRating rating={fb.rating} />
                  </div>
                </div>
                {getStatusBadge(fb.status)}
              </div>
              <p className="text-sm leading-relaxed text-foreground/90">{fb.content}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
