'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  CreditCard,
  ExternalLink,
  Globe,
  Map,
  MapPin,
  Navigation,
  Phone,
  ShieldCheck,
  Sparkles,
  Star,
  TrainFront,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { TYPE_COLORS, TYPE_LABELS } from '@/features/metro/constants/amenity';
import { fetchAmenities, fetchAmenityDetail } from '@/features/metro/services/AmenityService';
import { buildGoogleMapsUrl, formatDistance } from '@/features/metro/utils/amenity';
import { toast } from '@/store/use-toast-store';
import { Amenity } from '@/types/amenity';

interface AmenityDetailPageProps {
  amenityId: string;
}

const FALLBACK_IMAGE = '/images/amenities/7-eleven.jpg';

export default function AmenityDetailPage({ amenityId }: AmenityDetailPageProps) {
  const [amenity, setAmenity] = useState<Amenity | null>(null);
  const [nearbyAmenities, setNearbyAmenities] = useState<Amenity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [imgSrc, setImgSrc] = useState<string>(FALLBACK_IMAGE);
  const [copiedAddress, setCopiedAddress] = useState(false);

  useEffect(() => {
    let active = true;
    const loadDetail = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await fetchAmenityDetail(amenityId);
        if (!active) return;
        setAmenity(data);
        if (data?.imageUrl || data?.thumbnailUrl) {
          setImgSrc(data.imageUrl || data.thumbnailUrl || FALLBACK_IMAGE);
        }
        if (data?.stationId) {
          fetchAmenities({ stationId: data.stationId })
            .then((res) => {
              if (!active) return;
              const others = (res.data || []).filter((item) => item.id !== data.id).slice(0, 3);
              setNearbyAmenities(others);
            })
            .catch(() => {
              if (active) setNearbyAmenities([]);
            });
        }
      } catch {
        if (!active) return;
        setError('Không thể tải thông tin chi tiết tiện ích.');
      } finally {
        if (active) setLoading(false);
      }
    };
    loadDetail();
    return () => {
      active = false;
    };
  }, [amenityId]);

  const handleCopyAddress = async () => {
    if (!amenity?.address) return;
    try {
      await navigator.clipboard.writeText(amenity.address);
      setCopiedAddress(true);
      toast.success('Đã sao chép địa chỉ tiện ích.');
      setTimeout(() => setCopiedAddress(false), 2000);
    } catch {
      toast.error('Không thể sao chép địa chỉ.');
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl space-y-6 px-4 py-8">
        <Skeleton className="h-10 w-44 rounded-full" />
        <div className="grid gap-6 lg:grid-cols-12">
          <Skeleton className="aspect-[16/10] w-full rounded-[28px] lg:col-span-7" />
          <Skeleton className="h-[400px] w-full rounded-[28px] lg:col-span-5" />
        </div>
        <Skeleton className="h-56 w-full rounded-[28px]" />
      </div>
    );
  }

  if (error || !amenity) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <Card className="rounded-[28px] border-slate-200 p-8 shadow-sm">
          <h1 className="text-2xl font-bold text-slate-900">Không tìm thấy tiện ích</h1>
          <p className="mt-2 text-sm text-slate-500">
            {error || 'Tiện ích này hiện không khả dụng hoặc đã được di chuyển.'}
          </p>
          <Button asChild className="mt-6 rounded-full px-6">
            <Link href="/tien-ich">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Quay lại danh sách tiện ích
            </Link>
          </Button>
        </Card>
      </div>
    );
  }

  const googleMapsUrl = buildGoogleMapsUrl(amenity);
  const typeLabel = TYPE_LABELS[amenity.type] || 'Dịch vụ';
  const typeColor = TYPE_COLORS[amenity.type] || 'bg-slate-100 text-slate-700';
  const walkingMinutes = Math.max(1, Math.round((amenity.distanceMeters || 100) / 75));

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f5f9ff_0%,#ffffff_38%)] pb-16">
      <div className="mx-auto max-w-6xl space-y-8 px-4 pt-6">
        {/* Top bar */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Button
            asChild
            variant="outline"
            className="rounded-full border-slate-200 bg-white px-4 text-slate-700 shadow-sm hover:bg-slate-50"
          >
            <Link href="/tien-ich">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Quay lại tiện ích
            </Link>
          </Button>

          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Link href="/tien-ich" className="hover:text-[#0055A5]">
              Tiện ích quanh Ga
            </Link>
            <span>/</span>
            <span className="max-w-[240px] truncate font-medium text-slate-800">{amenity.name}</span>
          </div>
        </div>

        {/* Hero Section: Balanced 7-5 Grid */}
        <section className="grid gap-6 lg:grid-cols-12 lg:items-stretch">
          {/* Left: Verified Photo + Badges */}
          <div className="relative overflow-hidden rounded-[30px] border border-slate-200/80 bg-slate-100 shadow-[0_20px_55px_rgba(15,23,42,0.08)] lg:col-span-7">
            <div className="aspect-[16/10] h-full w-full">
              <img
                src={encodeURI(imgSrc)}
                alt={amenity.name}
                onError={() => {
                  if (imgSrc !== FALLBACK_IMAGE) setImgSrc(FALLBACK_IMAGE);
                }}
                className="h-full w-full object-cover"
              />
            </div>
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-950/65 via-transparent to-slate-950/15" />

            <div className="absolute left-5 right-5 top-5 flex flex-wrap items-center justify-between gap-2">
              <span className={`inline-flex items-center rounded-full px-3.5 py-1.5 text-xs font-semibold shadow-sm ${typeColor}`}>
                {typeLabel}
              </span>
              {amenity.rating ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/95 px-3.5 py-1.5 text-xs font-bold text-slate-900 shadow-sm">
                  <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                  {Number(amenity.rating).toFixed(1)} / 5.0
                </span>
              ) : null}
            </div>

            <div className="absolute bottom-5 left-5 right-5 flex flex-wrap items-center gap-2.5 text-xs text-white">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-950/75 px-3.5 py-1.5 font-medium backdrop-blur-md">
                <TrainFront className="h-4 w-4 text-sky-300" />
                Gần Ga {amenity.stationName}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#0055A5]/90 px-3.5 py-1.5 font-medium backdrop-blur-md">
                <Navigation className="h-3.5 w-3.5" />
                Cách ga {formatDistance(amenity.distanceMeters)} (~{walkingMinutes} phút đi bộ)
              </span>
            </div>
          </div>

          {/* Right: Complete Info Summary Card */}
          <Card className="flex flex-col justify-between rounded-[30px] border-slate-200/80 bg-white shadow-[0_20px_55px_rgba(15,23,42,0.06)] lg:col-span-5">
            <CardContent className="flex h-full flex-col justify-between gap-5 p-6 sm:p-7">
              <div className="space-y-4">
                <div>
                  <div className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[#0055A5]">
                    <Sparkles className="h-3.5 w-3.5" />
                    Điểm dừng chân tuyến Metro Số 1
                  </div>
                  <h1 className="mt-2 text-2xl font-bold leading-snug tracking-tight text-slate-950 sm:text-3xl">
                    {amenity.name}
                  </h1>
                </div>

                {/* Quick Highlight Metrics */}
                <div className="grid grid-cols-3 gap-2.5">
                  <div className="rounded-2xl border border-slate-100 bg-slate-50/90 p-3">
                    <p className="text-[11px] font-medium text-slate-400">Loại hình</p>
                    <p className="mt-0.5 truncate text-xs font-bold text-slate-900">{typeLabel}</p>
                  </div>
                  <div className="rounded-2xl border border-slate-100 bg-slate-50/90 p-3">
                    <p className="text-[11px] font-medium text-slate-400">Ga kết nối</p>
                    <p className="mt-0.5 truncate text-xs font-bold text-[#0055A5]">{amenity.stationName}</p>
                  </div>
                  <div className="rounded-2xl border border-slate-100 bg-slate-50/90 p-3">
                    <p className="text-[11px] font-medium text-slate-400">Khoảng cách</p>
                    <p className="mt-0.5 truncate text-xs font-bold text-emerald-700">{formatDistance(amenity.distanceMeters)}</p>
                  </div>
                </div>

                <div className="space-y-3.5 rounded-2xl border border-slate-100 bg-slate-50/80 p-4 text-sm">
                  <div className="flex items-start gap-3">
                    <Clock className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                    <div>
                      <p className="text-xs font-medium text-slate-400">Giờ mở cửa</p>
                      <p className="font-semibold text-slate-900">
                        {amenity.openingHours || 'Mở cửa hàng ngày (06:00 - 22:30)'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-3">
                      <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#0055A5]" />
                      <div>
                        <p className="text-xs font-medium text-slate-400">Địa chỉ chi tiết</p>
                        <p className="font-medium text-slate-800">{amenity.address}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleCopyAddress}
                      title="Sao chép địa chỉ"
                      className="mt-1 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:border-[#0055A5]/40 hover:text-[#0055A5]"
                    >
                      {copiedAddress ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                    </button>
                  </div>

                  <div className="flex items-start gap-3">
                    <Phone className="mt-0.5 h-4 w-4 shrink-0 text-sky-600" />
                    <div>
                      <p className="text-xs font-medium text-slate-400">Hotline / Liên hệ</p>
                      {amenity.phone ? (
                        <a
                          href={`tel:${amenity.phone.replace(/\s+/g, '')}`}
                          className="font-semibold text-[#0055A5] hover:underline"
                        >
                          {amenity.phone}
                        </a>
                      ) : (
                        <p className="text-slate-600">Đang cập nhật</p>
                      )}
                    </div>
                  </div>

                  {amenity.website ? (
                    <div className="flex items-start gap-3">
                      <Globe className="mt-0.5 h-4 w-4 shrink-0 text-indigo-600" />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium text-slate-400">Website chính thức</p>
                        <a
                          href={amenity.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex max-w-full items-center gap-1 truncate font-medium text-[#0055A5] hover:underline"
                        >
                          <span className="truncate">{amenity.website.replace(/^https?:\/\//, '')}</span>
                          <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                        </a>
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>

              <div className="flex flex-col gap-2.5 sm:flex-row">
                <Button asChild className="flex-1 rounded-2xl bg-[#0055A5] py-5 text-sm font-semibold hover:bg-[#004488]">
                  <a href={googleMapsUrl} target="_blank" rel="noopener noreferrer">
                    <Navigation className="mr-2 h-4 w-4" />
                    Chỉ đường Google Maps
                  </a>
                </Button>
                <Button asChild variant="outline" className="rounded-2xl border-slate-200 py-5 text-sm font-semibold">
                  <Link href="/ban-do-so">
                    <Map className="mr-2 h-4 w-4" />
                    Bản đồ số
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Detailed Overview + Highlights + Embedded Map */}
        <section className="grid gap-6 lg:grid-cols-12">
          <Card className="rounded-[28px] border-slate-200/80 bg-white shadow-sm lg:col-span-7">
            <CardContent className="space-y-5 p-6 sm:p-8">
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-xl font-bold text-slate-950">Giới thiệu & Trải nghiệm hành khách</h2>
                <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                  Xác thực vị trí quanh ga
                </span>
              </div>

              <p className="text-sm leading-7 text-slate-600 sm:text-base">
                {amenity.description || amenity.overview}
              </p>

              <div className="grid gap-3 pt-2 sm:grid-cols-2">
                <div className="flex items-start gap-3 rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Tiếp cận ga siêu nhanh</p>
                    <p className="mt-0.5 text-xs leading-relaxed text-slate-500">
                      Chỉ cách Ga {amenity.stationName} khoảng {formatDistance(amenity.distanceMeters)} ({walkingMinutes} phút đi bộ), thuận tiện ghé qua trước khi lên tàu.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
                  <CreditCard className="mt-0.5 h-5 w-5 shrink-0 text-[#0055A5]" />
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Hỗ trợ thanh toán số</p>
                    <p className="mt-0.5 text-xs leading-relaxed text-slate-500">
                      Hỗ trợ thanh toán không tiền mặt, QR PayOS, ví điện tử và thẻ ngân hàng tiện lợi.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
                  <Clock className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Đồng bộ khung giờ Metro</p>
                    <p className="mt-0.5 text-xs leading-relaxed text-slate-500">
                      Phù hợp cho hành khách di chuyển trong khung giờ tàu chạy 05:00 – 23:00 hằng ngày.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
                  <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-indigo-600" />
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Thông tin chuẩn hóa</p>
                    <p className="mt-0.5 text-xs leading-relaxed text-slate-500">
                      Dữ liệu địa chỉ, giờ mở cửa và tọa độ được đồng bộ trực tiếp với bản đồ số HCMC Metro.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="overflow-hidden rounded-[28px] border-slate-200/80 bg-white shadow-sm lg:col-span-5">
            <CardContent className="flex h-full flex-col justify-between p-6">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-lg font-bold text-slate-950">Vị trí quanh Ga {amenity.stationName}</h2>
                <a
                  href={googleMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-[#0055A5] hover:underline"
                >
                  Mở bản đồ lớn
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-100">
                <iframe
                  title={`Bản đồ ${amenity.name}`}
                  src={amenity.panoramaEmbedUrl}
                  className="h-[290px] w-full border-0"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Nearby Amenities at the Same Station */}
        {nearbyAmenities.length > 0 && (
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-950">
                  Tiện ích khác gần Ga {amenity.stationName}
                </h2>
                <p className="text-sm text-slate-500">
                  Khám phá thêm điểm dừng chân cùng khu vực nhà ga
                </p>
              </div>
              <Link
                href="/tien-ich"
                className="inline-flex items-center gap-1 text-sm font-semibold text-[#0055A5] hover:underline"
              >
                Xem tất cả
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="grid gap-5 md:grid-cols-3">
              {nearbyAmenities.map((item) => {
                const itemPhoto = item.imageUrl || item.thumbnailUrl || FALLBACK_IMAGE;
                const itemTypeLabel = TYPE_LABELS[item.type] || 'Dịch vụ';
                const itemTypeColor = TYPE_COLORS[item.type] || 'bg-slate-100 text-slate-700';
                return (
                  <Link
                    key={item.id}
                    href={`/tien-ich/${item.id}`}
                    className="group overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
                  >
                    <div className="relative aspect-[16/10] w-full overflow-hidden bg-slate-100">
                      <img
                        src={encodeURI(itemPhoto)}
                        alt={item.name}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <span className={`absolute left-3 top-3 rounded-full px-2.5 py-1 text-[11px] font-semibold shadow-sm ${itemTypeColor}`}>
                        {itemTypeLabel}
                      </span>
                    </div>
                    <div className="space-y-1.5 p-4">
                      <h3 className="line-clamp-1 text-base font-bold text-slate-900 group-hover:text-[#0055A5]">
                        {item.name}
                      </h3>
                      <p className="line-clamp-1 text-xs text-slate-500">{item.address}</p>
                      <div className="flex items-center justify-between pt-1 text-xs font-semibold text-[#0055A5]">
                        <span>Cách ga {formatDistance(item.distanceMeters)}</span>
                        <span className="inline-flex items-center gap-1">
                          Chi tiết <ArrowRight className="h-3.5 w-3.5" />
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
