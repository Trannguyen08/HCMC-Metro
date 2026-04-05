"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowUpRight,
  Clock3,
  ExternalLink,
  Image as ImageIcon,
  MapPinned,
  Navigation,
  Phone,
  Store,
  TrainFront,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { TYPE_COLORS, TYPE_LABELS } from "@/features/metro/constants/amenity";
import { fetchAmenityDetail } from "@/features/metro/services/AmenityService";
import { buildGoogleMapsUrl, formatDistance } from "@/features/metro/utils/amenity";
import { Amenity } from "@/types/amenity";
import { cn } from "@/lib/utils";

interface AmenityDetailPageProps {
  amenityId: string;
}

function SectionCard({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="rounded-[30px] border-slate-200/80 shadow-[0_18px_55px_rgba(15,23,42,0.06)]">
      <CardContent className="p-6 sm:p-7">
        <div className="mb-5">
          <h2 className="text-xl font-semibold tracking-tight text-slate-950">{title}</h2>
          {description ? <p className="mt-2 text-sm leading-7 text-slate-500">{description}</p> : null}
        </div>
        {children}
      </CardContent>
    </Card>
  );
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3 rounded-2xl bg-slate-50 p-4">
      <div className="mt-0.5 text-slate-400">{icon}</div>
      <div className="min-w-0">
        <p className="text-sm font-medium text-slate-500">{label}</p>
        <p className="mt-1 text-sm leading-6 text-slate-900">{value}</p>
      </div>
    </div>
  );
}

