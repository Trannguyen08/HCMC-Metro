"use client";

import { CheckCircle2, Info, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

type LineStatus = {
  name: string;
  status: "normal" | "delayed" | "maintenance";
  message: string;
};

const STATUS_DATA: LineStatus[] = [
  { name: "Tuyến số 1 (Bến Thành - Suối Tiên)", status: "normal", message: "Đang hoạt động bình thường" },
  { name: "Tuyến số 2 (Bến Thành - Tham Lương)", status: "maintenance", message: "Đang trong quá trình thi công" },
];

export function SystemStatus() {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white/50 p-1 shadow-sm backdrop-blur-sm">
      <div className="flex flex-col divide-y md:flex-row md:divide-x md:divide-y-0">
        {STATUS_DATA.map((line, idx) => (
          <div key={idx} className="flex flex-1 items-center justify-between px-4 py-3 sm:px-6">
            <div className="flex items-center gap-3">
              <div className={cn(
                "flex h-8 w-8 items-center justify-center rounded-full",
                line.status === "normal" ? "bg-emerald-100 text-emerald-600" : 
                line.status === "maintenance" ? "bg-blue-100 text-blue-600" : 
                "bg-amber-100 text-amber-600"
              )}>
                {line.status === "normal" ? <CheckCircle2 className="h-4 w-4" /> : 
                 line.status === "maintenance" ? <Info className="h-4 w-4" /> : 
                 <AlertTriangle className="h-4 w-4" />}
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{line.name}</p>
                <p className="text-sm font-medium text-foreground">{line.message}</p>
              </div>
            </div>
            <div className="hidden h-2 w-2 rounded-full bg-emerald-500 animate-pulse md:block" />
          </div>
        ))}
      </div>
    </div>
  );
}
