import { ChevronDown, ChevronUp } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { MISSION_MAX_RECOVERY } from '../constants/missions';
import { colors, radius, spacing } from '../constants/theme';
import { computeMissionStates } from '../logic/missions';
import { Member } from '../types';

interface Props {
  member: Member;
  // 自分自身のミッションを表示する画面（達成操作ができる）でのみ指定する。
  // 未指定時、達成ボタンは表示されず、他メンバーのミッションを読み取り専用で表示する。
  onCompleteMission?: (missionId: string) => void;
  // 初期表示時に展開しておくかどうか（未指定時は折りたたみ）。
  // 「ミッション」画面のようにミッション確認が主目的の画面では展開済みにしたい。
  defaultExpanded?: boolean;
}

// クールダウンの残り時間を「あと◯分」「あと◯時間◯分」の形式にする
const formatRemaining = (ms: number): string => {
  const totalMinutes = Math.max(1, Math.ceil(ms / 60000));
  if (totalMinutes < 60) return `あと${totalMinutes}分`;
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return minutes === 0 ? `あと${hours}時間` : `あと${hours}時間${minutes}分`;
};

/**
 * カード詳細画面のミッションカード。冷たい水を飲む・涼しい場所にいる等、簡単な行動を
 * 報告すると体力ゲージが回復する。各ミッションは達成後1時間はクールダウンし、
 * その間は再挑戦できない。クールダウンはお休みモードの切り替えによらず、達成時から計測する。
 * 3つ全部を同時にクリア中の状態にすると、追加の全クリアボーナスが入る。
 */
export const MissionCard: React.FC<Props> = ({ member, onCompleteMission, defaultExpanded = false }) => {
  // クールダウンの残り時間表示を更新するため、定期的に再レンダーする
  // （1時間単位のクールダウンなので、秒単位の精度は不要）
  const [, setTick] = useState(0);
  useEffect(() => {
    const intervalId = setInterval(() => setTick((n) => n + 1), 30000);
    return () => clearInterval(intervalId);
  }, []);
  const [expanded, setExpanded] = useState(defaultExpanded);

  const states = computeMissionStates(member.missionCompletions, member.isResting);
  const projectedVitality = Math.min(100, member.vitality + MISSION_MAX_RECOVERY);

  return (
    <View style={styles.card}>
      <TouchableOpacity
        style={styles.header}
        activeOpacity={0.7}
        onPress={() => setExpanded((prev) => !prev)}>
        <Text style={styles.title}>ミッション</Text>
        <View style={styles.headerRight}>
          <Text style={styles.recoveryHint}>全部達成後 {projectedVitality}%</Text>
          {expanded ? (
            <ChevronUp size={16} color={colors.textSecondary} />
          ) : (
            <ChevronDown size={16} color={colors.textSecondary} />
          )}
        </View>
      </TouchableOpacity>

      {expanded && states.map((state, index) => (
        <View key={state.id} style={[styles.row, index === 0 && styles.rowFirst]}>
          <View style={styles.rowInfo}>
            <Text style={styles.missionLabel}>{state.label}</Text>
            <Text style={styles.missionPoints}>+{state.points}</Text>
          </View>
          {member.isSelf ? (
            <TouchableOpacity
              style={[styles.button, !state.available && styles.buttonDisabled]}
              activeOpacity={0.7}
              disabled={!state.available}
              onPress={() => onCompleteMission?.(state.id)}>
              <Text style={[styles.buttonText, !state.available && styles.buttonTextDisabled]} numberOfLines={1}>
                {state.onCooldown ? formatRemaining(state.remainingMs) : '達成する'}
              </Text>
            </TouchableOpacity>
          ) : (
            <Text style={[styles.statusText, state.onCooldown && styles.statusCompleted]}>
              {state.onCooldown ? '達成済み' : '未達成'}
            </Text>
          )}
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.cardBackground,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  recoveryHint: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  restingNotice: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    marginTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  rowFirst: {
    marginTop: spacing.md,
  },
  rowInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: spacing.sm,
  },
  missionLabel: {
    fontSize: 14,
    color: colors.textPrimary,
    flex: 1,
    flexShrink: 1,
  },
  missionPoints: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.successText,
    marginLeft: spacing.sm,
    width: 36,
    textAlign: 'right',
  },
  button: {
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    minWidth: 92,
    alignItems: 'center',
  },
  buttonDisabled: {
    borderColor: colors.border,
  },
  buttonText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
  },
  buttonTextDisabled: {
    color: colors.textSecondary,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    minWidth: 92,
    textAlign: 'center',
  },
  statusCompleted: {
    color: colors.successText,
  },
});
