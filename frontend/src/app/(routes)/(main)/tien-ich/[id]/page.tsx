import AmenityDetailPage from '@/features/metro/components/AmenityDetailPage';

export default function AmenityDetailRoute({
  params,
}: {
  params: { id: string };
}) {
  return <AmenityDetailPage amenityId={params.id} />;
}
