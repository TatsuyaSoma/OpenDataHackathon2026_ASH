import { X } from 'lucide-react-native';
import React from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { DetailMemberHeader } from '../components/DetailMemberHeader';
import { MissionCard } from '../components/MissionCard';
import { colors, radius, spacing } from '../constants/theme';
import { useMembers } from '../context/MembersContext';

interface Props {
  visible: boolean;
  onClose?: () => void;
}

/**
 * 画面下部の「ミッション」ボタンから開く、自分のミッション一覧のポップアップ。
 * 画面遷移ではなく、現在の画面の上に半透明の背景つきモーダルカードとして重ねて表示する
 * （背景タップまたは右上のXで閉じる）。
 * ミッションは自分の体力ゲージを回復させるための行動記録のため、自分のものだけをここに集約し、
 * カード詳細画面（自分）側のミッションカードは表示しない（他メンバーのカード詳細には引き続き表示する）。
 */
export const MissionListScreen: React.FC<Props> = ({ visible, onClose }) => {
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
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.card} onPress={() => {}}>
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
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  card: {
    maxHeight: '85%',
    backgroundColor: colors.background,
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.lg,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.xl,
  },
});
