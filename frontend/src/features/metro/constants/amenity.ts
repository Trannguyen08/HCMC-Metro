import { AmenityType } from '@/types/amenity';

export const TYPE_LABELS: Record<Exclude<AmenityType, 'all'>, string> = {
  cafe: 'Ca phe',
  restaurant: 'Nha hang',
  shopping: 'Mua sam',
  hotel: 'Khach san',
  service: 'Dich vu',
};

export const TYPE_COLORS: Record<Exclude<AmenityType, 'all'>, string> = {
  cafe: 'bg-amber-100 text-amber-700',
  restaurant: 'bg-green-100 text-green-700',
  shopping: 'bg-pink-100 text-pink-700',
  hotel: 'bg-blue-100 text-blue-700',
  service: 'bg-slate-100 text-slate-700',
};
