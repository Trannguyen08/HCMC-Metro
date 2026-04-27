"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

import * as React from "react";
import { ChevronLeft, ChevronRight, Quote, Star } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import api from "@/services/api-client";

export function FeedbackHighlight() {
  const [feedbacks, setFeedbacks] = React.useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = React.useState(0);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchPublicFeedback = async () => {
      try {
        const res = await api.get("/feedback/public/");
        setFeedbacks(res.data);
      } catch (err) {
        console.error("Failed to fetch public feedback", err);
      } finally {
        setLoading(false);
      }
    };
    fetchPublicFeedback();
  }, []);

  const next = () => {
    setCurrentIndex((prev) => (prev + 1) % feedbacks.length);
  };

  const prev = () => {
    setCurrentIndex((prev) => (prev - 1 + feedbacks.length) % feedbacks.length);
  };

  if (loading) {
    return (
      <div className="flex h-48 items-center justify-center rounded-2xl border border-slate-300 border-dashed">
        <p className="text-sm text-muted-foreground">Đang tải cảm nhận khách hàng...</p>
      </div>
    );
  }

  if (feedbacks.length === 0) return null;

  const current = feedbacks[currentIndex];

  return (
    <section className="space-y-8 py-10">
      <div className="text-center space-y-2">
        <h2 className="font-heading text-3xl font-bold tracking-tight">Cảm nhận khách hàng</h2>
        <p className="text-muted-foreground">Những chia sẻ từ hành khách sau khi trải nghiệm dịch vụ Metro HCM.</p>
      </div>

      <div className="relative mx-auto max-w-3xl px-12">
        <Card className="relative overflow-hidden border-none bg-white shadow-xl">
          <div className="absolute -right-4 -top-4 text-slate-100/50">
            <Quote className="h-24 w-24 rotate-12" />
          </div>
          
          <CardContent className="p-10 md:p-16">
            <div className="flex flex-col items-center text-center space-y-4">
              <Avatar className="h-16 w-16 shadow-sm border-2 border-white ring-2 ring-primary/10">
                {current.user_avatar ? (
                  <AvatarImage src={current.user_avatar} alt={current.user_full_name} />
                ) : (
                  <AvatarFallback className="text-2xl bg-primary/10 text-primary font-bold">
                    {(current.user_full_name || "K")[0].toUpperCase()}
                  </AvatarFallback>
                )}
              </Avatar>
              
              <div className="space-y-1">
                <p className="text-lg font-bold text-slate-900 leading-none">
                  {current.user_full_name || "Khách hàng Metro"}
                </p>
                <div className="flex justify-center gap-1 pt-2 pb-1">
                  {Array.from({ length: 5 }).map((_, idx) => (
                    <Star 
                      key={idx} 
                      className={`h-4 w-4 ${idx < (current.rating || 5) ? "fill-amber-400 text-amber-400" : "text-slate-200"}`} 
                    />
                  ))}
                </div>
                <p className="text-xs uppercase tracking-widest text-metro-blue font-bold">
                  {current.type === "experience" ? "Trải nghiệm" : current.type === "facility" ? "Cơ sở vật chất" : "Góp ý hệ thống"}
                </p>
              </div>
              
              <p className="text-lg md:text-xl font-medium italic leading-relaxed text-slate-700 max-w-2xl mx-auto pt-2">
                &quot;{current.content}&quot;
              </p>
            </div>
          </CardContent>
        </Card>

        {feedbacks.length > 1 && (
          <>
            <Button
              variant="outline"
              size="icon"
              className="absolute -left-4 top-1/2 -translate-y-1/2 rounded-full bg-white shadow-lg md:-left-8"
              onClick={prev}
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="absolute -right-4 top-1/2 -translate-y-1/2 rounded-full bg-white shadow-lg md:-right-8"
              onClick={next}
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </>
        )}
      </div>
      
      <div className="flex justify-center gap-2">
        {feedbacks.map((_, i) => (
          <div 
            key={i} 
            className={`h-1.5 rounded-full transition-all ${i === currentIndex ? "w-8 bg-metro-blue" : "w-2 bg-slate-200"}`} 
          />
        ))}
      </div>
    </section>
  );
}
