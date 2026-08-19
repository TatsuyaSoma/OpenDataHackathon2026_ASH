import { useRouter } from 'expo-router';
import { HomeScreen } from '@/screens/HomeScreen';
import { Member } from '@/types';

export default function Index() {
  const router = useRouter();

  return (
    <HomeScreen
      onOpenMemberDetail={(member: Member) =>
        router.push({ pathname: '/member/[id]', params: { id: member.id } })
      }
      onOpenNotifications={() => router.push('/notifications')}
      onPressMemberLocation={(member: Member) =>
        router.push({ pathname: '/map', params: { focusMemberId: member.id } })
      }
    />
  );
}
