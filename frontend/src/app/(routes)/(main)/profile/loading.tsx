import { Loader2 } from "lucide-react";

export default function ProfileLoading() {
  return (
    <div className="flex min-h-[200px] items-center justify-center rounded-xl border border-dashed p-12">
      <div className="flex flex-col items-center gap-2">
        <Loader2 className="h-8 w-8 animate-spin text-metro-blue" />
        <p className="text-sm font-medium text-muted-foreground">Đang tải trang...</p>
      </div>
    </div>
  );
}
