import { useState } from "react";
import { AmenityMap } from "@/types/map";
import { Navigation, Star, Clock, MapPin } from "lucide-react";
import Link from "next/link";

interface AmenityPopupProps {
  amenity: AmenityMap;
  fullWidth?: boolean;
}

export function AmenityPopup({ amenity, fullWidth = false }: AmenityPopupProps) {
  const [imgError, setImgError] = useState(false);
  const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${amenity.latitude},${amenity.longitude}`;
  const imageUrl = amenity.image_url ? encodeURI(amenity.image_url) : null;

  return (
    <div className={`${fullWidth ? "w-full" : "w-[300px]"} bg-white rounded-xl overflow-hidden group`}>
      {/* Cover Image */}
      <div className="relative mb-4 h-44 w-full overflow-hidden rounded-xl bg-slate-100 border border-slate-100">
        {imageUrl && !imgError ? (
          <img
            src={imageUrl}
            alt={amenity.name}
            onError={() => setImgError(true)}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-1.5 text-slate-400">
            <MapPin className="h-8 w-8 opacity-40" />
            <span className="text-xs font-medium">{amenity.category_name}</span>
          </div>
        )}
        {amenity.rating ? (
          <div className="absolute right-2.5 top-2.5 flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1 text-xs font-bold text-amber-600 shadow-sm">
            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
            {amenity.rating}
          </div>
        ) : null}
      </div>

      {/* Info */}
      <div className="mb-4 space-y-2">
        <span className="inline-block rounded-md border border-slate-200/70 bg-slate-100 px-2.5 py-0.5 text-[11px] font-semibold text-slate-600">
          {amenity.category_name}
        </span>
        <h3 className="text-[17px] font-bold leading-snug text-slate-800">
          {amenity.name}
        </h3>
        {amenity.address ? (
          <div className="flex items-start gap-2 text-[13px] text-slate-600">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
            <span>{amenity.address}</span>
          </div>
        ) : null}
        {amenity.opening_hours ? (
          <div className="flex items-center gap-2 text-[13px] text-slate-600">
            <Clock className="h-4 w-4 shrink-0 text-slate-400" />
            <span>{amenity.opening_hours}</span>
          </div>
        ) : null}
        {amenity.distance_meters ? (
          <div className="text-[13px] text-slate-600">
            Cách ga Metro khoảng <span className="font-semibold text-slate-800">{amenity.distance_meters} m</span>
          </div>
        ) : null}
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <a
          href={googleMapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-[1.2] flex items-center justify-center gap-1.5 bg-[#2563EB] hover:bg-blue-700 !text-white text-[13px] font-bold py-2.5 rounded-xl transition-all shadow-md active:scale-95"
        >
          <Navigation className="h-4 w-4 fill-white/20" />
          Dẫn đường
        </a>
        <Link
          href={`/tien-ich/${amenity.id}-${amenity.slug}`}
          className="flex-1 flex items-center justify-center bg-[#F1F5F9] hover:bg-slate-200 text-[#0E7490] text-[13px] font-bold py-2.5 rounded-xl transition-all active:scale-95 border border-slate-200/50"
        >
          Xem chi tiết
        </Link>
      </div>
    </div>
  );
}
