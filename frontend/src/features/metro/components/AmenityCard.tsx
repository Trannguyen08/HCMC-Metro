'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Clock, MapPin, Navigation, Phone, Star, TrainFront, ArrowUpRight } from 'lucide-react';
import { Amenity } from '@/types/amenity';
import { TYPE_COLORS, TYPE_LABELS } from '@/features/metro/constants/amenity';
import { formatDistance } from '@/features/metro/utils/amenity';

interface AmenityCardProps {
  amenity: Amenity;
  onClick?: (amenity: Amenity) => void;
}

const FALLBACK_IMAGE = '/images/amenities/7-eleven.jpg';

export const AmenityCard: React.FC<AmenityCardProps> = ({ amenity, onClick }) => {
  const [imgSrc, setImgSrc] = useState(amenity.imageUrl || FALLBACK_IMAGE);

  return (
    <Link
      href={`/tien-ich/${amenity.id}`}
      onClick={() => onClick?.(amenity)}
      className="group flex h-full flex-col overflow-hidden rounded-[26px] border border-slate-200/85 bg-white shadow-[0_10px_35px_rgba(15,23,42,0.04)] transition-all duration-300 hover:-translate-y-1 hover:border-[#0055A5]/30 hover:shadow-[0_20px_50px_rgba(0,85,165,0.1)]"
    >
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-slate-100">
        <img
          src={encodeURI(imgSrc)}
          alt={amenity.name}
          onError={() => {
            if (imgSrc !== FALLBACK_IMAGE) setImgSrc(FALLBACK_IMAGE);
          }}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-950/55 via-slate-950/10 to-transparent" />

        <div className="absolute left-3.5 right-3.5 top-3.5 flex items-center justify-between gap-2">
          <span
            className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold shadow-sm backdrop-blur-md ${
              TYPE_COLORS[amenity.type] || 'bg-slate-100 text-slate-700'
            }`}
          >
            {TYPE_LABELS[amenity.type] || 'Dịch vụ'}
          </span>

          {amenity.rating ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1 text-xs font-bold text-slate-900 shadow-sm">
              <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
              {Number(amenity.rating).toFixed(1)}
            </span>
          ) : null}
        </div>

        <div className="absolute bottom-3 left-3.5 right-3.5 flex items-center justify-between gap-2 text-xs text-white">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-950/70 px-3 py-1 font-medium backdrop-blur-md">
            <TrainFront className="h-3.5 w-3.5 text-sky-300" />
            Ga {amenity.stationName}
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-white/20 px-2.5 py-1 font-medium backdrop-blur-md">
            <Navigation className="h-3 w-3" />
            {formatDistance(amenity.distanceMeters)}
          </span>
        </div>
      </div>

      <div className="flex flex-1 flex-col justify-between p-5">
        <div className="space-y-3">
          <h3 className="line-clamp-2 text-lg font-bold leading-snug text-slate-900 transition-colors group-hover:text-[#0055A5]">
            {amenity.name}
          </h3>

          {amenity.description ? (
            <p className="line-clamp-2 text-xs leading-relaxed text-slate-500">
              {amenity.description}
            </p>
          ) : null}

          <div className="space-y-1.5 pt-1 text-xs text-slate-600">
            <div className="flex items-start gap-2">
              <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#0055A5]" />
              <span className="line-clamp-2">{amenity.address}</span>
            </div>

            {amenity.openingHours ? (
              <div className="flex items-center gap-2">
                <Clock className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
                <span className="truncate font-medium text-slate-700">{amenity.openingHours}</span>
              </div>
            ) : null}

            {amenity.phone ? (
              <div className="flex items-center gap-2">
                <Phone className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                <span>{amenity.phone}</span>
              </div>
            ) : null}
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3.5 text-xs font-semibold text-[#0055A5]">
          <span>Xem thông tin đầy đủ</span>
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-slate-50 transition-colors group-hover:bg-[#0055A5] group-hover:text-white">
            <ArrowUpRight className="h-4 w-4" />
          </span>
        </div>
      </div>
    </Link>
  );
};
