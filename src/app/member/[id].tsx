import { useLocalSearchParams, useRouter } from 'expo-router';
import { Text } from 'react-native';
import { CardDetailScreen } from '../../screens/CardDetailScreen';
import { useMembers } from '../../context/MembersContext';
import { RiskLevel } from '../../types';

/**
 * /member/[id] ルート。
 * MembersContext からメンバー情報を取得するため、設定画面での編集内容もそのまま反映される。
 *
 * 通知履歴から遷移した場合は snapshot* パラメータで通知発生時点の危険度・位置・時刻を受け取り、
 * 現在の状態ではなく「その通知が出た瞬間」の情報として上書き表示する。
 */
export default function MemberDetailRoute() {
  const { id, snapshotTime, snapshotRisk, snapshotLocation } = useLocalSearchParams<{
    id: string;
    snapshotTime?: string;
    snapshotRisk?: string;
    snapshotLocation?: string;
  }>();
  const router = useRouter();
  const { getMemberById } = useMembers();
  const member = getMemberById(id);

  if (!member) {
    return <Text>メンバーが見つかりませんでした（id: {id}）</Text>;
  }

  const displayMember = snapshotRisk
    ? {
        ...member,
        riskLevel: snapshotRisk as RiskLevel,
        lastUpdated: snapshotTime ?? member.lastUpdated,
        location: {
          ...member.location,
          address: snapshotLocation ?? member.location.address,
        },
      }
    : member;

  const historicalNotice = snapshotRisk
    ? `これは${snapshotTime ?? ''}時点の通知内容です。現在の状況とは異なる場合があります。`
    : undefined;

  return (
    <CardDetailScreen
      member={displayMember}
      historicalNotice={historicalNotice}
      onOpenMap={() => router.push({ pathname: '/map', params: { focusMemberId: member.id } })}
    />
  );
}
