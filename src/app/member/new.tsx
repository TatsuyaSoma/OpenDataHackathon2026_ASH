import { useLocalSearchParams, useRouter } from 'expo-router';
import { MemberFormScreen } from '@/screens/MemberFormScreen';
import { useMembers } from '@/context/MembersContext';

/**
 * /member/new ルート。
 * id パラメータが無ければ新規登録、あれば該当メンバーの編集として扱う
 * （設定画面のメンバ一覧タップからは id 付きで遷移してくる）。
 */
export default function MemberFormRoute() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const router = useRouter();
  const { getMemberById, addMember, updateMember, removeMember } = useMembers();
  const initialMember = id ? getMemberById(id) : undefined;

  return (
    <MemberFormScreen
      initialMember={initialMember}
      // Web版はページ再読み込み後にrouter.back()が機能しないことがあるため、
      // 確実に遷移できるよう戻り先を明示してreplaceする
      onBack={() => router.replace('/settings')}
      onSubmit={(member) => (initialMember ? updateMember(member) : addMember(member))}
      onDelete={(member) => {
        removeMember(member.id);
        router.replace('/settings');
      }}
    />
  );
}
