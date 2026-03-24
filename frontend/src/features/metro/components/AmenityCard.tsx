// src/features/metro/components/AmenityCard.tsx

import React from 'react';
import Link from 'next/link';
import { MapPin, Clock, Star, Train } from 'lucide-react';
import { Amenity } from '../../../types/amenity';
import { TYPE_COLORS, TYPE_LABELS } from '../constants/amenity';

interface AmenityCardProps {
  amenity: Amenity;
  onClick?: (amenity: Amenity) => void;
}

export const AmenityCard: React.FC<AmenityCardProps> = ({ amenity, onClick }) => {
  const [imgError, setImgError] = React.useState(false);
  const imageSource = amenity.thumbnailUrl || amenity.imageUrl;

  return (
    <Link
      href={`/tien-ich/${amenity.id}`}
      className="block overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition-shadow duration-200 hover:shadow-md"
      onClick={() => onClick?.(amenity)}
    >
      <div className="relative h-48 w-full overflow-hidden bg-gray-100">
        {!imgError ? (
          <img
            src={imageSource}
            alt={amenity.name}
            className="h-full w-full object-cover"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gray-200 text-4xl text-gray-400">
            Dia diem
          </div>
        )}
      </div>

      <div className="space-y-2 p-4">
        <div className="flex items-center justify-between">
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide ${
              TYPE_COLORS[amenity.type] ?? 'bg-gray-100 text-gray-600'
            }`}
          >
            {TYPE_LABELS[amenity.type] ?? amenity.type}
          </span>
          {amenity.rating && (
            <span className="flex items-center gap-1 text-sm font-medium text-amber-500">
              <Star className="h-3.5 w-3.5 fill-amber-400 stroke-amber-400" />
              {amenity.rating}
            </span>
          )}
        </div>

        <h3 className="line-clamp-1 text-[15px] font-bold leading-snug text-gray-900">
          {amenity.name}
        </h3>

        <div className="flex items-start gap-1.5 text-sm text-gray-500">
          <MapPin className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-gray-400" />
          <span className="line-clamp-2 leading-snug">{amenity.address}</span>
        </div>

        {amenity.openingHours && (
          <div className="flex items-center gap-1.5 text-sm text-gray-500">
            <Clock className="h-3.5 w-3.5 flex-shrink-0 text-gray-400" />
            <span>{amenity.openingHours}</span>
          </div>
        )}

        <div className="flex items-center justify-between border-t border-gray-50 pt-1">
          <div className="flex items-center gap-1.5 text-sm text-blue-600">
            <Train className="h-3.5 w-3.5" />
            <span className="font-medium">{amenity.stationName}</span>
          </div>
          {amenity.distanceMeters && (
            <span className="text-xs font-medium text-gray-400">
              {amenity.distanceMeters >= 1000
                ? `${(amenity.distanceMeters / 1000).toFixed(1)}km`
                : `${amenity.distanceMeters}m`}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
};
