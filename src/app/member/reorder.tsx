import { useRouter } from 'expo-router';
import { useMembers } from '@/context/MembersContext';
import { MemberReorderScreen } from '@/screens/MemberReorderScreen';

/**
 * /member/reorder ルート。設定画面「メンバの並び順を変更」からの遷移先。
 */
export default function MemberReorderRoute() {
  const router = useRouter();
  const { members, reorderMembers } = useMembers();

  return (
    <MemberReorderScreen
      members={members}
      onBack={() => router.back()}
      onReorder={reorderMembers}
    />
  );
}
