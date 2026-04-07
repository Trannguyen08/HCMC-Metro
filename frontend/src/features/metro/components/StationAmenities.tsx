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
      <h3 className="mt-5 text-2xl font-semibold text-slate-900">Chua tim thay tien ich phu hop</h3>
      <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-slate-500">
        Thu doi ga, loai tien ich hoac tu khoa tim kiem. He thong se hien thi danh sach moi ngay khi co ket qua phu hop.
      </p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <Button onClick={onReset} className="rounded-full px-5">
          Xoa bo loc
        </Button>
        {type !== "all" ? (
          <Button variant="outline" onClick={() => onReset()} className="rounded-full px-5">
            Quay lai tat ca nhom
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

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f7fafc_0%,#eef5ff_26%,#ffffff_100%)] pb-16">
      <div className="mx-auto flex max-w-7xl flex-col gap-8 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <section className="relative overflow-hidden rounded-[36px] border border-slate-200/80 bg-white px-6 py-8 shadow-[0_28px_80px_rgba(15,23,42,0.08)] sm:px-8 lg:px-10 lg:py-10">
          <div className="absolute inset-y-0 right-0 hidden w-1/2 bg-[radial-gradient(circle_at_top_right,rgba(0,168,107,0.18),transparent_45%),radial-gradient(circle_at_bottom_right,rgba(0,85,165,0.12),transparent_42%)] lg:block" />
          <div className="relative grid gap-8 lg:grid-cols-[minmax(0,1.2fr)_minmax(280px,0.8fr)] lg:items-end">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-[#0055A5]/15 bg-[#0055A5]/8 px-4 py-2 text-sm font-medium text-[#0055A5]">
                <Sparkles className="h-4 w-4" />
                Tien ich quanh ga Metro
              </div>

              <h1 className="mt-5 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl lg:text-5xl">
                Tim diem dung phu hop truoc va sau moi chang Metro.
              </h1>

              <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">
                Tu ca phe, nha hang den mua sam va dich vu thiet yeu, ban co the loc nhanh theo ga de len hanh trinh gon hon va de quan sat hon.
              </p>

              <div className="mt-6 flex flex-wrap items-center gap-3">
                <Button asChild className="rounded-full px-5">
                  <Link href="/ban-do-so">
                    Kham pha ban do so
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild variant="outline" className="rounded-full px-5">
                  <Link href="/lo-trinh">
                    <TrainFront className="mr-2 h-4 w-4" />
                    Ket hop voi lo trinh
                  </Link>
                </Button>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
              <div className="rounded-[28px] border border-slate-200/70 bg-slate-50/90 p-5">
                <p className="text-sm font-medium text-slate-500">Trang thai hien tai</p>
                <p className="mt-2 text-2xl font-semibold text-slate-950">{loading ? "Dang tai..." : `${total} diem`}</p>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Danh sach duoc cap nhat theo bo loc ban dang chon.
                </p>
              </div>
              <div className="rounded-[28px] border border-slate-200/70 bg-slate-50/90 p-5">
                <p className="text-sm font-medium text-slate-500">Phu ga Metro</p>
                <p className="mt-2 text-2xl font-semibold text-slate-950">{stations.length} ga</p>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Nhanh tay loc theo khu vuc de thu hep lua chon.
                </p>
              </div>
              <div className="rounded-[28px] border border-slate-200/70 bg-slate-50/90 p-5">
                <p className="text-sm font-medium text-slate-500">Danh muc</p>
                <p className="mt-2 text-2xl font-semibold text-slate-950">{CATEGORY_COUNT} nhom</p>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Du lich, an uong, mua sam va cac dich vu co ban.
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

        <section className="grid gap-4 md:grid-cols-3">
          <StatCard
            label="Ket qua dang hien thi"
            value={loading ? "--" : amenities.length.toString()}
            hint="So luong the dang hien tren man hinh theo bo loc hien tai."
            accentClass="bg-[#0055A5]"
          />
          <StatCard
            label="Tong diem phu hop"
            value={loading ? "--" : total.toString()}
            hint="Tong ket qua tim duoc tren toan bo he thong cho lua chon hien tai."
            accentClass="bg-[#00A86B]"
          />
          <StatCard
            label="Che do duyet"
            value={filters.stationId ? "Theo ga" : "Toan mang"}
            hint="Ban co the chuyen nhanh giua xem tong hop va xem theo tung nha ga."
            accentClass="bg-amber-400"
          />
        </section>

        <section className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight text-slate-950">Danh sach tien ich</h2>
              <p className="mt-1 text-sm text-slate-500">
                Anh trong moi the duoc giu cung mot ti le de danh sach gon va de quet hon.
              </p>
            </div>
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-500 shadow-sm">
              <Store className="h-4 w-4 text-[#0055A5]" />
              {loading ? "Dang tai du lieu..." : `${amenities.length} / ${total || amenities.length} ket qua`}
            </div>
          </div>

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
                : amenities.map((amenity) => <AmenityCard key={amenity.id} amenity={amenity} />)}
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <Card className="rounded-[30px] border-slate-200/80 shadow-[0_18px_50px_rgba(15,23,42,0.05)]">
            <CardContent className="flex h-full flex-col justify-between gap-5 p-6">
              <div className="space-y-2">
                <p className="text-sm font-medium text-slate-500">Goi y su dung</p>
                <h3 className="text-2xl font-semibold tracking-tight text-slate-950">
                  Loc theo ga truoc, sau do thu hep theo nhu cau.
                </h3>
                <p className="text-sm leading-7 text-slate-600">
                  Cach nay giup danh sach gon hon va de tim cac diem dung chan thuc su co ich trong hanh trinh cua ban.
                </p>
              </div>
              <div className="inline-flex items-center gap-2 text-sm font-medium text-[#0055A5]">
                <Map className="h-4 w-4" />
                Ban co the tiep tuc doi bo loc o phia tren bat cu luc nao.
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-[30px] border-slate-200/80 bg-slate-950 text-white shadow-[0_24px_60px_rgba(15,23,42,0.12)]">
            <CardContent className="flex h-full flex-col justify-between gap-5 p-6">
              <div className="space-y-2">
                <p className="text-sm font-medium text-white/70">Trai nghiem tot hon</p>
                <h3 className="text-2xl font-semibold tracking-tight">Anh card dong deu, noi dung de quet, bo loc de dung.</h3>
                <p className="text-sm leading-7 text-white/75">
                  Giao dien moi uu tien tinh ro rang va giu nhip thi giac on dinh tren desktop lan mobile.
                </p>
              </div>
              <div className="inline-flex items-center gap-2 text-sm font-medium text-white">
                <ArrowRight className="h-4 w-4" />
                Mo tung the de xem thong tin chi tiet va chi duong.
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
};

export default AmenitiesPage;
