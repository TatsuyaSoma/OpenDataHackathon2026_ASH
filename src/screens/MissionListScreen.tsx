import { X } from 'lucide-react-native';
import React from 'react';
import { ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DetailMemberHeader } from '../components/DetailMemberHeader';
import { MissionCard } from '../components/MissionCard';
import { colors, spacing } from '../constants/theme';
import { useMembers } from '../context/MembersContext';

interface Props {
  onClose?: () => void;
}

/**
 * 画面下部の「ミッション」ボタンから別レイヤー（モーダル）として開く、自分のミッション一覧画面。
 * ミッションは自分の体力ゲージを回復させるための行動記録のため、自分のものだけをここに集約し、
 * カード詳細画面（自分）側のミッションカードは表示しない（他メンバーのカード詳細には引き続き表示する）。
 */
export const MissionListScreen: React.FC<Props> = ({ onClose }) => {
  const { members, completeMission, toggleResting } = useMembers();
  const selfMember = members.find((member) => member.isSelf);

  const handleCompleteMission = (missionId: string) => {
    if (!selfMember) return;
    completeMission(selfMember.id, missionId);
    if (missionId === 'cool-place' && !selfMember.isResting) {
      toggleResting(selfMember.id);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

      <View style={styles.header}>
        <Text style={styles.title}>ミッション</Text>
        <TouchableOpacity onPress={onClose} hitSlop={8}>
          <X size={22} color={colors.textPrimary} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {selfMember ? (
          <>
            <DetailMemberHeader member={selfMember} />
            <MissionCard member={selfMember} onCompleteMission={handleCompleteMission} defaultExpanded />
          </>
        ) : (
          <Text style={styles.emptyText}>メンバーが登録されていません。</Text>
        )}
      </ScrollView>
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
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.xl,
  },
});
