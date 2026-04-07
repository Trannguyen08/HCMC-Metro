import { AmenityMap } from "@/types/map";
import { X, Navigation, Star, Clock, MapPin } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

interface AmenityPopupProps {
  amenity: AmenityMap;
  onClose: () => void;
}

export function AmenityPopup({ amenity, onClose }: AmenityPopupProps) {
  return (
    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-sm bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden z-20 animate-in slide-in-from-bottom-8 duration-300">
      <div className="relative h-40 bg-slate-100">
        {amenity.image_url ? (
          <Image
            src={amenity.image_url}
            alt={amenity.name}
            fill
            className="object-cover"
          />
        ) : (
          <div className="w-full h-full flex flex-col justify-center items-center text-slate-400 bg-slate-100">
            <MapPin className="h-8 w-8 mb-2 opacity-50" />
            <span className="text-sm">Không có ảnh</span>
          </div>
        )}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 bg-white/20 hover:bg-white/40 backdrop-blur-md text-white p-1.5 rounded-full transition-colors"
        >
          <X className="h-5 w-5 drop-shadow-md" />
        </button>
        <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-sm px-2.5 py-1 rounded-full text-xs font-semibold text-primary shadow-sm flex items-center gap-1.5">
          <span 
            className="w-2 h-2 rounded-full inline-block" 
            style={{ backgroundColor: amenity.category_slug ? '#D97706' : '#2563EB' }}
          ></span>
          {amenity.category_name}
        </div>
      </div>

      <div className="p-5">
        <div className="flex justify-between items-start gap-3">
          <h3 className="font-bold text-lg text-slate-800 leading-tight">
            {amenity.name}
          </h3>
          {amenity.rating && (
            <div className="flex items-center gap-1 bg-amber-50 text-amber-600 px-2 py-1 rounded-lg text-sm font-semibold border border-amber-100">
              <Star className="h-3.5 w-3.5 fill-current" />
              {amenity.rating}
            </div>
          )}
        </div>

        <div className="mt-3 space-y-2 text-sm text-slate-600">
          <div className="flex items-start gap-2">
            <MapPin className="h-4 w-4 mt-0.5 shrink-0 text-slate-400" />
            <span className="line-clamp-2">{amenity.address}</span>
          </div>
          {amenity.opening_hours && (
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 shrink-0 text-slate-400" />
              <span>{amenity.opening_hours}</span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <Navigation className="h-4 w-4 shrink-0 text-slate-400" />
            <span>Cách ga {amenity.station_code || 'Metro'}: <strong className="text-slate-800">{amenity.distance_meters}m</strong></span>
          </div>
        </div>

        <div className="mt-5 flex gap-3">
          <Link
            href={`/tien-ich/${amenity.id}`}
            className="flex-1 text-center bg-slate-100 hover:bg-slate-200 text-slate-800 font-medium py-2.5 rounded-xl transition-colors"
          >
            Xem chi tiết
          </Link>
          <a
            href={`https://www.google.com/maps/dir/?api=1&destination=${amenity.latitude},${amenity.longitude}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 text-center bg-primary hover:bg-primary/90 text-white font-medium py-2.5 rounded-xl transition-colors shadow-sm flex items-center justify-center gap-2"
          >
            Dẫn đường
            <Navigation className="h-4 w-4" />
          </a>
        </div>
      </div>
    </div>
  );
}
