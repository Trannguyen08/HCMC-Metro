import React from "react";
import Link from "next/link";
import { ArrowUpRight, Clock3, MapPin, Navigation, Star, TrainFront } from "lucide-react";

import { TYPE_COLORS, TYPE_LABELS } from "@/features/metro/constants/amenity";
import { formatDistance } from "@/features/metro/utils/amenity";
import { Amenity } from "@/types/amenity";
import { TYPE_COLORS, TYPE_LABELS } from "@/features/metro/constants/amenity";
import { formatDistance } from "@/features/metro/utils/amenity";
import { Amenity } from "@/types/amenity";
import { cn } from "@/lib/utils";

interface AmenityCardProps {
  amenity: Amenity;
  onClick?: (amenity: Amenity) => void;
}

export const AmenityCard: React.FC<AmenityCardProps> = ({ amenity, onClick }) => {
  const [imgError, setImgError] = React.useState(false);
  const imageSource = amenity.thumbnailUrl || amenity.imageUrl;

  return (
    <Link
      href={`/tien-ich/${amenity.id}-${amenity.slug}`}
      onClick={() => onClick?.(amenity)}
      className="group flex h-full flex-col overflow-hidden rounded-[28px] border border-slate-200/80 bg-white shadow-[0_18px_45px_rgba(15,23,42,0.06)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_24px_60px_rgba(15,23,42,0.12)]"
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-100">
        {!imgError && imageSource ? (
          <img
            src={imageSource}
            alt={amenity.name}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-[radial-gradient(circle_at_top,#dbeafe,transparent_60%),linear-gradient(180deg,#e2e8f0_0%,#cbd5e1_100%)] px-6 text-center text-sm font-medium text-slate-500">
            Hình ảnh đang được cập nhật
          </div>
        )}

        <div className="absolute inset-x-0 top-0 flex items-start justify-between p-4">
          <span
            className={cn(
              "rounded-full px-3 py-1 text-xs font-semibold shadow-sm backdrop-blur",
              TYPE_COLORS[amenity.type] ?? "bg-slate-100 text-slate-700",
            )}
          >
            {TYPE_LABELS[amenity.type]}
          </span>

          {amenity.rating ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-white/92 px-3 py-1 text-xs font-semibold text-slate-700 shadow-sm">
              <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
              {amenity.rating.toFixed(1)}
            </span>
          ) : null}
        </div>

        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/70 via-slate-900/20 to-transparent px-4 pb-4 pt-10">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/12 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm">
            <TrainFront className="h-3.5 w-3.5" />
            {amenity.stationName}
          </div>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-4 p-5">
        <div className="space-y-2">
          <div className="flex items-start justify-between gap-3">
            <h3 className="line-clamp-2 text-lg font-semibold leading-tight text-slate-900">
              {amenity.name}
            </h3>
            <ArrowUpRight className="mt-0.5 h-4 w-4 flex-shrink-0 text-slate-300 transition-colors group-hover:text-[#0055A5]" />
          </div>

          <div className="flex items-start gap-2 text-sm leading-6 text-slate-500">
            <MapPin className="mt-1 h-4 w-4 flex-shrink-0 text-slate-400" />
            <span className="line-clamp-2">{amenity.address || "---"}</span>
          </div>
        </div>

        <div className="grid gap-2 rounded-2xl bg-slate-50 p-3 text-sm text-slate-600">
          <div className="flex items-center justify-between gap-3">
            <span className="inline-flex items-center gap-2">
              <Navigation className="h-4 w-4 text-[#0055A5]" />
              Khoảng cách
            </span>
            <span className="font-medium text-slate-900">{formatDistance(amenity.distanceMeters)}</span>
          </div>

          <div className="flex items-center justify-between gap-3">
            <span className="inline-flex items-center gap-2">
              <Clock3 className="h-4 w-4 text-[#00A86B]" />
              Giờ mở cửa
            </span>
            <span className="line-clamp-1 text-right font-medium text-slate-900">
              {amenity.openingHours || "---"}
            </span>
          </div>
        </div>

        <div className="mt-auto flex items-center justify-between border-t border-slate-100 pt-4 text-sm">
          <span className="font-medium text-slate-900">Xem chi tiết</span>
          <span className="text-slate-400 transition-colors group-hover:text-[#0055A5]">
            Phù hợp khi đi metro
          </span>
        </div>
      </div>
    </Link>
  );
};


