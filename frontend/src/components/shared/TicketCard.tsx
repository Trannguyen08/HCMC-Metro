"use client";

import { Clock3, Coins, Route } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { RouteResult } from "@/lib/mock-data";

export function TicketCard({
  result,
  onBook
}: {
  result: RouteResult;
  onBook?: (id: string) => void;
}) {
  return (
    <Card className="card-hover">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <CardTitle className="text-base">
              {result.from.name} → {result.to.name}
            </CardTitle>
            <div className="text-sm text-muted-foreground">
              {result.departureTime} - {result.arrivalTime}
            </div>
          </div>
          <Badge variant="outline">Line 1</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-3 gap-2 text-sm">
          <div className="flex items-center gap-2 rounded-lg bg-muted/60 px-3 py-2">
            <Clock3 className="h-4 w-4 text-metro-blue" />
            <span>{result.durationMinutes} phút</span>
          </div>
          <div className="flex items-center gap-2 rounded-lg bg-muted/60 px-3 py-2">
            <Route className="h-4 w-4 text-metro-blue" />
            <span>{result.stops.length} ga</span>
          </div>
          <div className="flex items-center gap-2 rounded-lg bg-muted/60 px-3 py-2">
            <Coins className="h-4 w-4 text-metro-green" />
            <span>{result.priceVnd.toLocaleString("vi-VN")}đ</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {result.stops.slice(0, 6).map((s) => (
            <span
              key={s.id}
              className="rounded-full border bg-background px-2 py-1 text-xs text-muted-foreground"
            >
              {s.name}
            </span>
          ))}
          {result.stops.length > 6 && (
            <span className="text-xs text-muted-foreground">
              +{result.stops.length - 6} ga
            </span>
          )}
        </div>
      </CardContent>
      <CardFooter className="justify-end">
        <Button onClick={() => onBook?.(result.id)}>Đặt vé</Button>
      </CardFooter>
    </Card>
  );
}