export default function AmenityDetailPage({ amenityId }: AmenityDetailPageProps) {
  const [amenity, setAmenity] = useState<Amenity | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadDetail() {
      try {
        setLoading(true);
        setError(null);

        const response = await fetchAmenityDetail(amenityId);
        if (!active) return;

        if (!response) {
          setError("Khong tim thay tien ich.");
          return;
        }

        setAmenity(response);
      } catch (err) {
        if (!active) return;
        setError(err instanceof Error ? err.message : "Khong the tai chi tiet tien ich.");
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadDetail();

    return () => {
      active = false;
    };
  }, [amenityId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[linear-gradient(180deg,#f8fafc_0%,#edf4ff_100%)] px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl space-y-6">
          <div className="grid gap-6 lg:grid-cols-[1fr_440px]">
            <div className="h-[420px] animate-pulse rounded-[34px] bg-slate-200" />
            <div className="h-[420px] animate-pulse rounded-[34px] bg-slate-200" />
          </div>
          <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="h-64 animate-pulse rounded-[30px] bg-slate-200" />
            <div className="h-64 animate-pulse rounded-[30px] bg-slate-200" />
          </div>
          <div className="h-80 animate-pulse rounded-[30px] bg-slate-200" />
        </div>
      </div>
    );
  }

  if (error || !amenity) {
    return (
      <div className="min-h-screen bg-slate-50 px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl rounded-[28px] border border-rose-100 bg-white p-8 text-center shadow-sm">
          <p className="text-lg font-semibold text-slate-900">{error || "Khong tim thay tien ich."}</p>
          <Button asChild className="mt-6 rounded-full px-5">
            <Link href="/tien-ich">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Quay lai danh sach
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  const mapsUrl = buildGoogleMapsUrl(amenity);
  const heroImage = amenity.thumbnailUrl || amenity.imageUrl;

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f8fafc_0%,#edf4ff_24%,#ffffff_100%)] pb-16">
      <div className="mx-auto max-w-7xl px-4 pt-6 sm:px-6 lg:px-8">
        <Button asChild variant="outline" className="mb-5 rounded-full border-slate-200 bg-white/90 px-4 shadow-sm">
          <Link href="/tien-ich">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Quay lai tien ich
          </Link>
        </Button>

        <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_440px]">
          <Card className="overflow-hidden rounded-[34px] border-slate-200/80 bg-slate-950 text-white shadow-[0_28px_80px_rgba(15,23,42,0.16)]">
            <CardContent className="relative h-full overflow-hidden p-0">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(0,168,107,0.28),transparent_38%),radial-gradient(circle_at_bottom_right,rgba(0,85,165,0.24),transparent_42%)]" />
              <div className="relative flex h-full flex-col justify-between gap-8 p-6 sm:p-8">
                <div className="flex flex-wrap items-center gap-3 text-sm">
                  <span
                    className={cn(
                      "rounded-full px-4 py-2 font-semibold shadow-sm",
                      TYPE_COLORS[amenity.type],
                    )}
                  >
                    {TYPE_LABELS[amenity.type]}
                  </span>
                  <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-white/90">
                    <TrainFront className="h-4 w-4" />
                    {amenity.stationName}
                  </span>
                  <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-white/90">
                    <Navigation className="h-4 w-4" />
                    {formatDistance(amenity.distanceMeters)}
                  </span>
                </div>

                <div className="max-w-3xl">
                  <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl lg:text-[2.8rem]">
                    {amenity.name}
                  </h1>
                  <p className="mt-4 max-w-2xl text-sm leading-7 text-white/78 sm:text-base">
                    {amenity.overview}
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-[24px] border border-white/12 bg-white/8 p-4 backdrop-blur">
                    <p className="text-sm text-white/65">Loai</p>
                    <p className="mt-2 text-lg font-semibold">{TYPE_LABELS[amenity.type]}</p>
                  </div>
                  <div className="rounded-[24px] border border-white/12 bg-white/8 p-4 backdrop-blur">
                    <p className="text-sm text-white/65">Ket noi Metro</p>
                    <p className="mt-2 text-lg font-semibold">{amenity.stationName}</p>
                  </div>
                  <div className="rounded-[24px] border border-white/12 bg-white/8 p-4 backdrop-blur">
                    <p className="text-sm text-white/65">Khoang cach</p>
                    <p className="mt-2 text-lg font-semibold">{formatDistance(amenity.distanceMeters)}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="overflow-hidden rounded-[34px] border-slate-200/80 shadow-[0_24px_70px_rgba(15,23,42,0.08)]">
            <CardContent className="p-0">
              <div className="aspect-[4/5] w-full overflow-hidden bg-slate-100">
                {heroImage ? (
                  <img
                    src={heroImage}
                    alt={amenity.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center bg-slate-100 text-sm font-medium text-slate-500">
                    Hinh anh dang duoc cap nhat
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </section>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <SectionCard
            title="Tong quan dia diem"
            description="Thong tin nhanh giup ban danh gia xem diem dung nay co phu hop voi chang di Metro sap toi hay khong."
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <InfoRow
                icon={<MapPinned className="h-5 w-5" />}
                label="Dia chi"
                value={amenity.address || "Dang cap nhat"}
              />
              <InfoRow
                icon={<Clock3 className="h-5 w-5" />}
                label="Gio hoat dong"
                value={amenity.openingHours || "Dang cap nhat"}
              />
              <InfoRow
                icon={<TrainFront className="h-5 w-5" />}
                label="Ga lien quan"
                value={amenity.stationName}
              />
              <InfoRow
                icon={<Store className="h-5 w-5" />}
                label="Loai tien ich"
                value={TYPE_LABELS[amenity.type]}
              />
              {amenity.phone ? (
                <InfoRow
                  icon={<Phone className="h-5 w-5" />}
                  label="So dien thoai"
                  value={amenity.phone}
                />
              ) : null}
              <InfoRow
                icon={<Navigation className="h-5 w-5" />}
                label="Di chuyen tu ga"
                value={formatDistance(amenity.distanceMeters)}
              />
            </div>
          </SectionCard>

          <SectionCard
            title="Hanh dong nhanh"
            description="Mo ban do, website hoac kiem tra thong tin lien he ngay tu trang chi tiet."
          >
            <div className="flex flex-col gap-3">
              <Button asChild className="justify-between rounded-2xl px-5 py-6 text-left">
                <a href={mapsUrl} target="_blank" rel="noreferrer">
                  <span className="inline-flex items-center gap-2">
                    <Navigation className="h-4 w-4" />
                    Chi duong voi Google Maps
                  </span>
                  <ArrowUpRight className="h-4 w-4" />
                </a>
              </Button>

              {amenity.website ? (
                <Button asChild variant="outline" className="justify-between rounded-2xl px-5 py-6 text-left">
                  <a href={amenity.website} target="_blank" rel="noreferrer">
                    <span className="inline-flex items-center gap-2">
                      <ExternalLink className="h-4 w-4" />
                      Truy cap website
                    </span>
                    <ArrowUpRight className="h-4 w-4" />
                  </a>
                </Button>
              ) : null}

              <div className="rounded-[24px] bg-slate-50 p-4 text-sm leading-7 text-slate-600">
                {amenity.overview}
              </div>
            </div>
          </SectionCard>
        </div>

        <section className="mt-6 grid gap-6 lg:grid-cols-[1fr_380px]">
          <SectionCard
            title="Bo suu tap hinh anh"
            description="Cac hinh anh duoc dat trong khung co ti le co dinh de bo cuc on dinh va de xem hon."
          >
            <div className="grid gap-4 md:grid-cols-3">
              {amenity.featuredImages?.map((image, index) => (
                <div
                  key={`${amenity.id}-${index}`}
                  className="overflow-hidden rounded-[24px] border border-slate-200 bg-slate-100"
                >
                  <div className="aspect-[4/3] w-full overflow-hidden">
                    <img
                      src={image}
                      alt={`${amenity.name} ${index + 1}`}
                      className="h-full w-full object-cover transition duration-500 hover:scale-105"
                    />
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>

          <SectionCard
            title="Tom tat nhanh"
            description="Phu hop cho nguoi dung muon ra quyet dinh nhanh truoc khi roi ga."
          >
            <div className="space-y-4">
              <div className="rounded-[24px] bg-[#0055A5] px-5 py-4 text-white">
                <p className="text-sm text-white/75">Goi y</p>
                <p className="mt-2 text-lg font-semibold">Diem dung nay phu hop cho mot chang ghe nhanh quanh ga.</p>
              </div>
              <div className="rounded-[24px] bg-slate-50 px-5 py-4 text-sm leading-7 text-slate-600">
                Neu ban dang di Metro va can mot diem nghi chan, an uong hoac xu ly cong viec nhanh, day la lua chon de xem tiep.
              </div>
              <div className="inline-flex items-center gap-2 text-sm font-medium text-[#0055A5]">
                <ImageIcon className="h-4 w-4" />
                Anh va noi dung hien tai duoc toi uu de xem tot tren desktop va mobile.
              </div>
            </div>
          </SectionCard>
        </section>

        <section className="mt-6">
          <SectionCard
            title="Ban do 360 do"
            description="Khung ban do duoi day giup nguoi dung dinh huong nhanh khu vuc xung quanh tien ich."
          >
            <div className="overflow-hidden rounded-[24px] border border-slate-200 bg-slate-100">
              <div className="aspect-[16/9] w-full">
                <iframe
                  title={`360 ${amenity.name}`}
                  src={amenity.panoramaEmbedUrl}
                  className="h-full w-full"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  allowFullScreen
                />
              </div>
            </div>
          </SectionCard>
        </section>
      </div>
    </div>
  );
}
