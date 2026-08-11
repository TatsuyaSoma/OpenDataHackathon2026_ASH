import React, { useState } from 'react';
import { View, Text, Image, StyleSheet, Switch, TouchableOpacity } from 'react-native';
import { Bell, Minus, Moon, Navigation, Plus, User } from 'lucide-react-native';
import { Member } from '../types';
import { colors, spacing, radius } from '../constants/theme';

interface Props {
  members: Member[];
  onToggleResting: (id: string) => void;
}

const THRESHOLD_STEP_MINUTES = 30;
const THRESHOLD_MIN_MINUTES = 30;
const THRESHOLD_MAX_MINUTES = 360; // 6時間まで延長可能

const formatMinutes = (minutes: number) => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) return `${mins}分`;
  if (mins === 0) return `${hours}時間`;
  return `${hours}時間${mins}分`;
};

const formatHour = (hour: number) => `${hour}:00`;

interface StepperProps {
  value: string;
  onDecrease: () => void;
  onIncrease: () => void;
  decreaseDisabled?: boolean;
  increaseDisabled?: boolean;
}

const Stepper: React.FC<StepperProps> = ({
  value,
  onDecrease,
  onIncrease,
  decreaseDisabled,
  increaseDisabled,
}) => (
  <View style={styles.stepper}>
    <TouchableOpacity
      style={[styles.stepperButton, decreaseDisabled && styles.stepperButtonDisabled]}
      activeOpacity={0.7}
      disabled={decreaseDisabled}
      onPress={onDecrease}>
      <Minus size={16} color={decreaseDisabled ? colors.textSecondary : colors.primary} />
    </TouchableOpacity>
    <Text style={styles.stepperValue}>{value}</Text>
    <TouchableOpacity
      style={[styles.stepperButton, increaseDisabled && styles.stepperButtonDisabled]}
      activeOpacity={0.7}
      disabled={increaseDisabled}
      onPress={onIncrease}>
      <Plus size={16} color={increaseDisabled ? colors.textSecondary : colors.primary} />
    </TouchableOpacity>
  </View>
);

/**
 * 設定画面「お休みモード」タブの内容。
 * メンバーごとのお休みON/OFF切り替えと、自動解除の条件設定（モック）を提供する。
 */
