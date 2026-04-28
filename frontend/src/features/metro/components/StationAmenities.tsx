"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight, Compass, Map, Sparkles, Store, TrainFront } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAmenities } from "@/hooks/useAmenities";
import { AmenityType } from "@/types/amenity";
import { AmenityFiltersBar } from "./AmenityFiltersbar";
import { AmenityCard } from "./AmenityCard";

const CATEGORY_COUNT = 5;

function SkeletonCard() {
  return (
    <div className="overflow-hidden rounded-[28px] border border-slate-200/80 bg-white">
      <div className="aspect-[4/3] animate-pulse bg-slate-200" />
      <div className="space-y-3 p-5">
        <div className="h-5 w-24 animate-pulse rounded-full bg-slate-200" />
        <div className="h-6 w-4/5 animate-pulse rounded-xl bg-slate-200" />
        <div className="h-4 w-full animate-pulse rounded-lg bg-slate-100" />
        <div className="h-4 w-2/3 animate-pulse rounded-lg bg-slate-100" />
        <div className="h-24 animate-pulse rounded-2xl bg-slate-100" />
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  hint,
  accentClass,
}: {
  label: string;
  value: string;
  hint: string;
  accentClass: string;
}) {
  return (
    <Card className="rounded-[28px] border-slate-200/80 shadow-[0_18px_50px_rgba(15,23,42,0.05)]">
      <CardContent className="p-5">
        <div className={`mb-4 h-2 w-16 rounded-full ${accentClass}`} />
        <p className="text-sm font-medium text-slate-500">{label}</p>
        <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">{value}</p>
        <p className="mt-2 text-sm leading-6 text-slate-500">{hint}</p>
      </CardContent>
    </Card>
  );
}

function EmptyState({
  onReset,
  type,
}: {
  onReset: () => void;
  type: AmenityType;
}) {
  return (
    <div className="col-span-full rounded-[32px] border border-dashed border-slate-300 bg-white/80 px-6 py-16 text-center shadow-sm">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-slate-500">
        <Compass className="h-7 w-7" />
      </div>
      <h3 className="mt-5 text-2xl font-semibold text-slate-900">Chưa tìm thấy tiện ích phù hợp</h3>
      <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-slate-500">
        Thử đổi bộ lọc trên.
      </p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <Button onClick={onReset} className="rounded-full px-5">
          Xóa bộ lọc
        </Button>
        {type !== "all" ? (
          <Button variant="outline" onClick={() => onReset()} className="rounded-full px-5">
            Quay lại tất cả
          </Button>
        ) : null}
      </div>
    </div>
  );
}

