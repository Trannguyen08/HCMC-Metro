import { Suspense } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { LoTrinhClient } from "@/app/lo-trinh/LoTrinhClient";

export default function LoTrinhPage() {
  return (
    <Suspense
      fallback={
        <Card className="shadow-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Đang tải dữ liệu...</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-24 w-full" />
          </CardContent>
        </Card>
      }
    >
      <LoTrinhClient />
    </Suspense>
  );
}

