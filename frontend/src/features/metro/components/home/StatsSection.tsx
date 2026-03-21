import { Card, CardContent } from "@/components/ui/card";

const STATS = [
  { label: "Ga", value: "14" },
  { label: "Chiều dài", value: "19.7km" },
  { label: "Hành khách/ngày", value: "500K+" },
  { label: "Giờ hoạt động", value: "6:00-22:00" }
];

export function StatsSection() {
  return (
    <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {STATS.map((s) => (
        <Card key={s.label} className="card-hover">
          <CardContent className="flex items-center justify-between p-6">
            <div className="space-y-1">
              <div className="font-heading text-2xl font-bold tracking-tight">
                {s.value}
              </div>
              <div className="text-sm text-muted-foreground">{s.label}</div>
            </div>
            <div className="h-10 w-10 rounded-xl bg-muted" />
          </CardContent>
        </Card>
      ))}
    </section>
  );
}

