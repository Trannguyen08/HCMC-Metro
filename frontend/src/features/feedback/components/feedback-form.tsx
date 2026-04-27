"use client";

import * as React from "react";
import { Loader2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { feedbackService } from "../services/feedback-service";
import { FeedbackType, Train } from "../types";
import api from "@/services/api-client";
import { toast } from "@/store/use-toast-store";

export function FeedbackForm({ onSuccess }: { onSuccess?: () => void }) {
  const [type, setType] = React.useState<FeedbackType>("experience");
  const [content, setContent] = React.useState("");
  const [trainId, setTrainId] = React.useState<string>("none");
  const [trains, setTrains] = React.useState<Train[]>([]);
  const [rating, setRating] = React.useState(5);
  const [loading, setLoading] = React.useState(false);
  const [loadingTrains, setLoadingTrains] = React.useState(false);

  React.useEffect(() => {
    const fetchTrains = async () => {
      setLoadingTrains(true);
      try {
        const res = await api.get("/metro/trains/");
        setTrains(res.data);
      } catch (err) {
        console.error("Failed to fetch trains", err);
      } finally {
        setLoadingTrains(false);
      }
    };

    fetchTrains();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) {
      toast.error("Vui lòng nhập nội dung góp ý.");
      return;
    }

    setLoading(true);

    try {
      await feedbackService.createFeedback({
        type,
        content,
        rating,
        train: type === "facility" && trainId !== "none" ? parseInt(trainId) : null,
      });
      toast.success("Gửi góp ý thành công! Cảm ơn bạn đã đóng góp ý kiến.");
      setContent("");
      setTrainId("none");
      setRating(5);
      if (onSuccess) onSuccess();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Đã có lỗi xảy ra. Vui lòng thử lại sau.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="shadow-card border-none bg-muted/30">
      <CardHeader>
        <CardTitle className="text-lg">Gửi góp ý của bạn</CardTitle>
        <CardDescription>
          Chúng tôi luôn lắng nghe ý kiến của bạn để nâng cao chất lượng dịch vụ.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="feedback-type">Loại góp ý</Label>
            <Select value={type} onValueChange={(val: FeedbackType) => setType(val)}>
              <SelectTrigger id="feedback-type">
                <SelectValue placeholder="Chọn loại góp ý" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="experience">Trải nghiệm dịch vụ</SelectItem>
                <SelectItem value="facility">Cơ sở vật chất</SelectItem>
                <SelectItem value="error">Thông báo lỗi hệ thống</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Đánh giá của bạn</Label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className="transition-transform hover:scale-110 active:scale-95"
                >
                  <svg
                    className={`h-8 w-8 ${star <= rating ? "fill-amber-400 text-amber-400" : "fill-transparent text-slate-300"}`}
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                  </svg>
                </button>
              ))}
            </div>
          </div>

          {type === "facility" && (
            <div className="space-y-2 animate-in fade-in slide-in-from-top-1">
              <Label htmlFor="train-select">Chọn mã tàu (không bắt buộc)</Label>
              <Select value={trainId} onValueChange={setTrainId}>
                <SelectTrigger id="train-select">
                  <SelectValue placeholder={loadingTrains ? "Đang tải danh sách tàu..." : "Chọn mã tàu"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Không chọn</SelectItem>
                  {trains.map((train) => (
                    <SelectItem key={train.id} value={train.id.toString()}>
                      {train.train_number}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="content">Nội dung</Label>
            <Textarea
              id="content"
              placeholder="Vui lòng mô tả chi tiết góp ý của bạn..."
              className="min-h-[120px] resize-none"
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Send className="mr-2 h-4 w-4" />
            )}
            Gửi góp ý
          </Button>
        </form>
      </CardContent>
    </Card>

  );
}
