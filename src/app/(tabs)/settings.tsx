import { useRouter } from 'expo-router';
import { SettingsScreen } from '@/screens/SettingsScreen';
import { Member } from '@/types';

export default function SettingsRoute() {
  const router = useRouter();

  return (
    <SettingsScreen
      onAddMember={() => router.push('/member/new')}
      onEditMember={(member: Member) =>
        router.push({ pathname: '/member/new', params: { id: member.id } })
      }
    />
  );
}
