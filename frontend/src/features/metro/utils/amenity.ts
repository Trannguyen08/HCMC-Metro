import { Amenity } from '@/types/amenity';

export function formatDistance(distanceMeters?: number) {
  if (!distanceMeters) {
    return 'ngay gan ga';
  }

  if (distanceMeters >= 1000) {
    return `${(distanceMeters / 1000).toFixed(1)} km`;
  }

  return `${distanceMeters} m`;
}

export function buildGoogleMapsUrl(amenity: Amenity) {
  const query = amenity.address || amenity.name;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

export function buildAmenityDetail(amenity: Amenity): Amenity {
  const heroImage = amenity.thumbnailUrl || amenity.imageUrl;

  return {
    ...amenity,
    thumbnailUrl: heroImage,
    overview:
      amenity.overview ||
      amenity.description ||
      `${amenity.name} la diem dung chan noi bat gan ${amenity.stationName}, phu hop de ghe tham khi di metro.`,
    featuredImages:
      amenity.featuredImages && amenity.featuredImages.length > 0
        ? amenity.featuredImages
        : [heroImage, amenity.imageUrl, heroImage].filter(Boolean) as string[],
    panoramaEmbedUrl:
      amenity.panoramaEmbedUrl ||
      `https://www.google.com/maps?q=${encodeURIComponent(amenity.address || amenity.name)}&output=embed`,
  };
}
