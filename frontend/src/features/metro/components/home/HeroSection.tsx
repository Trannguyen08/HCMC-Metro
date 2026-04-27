import { BookOpen, Clock3, ShieldCheck, TrainFront } from "lucide-react";

export function HeroSection() {
  return (
    <section className="relative overflow-hidden rounded-2xl border border-slate-200 bg-background shadow-sm">
      <div className="absolute inset-0 -z-10">
        <div className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-[#0055A5]/15 blur-3xl" />
        <div className="absolute -right-24 top-12 h-72 w-72 rounded-full bg-[#00A86B]/15 blur-3xl" />
        <div className="absolute inset-0 bg-gradient-to-br from-white/60 to-transparent" />
      </div>

      <div className="grid gap-8 p-6 md:grid-cols-12 md:p-10">
        <div className="md:col-span-7">
          <div className="inline-flex items-center rounded-full border border-slate-200 bg-background/70 px-3 py-1 text-xs font-medium text-muted-foreground">
            Metro HCM • Line 1
          </div>
          <h1 className="mt-4 font-heading text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
            Di chuyển thông minh cùng <span className="text-metro-blue">Metro HCM</span>
          </h1>
          <p className="mt-2 text-base text-muted-foreground">Nhanh chóng - An toàn - Tiện lợi</p>

          <div className="mt-6 space-y-3 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-metro-green" />
              Tra cứu lộ trình và thời gian dự kiến theo tuyến
            </div>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-metro-blue" />
              Kết nối nhiều nhà ga trung tâm và khu vực cửa ngõ
            </div>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-metro-green" />
              Tích hợp tin tức, tiện ích và bản đồ số cho hành khách
            </div>
          </div>
        </div>

        <div className="md:col-span-5">
          <div className="rounded-2xl border border-slate-200 bg-white/80 p-6 shadow-card backdrop-blur">
            <h2 className="font-heading text-xl font-bold tracking-tight text-foreground">Giới thiệu Metro HCM</h2>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              Tuyến Metro số 1 giúp kết nối Đông - Tây thành phố, giảm áp lực giao thông mặt đất và tạo trải nghiệm di
              chuyển hiện đại cho người dân.
            </p>

            <div className="mt-5 grid gap-3">
              <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-background/70 p-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-metro-blue/10 text-metro-blue">
                  <TrainFront className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">Vận hành ổn định</p>
                  <p className="text-xs text-muted-foreground">Tần suất đến đều trong khung giờ cao điểm</p>
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-background/70 p-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-metro-green/10 text-metro-green">
                  <Clock3 className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">Tiết kiệm thời gian</p>
                  <p className="text-xs text-muted-foreground">Tối ưu hành trình cho học tập và đi làm mỗi ngày</p>
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-background/70 p-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600">
                  <ShieldCheck className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">An toàn, thân thiện</p>
                  <p className="text-xs text-muted-foreground">Nhà ga thông thoáng, có nhiều điểm hỗ trợ hành khách</p>
                </div>
              </div>
            </div>

            <div className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-metro-blue">
              <BookOpen className="h-4 w-4" />
              Tìm hiểu thêm qua mục Tin tức và Tiện ích bên dưới
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

