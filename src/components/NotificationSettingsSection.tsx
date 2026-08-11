import React, { useState } from 'react';
import { View, Text, Image, StyleSheet, Switch, TouchableOpacity } from 'react-native';
import { Bell, Clock, Minus, Plus, TrendingUp, User, Volume2 } from 'lucide-react-native';
import { Member, RiskLevel } from '../types';
import { colors, spacing, radius } from '../constants/theme';
import { RISK_CONFIG, RISK_LEVEL_COUNT } from '../constants/riskConfig';

interface Props {
  members: Member[];
}

const RISK_LEVELS_BY_ORDER = (Object.keys(RISK_CONFIG) as RiskLevel[]).sort(
  (a, b) => RISK_CONFIG[a].order - RISK_CONFIG[b].order
);

const INTERVAL_STEP_MINUTES = 30;
const INTERVAL_MIN_MINUTES = 30;
const INTERVAL_MAX_MINUTES = 180;

const formatMinutes = (minutes: number) => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) return `${mins}分ごと`;
  if (mins === 0) return `${hours}時間ごと`;
  return `${hours}時間${mins}分ごと`;
};

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
 * 設定画面「通知設定」タブの内容。
 * 通知を送る危険度のしきい値・通知タイミング・メンバー別の通知有無を設定する（表示のみのモック）。
 */
export const NotificationSettingsSection: React.FC<Props> = ({ members }) => {
  const [pushEnabled, setPushEnabled] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [thresholdLevel, setThresholdLevel] = useState<RiskLevel>('warning');
  const [notifyOnChange, setNotifyOnChange] = useState(true);
  const [notifyPeriodic, setNotifyPeriodic] = useState(false);
  const [periodicIntervalMinutes, setPeriodicIntervalMinutes] = useState(60);
  const [memberNotifyEnabled, setMemberNotifyEnabled] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(members.map((member) => [member.id, true]))
  );

  const toggleMemberNotify = (id: string) =>
    setMemberNotifyEnabled((prev) => ({ ...prev, [id]: !prev[id] }));

  return (
    <View>
      <Text style={styles.title}>通知設定</Text>
      <Text style={styles.subtitle}>危険度の通知を送るタイミングと対象メンバーを設定します。</Text>

      <View style={styles.card}>
        <View style={styles.toggleRow}>
          <Bell size={18} color={colors.textSecondary} style={styles.toggleIcon} />
          <View style={styles.toggleTextColumn}>
            <Text style={styles.toggleLabel}>プッシュ通知を受け取る</Text>
            <Text style={styles.toggleCaption}>
              オフにすると、危険度に関する通知が一切届かなくなります
            </Text>
          </View>
          <Switch
            value={pushEnabled}
            onValueChange={setPushEnabled}
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor="#FFFFFF"
            ios_backgroundColor={colors.border}
          />
        </View>

        <View style={styles.divider} />

        <View style={styles.toggleRow}>
          <Volume2 size={18} color={colors.textSecondary} style={styles.toggleIcon} />
          <View style={styles.toggleTextColumn}>
            <Text style={styles.toggleLabel}>通知音を鳴らす</Text>
            <Text style={styles.toggleCaption}>オフにするとサイレント（バナーのみ）で通知します</Text>
          </View>
          <Switch
            value={soundEnabled}
            onValueChange={setSoundEnabled}
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor="#FFFFFF"
            ios_backgroundColor={colors.border}
          />
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>通知する危険度のしきい値</Text>
        <Text style={styles.cardCaption}>選んだ危険度以上になったときに通知します</Text>

        <View style={styles.levelRow}>
          {RISK_LEVELS_BY_ORDER.map((level) => {
            const config = RISK_CONFIG[level];
            const selected = level === thresholdLevel;
            return (
              <TouchableOpacity
                key={level}
                style={[
                  styles.levelChip,
                  { borderColor: config.color },
                  selected && { backgroundColor: config.color },
                ]}
                activeOpacity={0.7}
                onPress={() => setThresholdLevel(level)}>
                <Text style={[styles.levelChipText, { color: selected ? '#FFFFFF' : config.color }]}>
                  {config.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>通知のタイミング</Text>

        <View style={styles.toggleRow}>
          <TrendingUp size={18} color={colors.textSecondary} style={styles.toggleIcon} />
          <View style={styles.toggleTextColumn}>
            <Text style={styles.toggleLabel}>危険度が変化したときに通知する</Text>
            <Text style={styles.toggleCaption}>
              しきい値をまたいで危険度が上下したタイミングで通知します
            </Text>
          </View>
          <Switch
            value={notifyOnChange}
            onValueChange={setNotifyOnChange}
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor="#FFFFFF"
            ios_backgroundColor={colors.border}
          />
        </View>

        <View style={styles.divider} />

        <View style={styles.toggleRow}>
          <Clock size={18} color={colors.textSecondary} style={styles.toggleIcon} />
          <View style={styles.toggleTextColumn}>
            <Text style={styles.toggleLabel}>現在の状態を定期的に通知する</Text>
            <Text style={styles.toggleCaption}>
              しきい値以上の状態が続いている間、一定間隔で現在の状態を通知します
            </Text>
          </View>
          <Switch
            value={notifyPeriodic}
            onValueChange={setNotifyPeriodic}
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor="#FFFFFF"
            ios_backgroundColor={colors.border}
          />
        </View>

        {notifyPeriodic && (
          <View style={styles.subRow}>
            <Text style={styles.subRowLabel}>通知の間隔（30分単位で変更できます）</Text>
            <Stepper
              value={formatMinutes(periodicIntervalMinutes)}
              decreaseDisabled={periodicIntervalMinutes <= INTERVAL_MIN_MINUTES}
              increaseDisabled={periodicIntervalMinutes >= INTERVAL_MAX_MINUTES}
              onDecrease={() =>
                setPeriodicIntervalMinutes((m) => Math.max(INTERVAL_MIN_MINUTES, m - INTERVAL_STEP_MINUTES))
              }
              onIncrease={() =>
                setPeriodicIntervalMinutes((m) => Math.min(INTERVAL_MAX_MINUTES, m + INTERVAL_STEP_MINUTES))
              }
            />
          </View>
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>通知するメンバー</Text>
        <Text style={styles.cardCaption}>オフにしたメンバーの危険度通知は届きません</Text>

        {members.length === 0 ? (
          <Text style={styles.emptyText}>見守りメンバーがいません。</Text>
        ) : (
          members.map((member, index) => (
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
              <Text style={styles.memberName}>{member.name}</Text>
              <Switch
                value={memberNotifyEnabled[member.id] ?? true}
                onValueChange={() => toggleMemberNotify(member.id)}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor="#FFFFFF"
                ios_backgroundColor={colors.border}
              />
            </View>
          ))
        )}
      </View>

      <Text style={styles.mockNote}>
        ※プッシュ通知の配信は未実装のため、この設定は表示のみのモックです。
      </Text>
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
    marginVertical: spacing.md,
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
  },
  cardCaption: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
    marginBottom: spacing.md,
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
  levelRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  levelChip: {
    paddingVertical: 6,
    paddingHorizontal: spacing.md,
    borderRadius: radius.full,
    borderWidth: 1.5,
  },
  levelChipText: {
    fontSize: 12,
    fontWeight: '700',
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
    minWidth: 96,
    textAlign: 'center',
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
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
  memberName: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  mockNote: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 4,
  },
});
