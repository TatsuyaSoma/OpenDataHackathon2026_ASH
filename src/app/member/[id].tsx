import { useLocalSearchParams, useRouter } from 'expo-router';
import { Text } from 'react-native';
import { CardDetailScreen } from '../../screens/CardDetailScreen';
import { mockMembers } from '../../data/mockData';

/**
 * /member/[id] ルート。
 * 現状はモックデータから id で検索しているが、実装時はグローバルなメンバー管理state
 * （Context / Zustand等）や、位置情報・環境データを取得するAPI呼び出しに置き換える想定。
 */
export default function MemberDetailRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const member = mockMembers.find((m) => m.id === id);

  if (!member) {
    return <Text>メンバーが見つかりませんでした（id: {id}）</Text>;
  }

  return (
    <CardDetailScreen
      member={member}
      onBack={() => router.back()}
      onOpenMap={() => router.push('/map')}
    />
  );
}
