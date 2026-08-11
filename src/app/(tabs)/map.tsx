import { useRouter } from 'expo-router';
import { MapScreen } from '@/screens/MapScreen';
import { Member } from '@/types';

export default function MapRoute() {
  const router = useRouter();

  return (
    <MapScreen
      onBack={() => router.back()}
      onOpenMemberDetail={(member: Member) =>
        router.push({ pathname: '/member/[id]', params: { id: member.id } })
      }
    />
  );
}
