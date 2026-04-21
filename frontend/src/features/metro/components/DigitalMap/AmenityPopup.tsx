import { AmenityMap } from "@/types/map";
import { X, Navigation, Star, Clock, MapPin } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

interface AmenityPopupProps {
  amenity: AmenityMap;
  onClose: () => void;
}

export function AmenityPopup({ amenity }: { amenity: AmenityMap }) {
  const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${amenity.latitude},${amenity.longitude}`;

  return (
    <div className="w-[300px] bg-white rounded-xl overflow-hidden group">
      <div className="flex gap-4 p-1 items-start mb-4">
        {/* Thumbnail */}
        <div className="relative h-16 w-16 shrink-0 rounded-xl overflow-hidden bg-slate-100 shadow-sm border border-slate-50">
          {amenity.image_url ? (
            <Image
              src={amenity.image_url}
              alt={amenity.name}
              fill
              className="object-cover transition-transform group-hover:scale-110 duration-500"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-300">
              <MapPin className="h-6 w-6 opacity-30" />
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 pt-0.5">
          <h3 className="font-bold text-[16px] text-slate-800 leading-snug mb-1.5 line-clamp-2">
            {amenity.name}
          </h3>
          <span className="inline-block bg-slate-100 text-slate-500 text-[11px] px-2.5 py-0.5 rounded-md font-semibold tracking-tight border border-slate-200/50">
            {amenity.category_name}
          </span>
        </div>
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
