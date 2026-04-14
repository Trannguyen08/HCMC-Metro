import React from "react";
import { Loader2 } from "lucide-react";

export default function RootLoading() {
  return (
    <div className="flex h-[60vh] w-full flex-col items-center justify-center gap-4">
      <div className="relative flex h-20 w-20 items-center justify-center">
        <div className="absolute h-full w-full animate-ping rounded-full bg-primary/20"></div>
        <div className="metro-gradient flex h-16 w-16 items-center justify-center rounded-2xl text-white shadow-lg">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
      <div className="flex flex-col items-center gap-1 text-center">
        <h3 className="font-heading text-lg font-bold text-primary">Đang tải trang...</h3>
        <p className="text-sm text-muted-foreground">Vui lòng đợi trong giây lát</p>
      </div>
    </div>
  );
}
