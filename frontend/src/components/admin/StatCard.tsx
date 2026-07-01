import React from "react";
import { LucideIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string | number | undefined;
  icon: LucideIcon;
  color?: string;
  bg?: string;
  description?: string;
  trend?: {
    value: number;
    isUp: boolean;
  };
  className?: string;
}

export function StatCard({
  label,
  value,
  icon: Icon,
  color = "text-primary",
  bg = "bg-primary/10",
  description,
  trend,
  className,
}: StatCardProps) {
  return (
    <Card className={cn("border-none shadow-sm overflow-hidden", className)}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
        <div className={cn("p-2 rounded-lg transition-colors", bg)}>
          <Icon className={cn("h-4 w-4", color)} />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold tracking-tight">{value ?? 0}</div>
        {(description || trend) && (
          <div className="mt-1 flex items-center gap-1.5">
            {trend && (
              <span className={cn(
                "text-xs font-bold",
                trend.isUp ? "text-emerald-600" : "text-rose-600"
              )}>
                {trend.isUp ? "↑" : "↓"} {trend.value}%
              </span>
            )}
            {description && (
              <p className="text-xs text-muted-foreground truncate">{description}</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
