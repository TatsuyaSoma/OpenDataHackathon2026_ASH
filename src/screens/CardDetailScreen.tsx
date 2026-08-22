import { ArrowLeft, History, MoreVertical } from 'lucide-react-native';
import React, { useState } from 'react';
import {
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
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
  onBack?: () => void;
  onOpenMap?: (member: Member) => void;
  onOpenMenu?: (member: Member) => void;
}

export const CardDetailScreen: React.FC<Props> = ({
  member,
  historicalNotice,
  onBack,
  onOpenMap,
  onOpenMenu,
}) => {
  const { completeMission, toggleResting } = useMembers();

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

  const handleCompleteMission = (missionId: string) => {
    completeMission(member.id, missionId);
    if (missionId === 'cool-place' && !isResting) {
      toggleResting(member.id);
      setIsResting(true);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} hitSlop={8}>
          <ArrowLeft size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>カード詳細画面</Text>
        <TouchableOpacity onPress={() => onOpenMenu?.(member)} hitSlop={8}>
          <MoreVertical size={22} color={colors.textPrimary} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {historicalNotice && (
          <View style={styles.historicalBanner}>
            <History size={16} color={colors.textSecondary} />
            <Text style={styles.historicalBannerText}>{historicalNotice}</Text>
          </View>
        )}

        <DetailMemberHeader member={member} />

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

        <MissionCard
          member={isResting === member.isResting ? member : { ...member, isResting }}
          onCompleteMission={handleCompleteMission}
        />

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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.textPrimary,
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
