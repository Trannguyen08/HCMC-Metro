import { QuickBooking } from "@/components/home/QuickBooking";

export function HeroSection() {
  return (
    <section className="relative overflow-hidden rounded-2xl border bg-background shadow-sm">
      <div className="absolute inset-0 -z-10">
        <div className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-[#0055A5]/15 blur-3xl" />
        <div className="absolute -right-24 top-12 h-72 w-72 rounded-full bg-[#00A86B]/15 blur-3xl" />
        <div className="absolute inset-0 bg-gradient-to-br from-white/60 to-transparent" />
      </div>

      <div className="grid gap-8 p-6 md:grid-cols-12 md:p-10">
        <div className="md:col-span-6">
          <div className="inline-flex items-center rounded-full border bg-background/70 px-3 py-1 text-xs font-medium text-muted-foreground">
            Metro HCM • Line 1 • Mock Booking UI
          </div>
          <h1 className="mt-4 font-heading text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
            Di chuyển thông minh cùng <span className="text-metro-blue">Metro HCM</span>
          </h1>
          <p className="mt-2 text-base text-muted-foreground">
            Nhanh chóng - An toàn - Tiện lợi
          </p>

          <div className="mt-6 space-y-3 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-metro-green" />
              Tra cứu lộ trình & thời gian dự kiến theo tuyến
            </div>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-metro-blue" />
              Đặt vé online nhanh, giao diện thân thiện di động
            </div>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-metro-green" />
              Tiện ích quanh ga, hỗ trợ hành khách
            </div>
          </div>
        </div>

        <div className="md:col-span-6">
          <QuickBooking />
        </div>
      </div>
    </section>
  );
}

