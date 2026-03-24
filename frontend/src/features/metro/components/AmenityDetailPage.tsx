'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Clock3,
  ExternalLink,
  Image as ImageIcon,
  MapPinned,
  Navigation,
  Phone,
  TrainFront,
} from 'lucide-react';

import { TYPE_COLORS, TYPE_LABELS } from '@/features/metro/constants/amenity';
import { fetchAmenityDetail } from '@/features/metro/services/AmenityService';
import { buildGoogleMapsUrl, formatDistance } from '@/features/metro/utils/amenity';
import { Amenity } from '@/types/amenity';

interface AmenityDetailPageProps {
  amenityId: string;
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-xl font-semibold text-slate-900">{title}</h2>
      <div className="mt-4 text-sm leading-7 text-slate-600">{children}</div>
    </section>
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
          setError('Khong tim thay tien ich.');
          return;
        }

        setAmenity(response);
      } catch (err) {
        if (!active) return;
        setError(err instanceof Error ? err.message : 'Khong the tai chi tiet tien ich.');
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadDetail();

    return () => {
      active = false;
    };
  }, [amenityId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[linear-gradient(180deg,#f8fafc_0%,#edf2f7_100%)] px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-[1440px] animate-pulse space-y-6">
          <div className="h-[70vh] min-h-[420px] rounded-[40px] bg-slate-200" />
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="h-64 rounded-[28px] bg-slate-200" />
            <div className="h-64 rounded-[28px] bg-slate-200" />
          </div>
          <div className="h-72 rounded-[28px] bg-slate-200" />
          <div className="h-[420px] rounded-[28px] bg-slate-200" />
        </div>
      </div>
    );
  }

  if (error || !amenity) {
    return (
      <div className="min-h-screen bg-slate-50 px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl rounded-[28px] border border-red-100 bg-white p-8 text-center shadow-sm">
          <p className="text-lg font-semibold text-slate-900">{error || 'Khong tim thay tien ich.'}</p>
          <Link
            href="/tien-ich"
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-slate-900 px-5 py-3 text-sm font-medium text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Quay lai danh sach
          </Link>
        </div>
      </div>
    );
  }

  const mapsUrl = buildGoogleMapsUrl(amenity);

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f8fafc_0%,#edf2f7_100%)] pb-16">
      <div className="mx-auto max-w-[1440px] px-4 pt-6 sm:px-6 lg:px-8">
        <Link
          href="/tien-ich"
          className="mb-4 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/90 px-4 py-2 text-sm font-medium text-slate-700 shadow-sm backdrop-blur"
        >
          <ArrowLeft className="h-4 w-4" />
          Quay lai tien ich
        </Link>

        <section className="relative overflow-hidden rounded-[40px] bg-slate-900 shadow-[0_30px_80px_rgba(15,23,42,0.18)]">
          <div className="absolute inset-0">
            <img
              src={amenity.thumbnailUrl || amenity.imageUrl}
              alt={amenity.name}
              className="h-[72vh] min-h-[420px] w-full object-cover"
            />
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(15,23,42,0.08)_0%,rgba(15,23,42,0.70)_60%,rgba(15,23,42,0.92)_100%)]" />
          </div>

          <div className="relative flex min-h-[72vh] items-end p-6 sm:p-8 lg:p-12">
            <div className="w-full max-w-4xl rounded-[32px] border border-white/15 bg-white/10 p-6 text-white backdrop-blur-md sm:p-8">
              <div className="flex flex-wrap items-center gap-3 text-sm">
                <span className={`rounded-full px-4 py-2 font-semibold ${TYPE_COLORS[amenity.type]}`}>
                  {TYPE_LABELS[amenity.type]}
                </span>
                <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2">
                  <TrainFront className="h-4 w-4" />
                  Gan {amenity.stationName}
                </span>
                <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2">
                  <Navigation className="h-4 w-4" />
                  Cach ga {formatDistance(amenity.distanceMeters)}
                </span>
              </div>

              <h1 className="mt-5 text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
                {amenity.name}
              </h1>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-white/85 sm:text-base">
                {amenity.overview}
              </p>
            </div>
          </div>
        </section>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1.25fr_1fr]">
          <SectionCard title="Gioi thieu">
            <p>{amenity.overview}</p>
          </SectionCard>

          <SectionCard title="Thong tin lien he">
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <MapPinned className="mt-1 h-5 w-5 text-slate-400" />
                <div>
                  <p className="font-medium text-slate-900">Dia chi</p>
                  <p>{amenity.address}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Clock3 className="mt-1 h-5 w-5 text-slate-400" />
                <div>
                  <p className="font-medium text-slate-900">Gio hoat dong</p>
                  <p>{amenity.openingHours || 'Dang cap nhat'}</p>
                </div>
              </div>

              {amenity.phone && (
                <div className="flex items-start gap-3">
                  <Phone className="mt-1 h-5 w-5 text-slate-400" />
                  <div>
                    <p className="font-medium text-slate-900">So dien thoai</p>
                    <p>{amenity.phone}</p>
                  </div>
                </div>
              )}

              <div className="flex flex-wrap gap-3 pt-2">
                <a
                  href={mapsUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-5 py-3 text-sm font-medium text-white"
                >
                  <Navigation className="h-4 w-4" />
                  Chi duong Google Maps
                </a>

                {amenity.website && (
                  <a
                    href={amenity.website}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-medium text-slate-700"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Website
                  </a>
                )}
              </div>
            </div>
          </SectionCard>
        </div>

        <section className="mt-8 rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <ImageIcon className="h-5 w-5 text-slate-400" />
            <h2 className="text-xl font-semibold text-slate-900">Hinh anh noi bat</h2>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-3">
            {amenity.featuredImages?.map((image, index) => (
              <div key={`${amenity.id}-${index}`} className="overflow-hidden rounded-[24px] bg-slate-100">
                <img
                  src={image}
                  alt={`${amenity.name} ${index + 1}`}
                  className="h-64 w-full object-cover transition-transform duration-300 hover:scale-105"
                />
              </div>
            ))}
          </div>
        </section>

        <section className="mt-8 rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-900">Tham quan khong gian 360 do</h2>
          <p className="mt-2 text-sm leading-7 text-slate-600">
            Day la khung nhin nhanh khu vuc xung quanh tien ich de nguoi dung de dinh huong tu ga metro.
          </p>
          <div className="mt-5 overflow-hidden rounded-[24px] border border-slate-200 bg-slate-100">
            <iframe
              title={`360 ${amenity.name}`}
              src={amenity.panoramaEmbedUrl}
              className="h-[420px] w-full"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              allowFullScreen
            />
          </div>
        </section>
      </div>
    </div>
  );
}
