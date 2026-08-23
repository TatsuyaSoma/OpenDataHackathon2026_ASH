import { History } from 'lucide-react-native';
import React, { useState } from 'react';
import {
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BasicInfoCard } from '../components/BasicInfoCard';
import { DetailMemberHeader } from '../components/DetailMemberHeader';
import { EnvironmentStatsGrid } from '../components/EnvironmentStatsGrid';
import { MapPreviewCard } from '../components/MapPreviewCard';
import { MissionCard } from '../components/MissionCard';
import { QuickReplyBar } from '../components/QuickReplyBar';
import { RestStatusBanner } from '../components/RestStatusBanner';
import { RiskLevelPanel } from '../components/RiskLevelPanel';
import { colors, radius, spacing } from '../constants/theme';
import { useMembers } from '../context/MembersContext';
import { Member } from '../types';
import { showAlert } from '../utils/crossPlatformAlert';

interface Props {
  member: Member;
  historicalNotice?: string; // 通知履歴から遷移した場合など、過去時点のスナップショットであることを示す注記
  onOpenMap?: (member: Member) => void;
}

export const CardDetailScreen: React.FC<Props> = ({ member, historicalNotice, onOpenMap }) => {
  const { toggleResting } = useMembers();

  // お休み解除をこの画面上で即座に反映できるよう、ローカルstateとして保持
  // （実際にはサーバー/位置情報サービスへの反映後、上位のstateも更新する想定）
  const [isResting, setIsResting] = useState(member.isResting);

  const handleReleaseRest = () => {
    toggleResting(member.id);
    setIsResting(false);
  };

  const handleCheckIn = () => {
    showAlert('送信しました', `${member.name}に「大丈夫？」を送りました。`);
  };

  const handleImFine = () => {
    showAlert('送信しました', `${member.name}に「元気！」を送りました。`);
  };

  // お休み解除直後、上位のstate反映を待たずに済むよう、表示用のmemberにローカルstateを重ねる
  const displayMember = isResting === member.isResting ? member : { ...member, isResting };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

      <ScrollView contentContainerStyle={styles.content}>
        {historicalNotice && (
          <View style={styles.historicalBanner}>
            <History size={16} color={colors.textSecondary} />
            <Text style={styles.historicalBannerText}>{historicalNotice}</Text>
          </View>
        )}

        <DetailMemberHeader member={displayMember} />

        <RiskLevelPanel
          riskLevel={member.riskLevel}
          riskHistory={member.riskHistory}
          lastUpdated={member.lastUpdated}
        />

        <EnvironmentStatsGrid environment={member.environment} observedAt={member.lastUpdated} />

        {isResting && (
          <RestStatusBanner
            restStartedAt={member.restStartedAt}
            onPressRelease={handleReleaseRest}
          />
        )}

        {!member.isSelf && <MissionCard member={displayMember} />}

        <BasicInfoCard
          birthDate={member.birthDate}
          homeAddress={member.homeAddress}
          medicalNotes={member.medicalNotes}
        />

        <MapPreviewCard location={member.location} onPressOpenMap={() => onOpenMap?.(member)} />
      </ScrollView>

      <QuickReplyBar isSelf={member.isSelf} onPressCheckIn={handleCheckIn} onPressImFine={handleImFine} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
  historicalBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  historicalBannerText: {
    flex: 1,
    fontSize: 12,
    color: colors.textSecondary,
    marginLeft: spacing.sm,
  },
});
