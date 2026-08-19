import { useLocalSearchParams, useRouter } from 'expo-router';
import { MapScreen } from '@/screens/MapScreen';
import { Member } from '@/types';

export default function MapRoute() {
  const router = useRouter();
  const { focusMemberId } = useLocalSearchParams<{ focusMemberId?: string }>();

  return (
    <MapScreen
      onOpenMemberDetail={(member: Member) =>
        router.push({ pathname: '/member/[id]', params: { id: member.id } })
      }
      focusMemberId={focusMemberId}
    />
  );
}