export const RestModeSection: React.FC<Props> = ({ members, onToggleResting }) => {
  const [autoReleaseOnMove, setAutoReleaseOnMove] = useState(true);
  const [notifyAfterInactivity, setNotifyAfterInactivity] = useState(true);
  const [inactivityThresholdMinutes, setInactivityThresholdMinutes] = useState(30);
  const [nightSilentEnabled, setNightSilentEnabled] = useState(true);
  const [nightStartHour, setNightStartHour] = useState(22);
  const [nightEndHour, setNightEndHour] = useState(7);

  return (
    <View>
      <Text style={styles.title}>お休みモードの管理</Text>
      <Text style={styles.subtitle}>メンバーごとのお休み状態と、自動解除の条件を設定します。</Text>

      {members.length === 0 ? (
        <Text style={styles.emptyText}>見守りメンバーがいません。</Text>
      ) : (
        <View style={styles.card}>
          {members.map((member, index) => (
            <View
              key={member.id}
              style={[styles.memberRow, index !== members.length - 1 && styles.memberRowDivider]}>
              {member.photoUrl ? (
                <Image source={{ uri: member.photoUrl }} style={styles.avatar} />
              ) : (
                <View style={[styles.avatar, styles.avatarFallback]}>
                  <User size={20} color={colors.textSecondary} />
                </View>
              )}

              <View style={styles.memberInfo}>
                <Text style={styles.memberName}>{member.name}</Text>
                {member.isResting ? (
                  <View style={styles.restingRow}>
                    <Moon size={12} color={colors.primary} />
                    <Text style={styles.restingText}>
                      お休み中{member.restStartedAt ? `（開始 ${member.restStartedAt}）` : ''}
                    </Text>
                  </View>
                ) : (
                  <Text style={styles.notRestingText}>お休みしていません</Text>
                )}
              </View>

              <Switch
                value={member.isResting}
                onValueChange={() => onToggleResting(member.id)}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor="#FFFFFF"
                ios_backgroundColor={colors.border}
              />
            </View>
          ))}
        </View>
      )}

      <View style={styles.card}>
        <Text style={styles.cardTitle}>自動解除の設定</Text>

        <View style={styles.toggleRow}>
          <Navigation size={18} color={colors.textSecondary} style={styles.toggleIcon} />
          <View style={styles.toggleTextColumn}>
            <Text style={styles.toggleLabel}>位置情報が動いたら自動で解除する</Text>
            <Text style={styles.toggleCaption}>
              お休み中のメンバーの位置が変化したら、自動でお休みモードを解除します
            </Text>
          </View>
          <Switch
            value={autoReleaseOnMove}
            onValueChange={setAutoReleaseOnMove}
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor="#FFFFFF"
            ios_backgroundColor={colors.border}
          />
        </View>

        <View style={styles.divider} />

        <View style={styles.toggleRow}>
          <Bell size={18} color={colors.textSecondary} style={styles.toggleIcon} />
          <View style={styles.toggleTextColumn}>
            <Text style={styles.toggleLabel}>位置更新が無い場合に通知で促す</Text>
            <Text style={styles.toggleCaption}>
              一定時間位置情報が更新されない場合、通知からお休みモードの設定を促します
            </Text>
          </View>
          <Switch
            value={notifyAfterInactivity}
            onValueChange={setNotifyAfterInactivity}
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor="#FFFFFF"
            ios_backgroundColor={colors.border}
          />
        </View>

        {notifyAfterInactivity && (
          <View style={styles.subRow}>
            <Text style={styles.subRowLabel}>通知までの時間（30分単位で延長できます）</Text>
            <Stepper
              value={formatMinutes(inactivityThresholdMinutes)}
              decreaseDisabled={inactivityThresholdMinutes <= THRESHOLD_MIN_MINUTES}
              increaseDisabled={inactivityThresholdMinutes >= THRESHOLD_MAX_MINUTES}
              onDecrease={() =>
                setInactivityThresholdMinutes((m) => Math.max(THRESHOLD_MIN_MINUTES, m - THRESHOLD_STEP_MINUTES))
              }
              onIncrease={() =>
                setInactivityThresholdMinutes((m) => Math.min(THRESHOLD_MAX_MINUTES, m + THRESHOLD_STEP_MINUTES))
              }
            />
          </View>
        )}

        <View style={styles.divider} />

        <View style={styles.toggleRow}>
          <Moon size={18} color={colors.textSecondary} style={styles.toggleIcon} />
          <View style={styles.toggleTextColumn}>
            <Text style={styles.toggleLabel}>夜間は通知をOFFにする</Text>
            <Text style={styles.toggleCaption}>
              就寝時間帯は、お休みモードに関する通知を送らないようにします
            </Text>
          </View>
          <Switch
            value={nightSilentEnabled}
            onValueChange={setNightSilentEnabled}
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor="#FFFFFF"
            ios_backgroundColor={colors.border}
          />
        </View>

        {nightSilentEnabled && (
          <View style={styles.subRow}>
            <Text style={styles.subRowLabel}>OFFにする時間帯</Text>
            <View style={styles.nightRangeRow}>
              <Stepper
                value={formatHour(nightStartHour)}
                onDecrease={() => setNightStartHour((h) => (h + 23) % 24)}
                onIncrease={() => setNightStartHour((h) => (h + 1) % 24)}
              />
              <Text style={styles.nightRangeSeparator}>〜</Text>
              <Stepper
                value={formatHour(nightEndHour)}
                onDecrease={() => setNightEndHour((h) => (h + 23) % 24)}
                onIncrease={() => setNightEndHour((h) => (h + 1) % 24)}
              />
            </View>
          </View>
        )}

        <Text style={styles.mockNote}>
          ※位置情報連携・通知配信が未実装のため、この設定は表示のみのモックです。
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  subtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
    marginBottom: spacing.lg,
  },
  emptyText: {
    textAlign: 'center',
    color: colors.textSecondary,
    fontSize: 13,
    marginTop: spacing.xl,
  },
  card: {
    backgroundColor: colors.cardBackground,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  memberRowDivider: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: spacing.sm,
  },
  avatarFallback: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  memberInfo: {
    flex: 1,
    marginRight: spacing.sm,
  },
  memberName: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  restingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  restingText: {
    fontSize: 12,
    color: colors.primary,
    marginLeft: 4,
  },
  notRestingText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  toggleIcon: {
    marginRight: spacing.sm,
  },
  toggleTextColumn: {
    flex: 1,
    marginRight: spacing.sm,
  },
  toggleLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  toggleCaption: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
  },
  subRow: {
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  subRowLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepperButton: {
    width: 32,
    height: 32,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperButtonDisabled: {
    borderColor: colors.border,
  },
  stepperValue: {
    minWidth: 84,
    textAlign: 'center',
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  nightRangeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  nightRangeSeparator: {
    fontSize: 14,
    color: colors.textSecondary,
    marginHorizontal: spacing.sm,
  },
  mockNote: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: spacing.md,
  },
});
