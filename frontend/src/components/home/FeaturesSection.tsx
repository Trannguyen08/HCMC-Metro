import { CreditCard, MapPinned, TrainFront } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const FEATURES = [
  {
    icon: CreditCard,
    title: "Đặt vé online",
    desc: "Chọn ga, chọn chuyến và đặt vé chỉ trong vài bước."
  },
  {
    icon: TrainFront,
    title: "Tra cứu lộ trình thời gian thực (mock)",
    desc: "Xem thời gian dự kiến, số ga dừng và chi phí theo tuyến."
  },
  {
    icon: MapPinned,
    title: "Tiện ích quanh ga",
    desc: "Tìm bãi xe, y tế, ăn uống, ngân hàng gần ga bạn chọn."
  }
];

export function FeaturesSection() {
  return (
    <section className="grid gap-4 lg:grid-cols-3">
      {FEATURES.map((f) => (
        <Card key={f.title} className="card-hover">
          <CardHeader className="pb-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted text-metro-blue">
              <f.icon className="h-5 w-5" />
            </div>
            <CardTitle className="mt-3 text-base">{f.title}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            {f.desc}
          </CardContent>
        </Card>
      ))}
    </section>
  );
}

