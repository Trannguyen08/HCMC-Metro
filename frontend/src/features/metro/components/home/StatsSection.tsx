import { Clock3, MapPin, Route, Users } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";

const STATS = [
  { label: "Ga", value: "14", icon: MapPin },
  { label: "Chiều dài", value: "19.7km", icon: Route },
  { label: "Hành khách/ngày", value: "500K+", icon: Users },
  { label: "Giờ hoạt động", value: "6:00-22:00", icon: Clock3 },
];

export function StatsSection() {
  return (
    <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {STATS.map((s) => (
        <Card key={s.label} className="card-hover">
          <CardContent className="flex items-center justify-between p-6">
            <div className="space-y-1">
              <div className="font-heading text-2xl font-bold tracking-tight">{s.value}</div>
              <div className="text-sm text-muted-foreground">{s.label}</div>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-metro-blue/10 text-metro-blue">
              <s.icon className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      ))}
    </section>
  );
}

