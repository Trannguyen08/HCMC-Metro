import AmenityDetailPage from '@/features/metro/components/AmenityDetailPage';

export default function AmenityDetailRoute({
  params,
}: {
  params: { id: string };
}) {
  // Extract 36-char UUID from the combined string (the folder is named [id] now)
  const amenityId = params.id.substring(0, 36);
  return <AmenityDetailPage amenityId={amenityId} />;
}