const AmenitiesPage: React.FC = () => {
  const {
    amenities,
    stations,
    filters,
    loading,
    error,
    total,
    setSearch,
    setStationId,
    setType,
    resetFilters,
  } = useAmenities();

  const [currentPage, setCurrentPage] = React.useState(1);
  const itemsPerPage = 12;

  // Reset page when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [filters]);

  const totalPages = Math.ceil(amenities.length / itemsPerPage);
  const paginatedAmenities = amenities.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f7fafc_0%,#eef5ff_26%,#ffffff_100%)] pb-16">
      <div className="mx-auto flex max-w-7xl flex-col gap-8 px-4 pt-2 pb-6 sm:px-6 lg:px-8 lg:pt-2 lg:pb-8">
        <section className="relative overflow-hidden rounded-[36px] border border-slate-200/80 bg-white px-6 py-8 shadow-[0_28px_80px_rgba(15,23,42,0.08)] sm:px-8 lg:px-10 lg:py-10">
          <div className="absolute inset-y-0 right-0 hidden w-1/2 bg-[radial-gradient(circle_at_top_right,rgba(0,168,107,0.18),transparent_45%),radial-gradient(circle_at_bottom_right,rgba(0,85,165,0.12),transparent_42%)] lg:block" />
          <div className="relative grid gap-8 lg:grid-cols-[minmax(0,1.2fr)_minmax(280px,0.8fr)] lg:items-end">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-[#0055A5]/15 bg-[#0055A5]/8 px-4 py-2 text-sm font-medium text-[#0055A5]">
                <Sparkles className="h-4 w-4" />
                Tiện ích quanh ga Metro
              </div>

              <h1 className="mt-5 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl lg:text-5xl">
                Tìm điểm dừng phù hợp trước và sau mỗi chặng Metro.
              </h1>

              <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">
                Từ cà phê, nhà hàng đến mua sắm và dịch vụ thiết yếu, bạn có thể lọc nhanh theo ga để lên hành trình gọn hơn và dễ quan sát hơn.
              </p>

              <div className="mt-6 flex flex-wrap items-center gap-3">
                <Button asChild className="rounded-full px-5">
                  <Link href="/ban-do-so">
                    Khám phá bản đồ số
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild variant="outline" className="rounded-full px-5">
                  <Link href="/lo-trinh">
                    <TrainFront className="mr-2 h-4 w-4" />
                    Kết hợp với lộ trình
                  </Link>
                </Button>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
              <div className="rounded-[28px] border border-slate-200/70 bg-slate-50/90 p-5">
                <p className="text-sm font-medium text-slate-500">Trạng thái hiện tại</p>
                <p className="mt-2 text-2xl font-semibold text-slate-950">{loading ? "Đang tải..." : `${total} điểm`}</p>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Danh sách được cập nhật theo bộ lọc.
                </p>
              </div>
              <div className="rounded-[28px] border border-slate-200/70 bg-slate-50/90 p-5">
                <p className="text-sm font-medium text-slate-500">Phủ ga Metro</p>
                <p className="mt-2 text-2xl font-semibold text-slate-950">{stations.length} ga</p>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Nhanh tay lọc theo khu vực để thu hẹp lựa chọn.
                </p>
              </div>
              <div className="rounded-[28px] border border-slate-200/70 bg-slate-50/90 p-5">
                <p className="text-sm font-medium text-slate-500">Danh mục</p>
                <p className="mt-2 text-2xl font-semibold text-slate-950">{CATEGORY_COUNT} nhóm</p>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Du lịch, ăn uống, mua sắm và dịch vụ cơ bản.
                </p>
              </div>
            </div>
          </div>
        </section>



        <AmenityFiltersBar
          search={filters.search}
          stationId={filters.stationId}
          type={filters.type}
          stations={stations}
          onSearchChange={setSearch}
          onStationChange={setStationId}
          onTypeChange={setType}
        />

        <section className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight text-slate-950">Danh sách tiện ích</h2>
              <p className="mt-1 text-sm text-slate-500">
                Ảnh trong thẻ giữ cùng tỉ lệ để dễ xem hơn.
              </p>
            </div>
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-500 shadow-sm">
              <Store className="h-4 w-4 text-[#0055A5]" />
              {loading ? "Đang tải dữ liệu..." : `${paginatedAmenities.length} / ${total || amenities.length} kết quả`}
            </div>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pb-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="rounded-full"
              >
                Trước
              </Button>
              <div className="text-sm font-medium">
                Trang {currentPage} / {totalPages}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="rounded-full"
              >
                Sau
              </Button>
            </div>
          )}

          {error ? (
            <div className="rounded-[28px] border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700">
              {error}
            </div>
          ) : null}

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {loading
              ? Array.from({ length: 6 }).map((_, index) => <SkeletonCard key={index} />)
              : amenities.length === 0
                ? <EmptyState onReset={resetFilters} type={filters.type} />
                : paginatedAmenities.map((amenity) => <AmenityCard key={amenity.id} amenity={amenity} />)}
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <Card className="rounded-[30px] border-slate-200/80 shadow-[0_18px_50px_rgba(15,23,42,0.05)]">
            <CardContent className="flex h-full flex-col justify-between gap-5 p-6">
              <div className="space-y-2">
                <p className="text-sm font-medium text-slate-500">Gợi ý sử dụng</p>
                <h3 className="text-2xl font-semibold tracking-tight text-slate-950">
                  Lọc theo ga trước, sau đó thu hẹp theo nhu cầu.
                </h3>
                <p className="text-sm leading-7 text-slate-600">
                  Cách này giúp danh sách gọn hơn và dễ tìm các điểm dừng chân thực sự có ích trong hành trình của bạn.
                </p>
              </div>
              <div className="inline-flex items-center gap-2 text-sm font-medium text-[#0055A5]">
                <Map className="h-4 w-4" />
                Bạn có thể tiếp tục đổi bộ lọc ở phía trên bất cứ lúc nào.
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-[30px] border-slate-200/80 bg-slate-950 text-white shadow-[0_24px_60px_rgba(15,23,42,0.12)]">
            <CardContent className="flex h-full flex-col justify-between gap-5 p-6">
              <div className="space-y-2">
                <p className="text-sm font-medium text-white/70">Trải nghiệm tốt hơn</p>
                <h3 className="text-2xl font-semibold tracking-tight">Ảnh card đồng đều, nội dung dễ quét, bộ lọc dễ dùng.</h3>
                <p className="text-sm leading-7 text-white/75">
                  Giao diện mới ưu tiên tính rõ ràng và giữ nhịp thị giác ổn định trên desktop lẫn mobile.
                </p>
              </div>
              <div className="inline-flex items-center gap-2 text-sm font-medium text-white">
                <ArrowRight className="h-4 w-4" />
                Mở từng thẻ để xem thông tin chi tiết và chỉ đường.
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
};

export default AmenitiesPage;


