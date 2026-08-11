import React, { useState } from 'react';
import { View, Text, StyleSheet, Switch, TouchableOpacity } from 'react-native';
import { SlidersHorizontal, ChevronDown } from 'lucide-react-native';
import { Member } from '../types';
import { colors, spacing, radius } from '../constants/theme';

interface Props {
  heatmapEnabled: boolean;
  onToggleHeatmap: (value: boolean) => void;
  membersEnabled: boolean;
  onToggleMembers: (value: boolean) => void;
  convenienceEnabled: boolean;
  onToggleConvenience: (value: boolean) => void;
  vendingEnabled: boolean;
  onToggleVending: (value: boolean) => void;
  referenceCandidates: Member[]; // お休み中のメンバーを除いた選択候補
  referenceMember: Member;
  onSelectReferenceMember: (member: Member) => void;
}

/**
 * マップ右側の表示設定パネル。
 * レイヤーのオン／オフと、ヒートマップの基準にするメンバーの選択を行う。
 */
export const MapDisplayControls: React.FC<Props> = ({
  heatmapEnabled,
  onToggleHeatmap,
  membersEnabled,
  onToggleMembers,
  convenienceEnabled,
  onToggleConvenience,
  vendingEnabled,
  onToggleVending,
  referenceCandidates,
  referenceMember,
  onSelectReferenceMember,
}) => {
  const [pickerOpen, setPickerOpen] = useState(false);

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>表示設定</Text>
        <SlidersHorizontal size={16} color={colors.textSecondary} />
      </View>

      <ToggleRow label="ヒートマップ" value={heatmapEnabled} onValueChange={onToggleHeatmap} />
      <ToggleRow label="メンバー" value={membersEnabled} onValueChange={onToggleMembers} />
      <ToggleRow label="コンビニ" value={convenienceEnabled} onValueChange={onToggleConvenience} />
      <ToggleRow label="自販機" value={vendingEnabled} onValueChange={onToggleVending} />

      <Text style={styles.pickerLabel}>ヒートマップの基準メンバー</Text>
      <TouchableOpacity
        style={styles.pickerButton}
        activeOpacity={0.7}
        onPress={() => setPickerOpen((open) => !open)}>
        <Text style={styles.pickerButtonText} numberOfLines={1}>
          {referenceMember.name}（{referenceMember.age}歳・{referenceMember.gender}）
        </Text>
        <ChevronDown size={16} color={colors.textSecondary} />
      </TouchableOpacity>

      {pickerOpen && (
        <View style={styles.pickerList}>
          {referenceCandidates.map((member) => (
            <TouchableOpacity
              key={member.id}
              style={styles.pickerItem}
              onPress={() => {
                onSelectReferenceMember(member);
                setPickerOpen(false);
              }}>
              <Text style={styles.pickerItemText}>
                {member.name}（{member.age}歳・{member.gender}）
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <Text style={styles.note}>※お休み中のメンバーは除外されます</Text>
    </View>
  );
};

interface ToggleRowProps {
  label: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
}

const ToggleRow: React.FC<ToggleRowProps> = ({ label, value, onValueChange }) => (
  <View style={styles.toggleRow}>
    <Text style={styles.toggleLabel}>{label}</Text>
    <Switch
      value={value}
      onValueChange={onValueChange}
      trackColor={{ false: colors.border, true: colors.primary }}
      thumbColor="#FFFFFF"
      ios_backgroundColor={colors.border}
    />
  </View>
);

const styles = StyleSheet.create({
  card: {
    width: 220,
    backgroundColor: colors.cardBackground,
    borderRadius: radius.lg,
    padding: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  toggleLabel: {
    fontSize: 13,
    color: colors.textPrimary,
  },
  pickerLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: spacing.sm,
    marginBottom: 4,
  },
  pickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
  },
  pickerButtonText: {
    flex: 1,
    fontSize: 12,
    color: colors.textPrimary,
    marginRight: spacing.xs,
  },
  pickerList: {
    marginTop: 4,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    overflow: 'hidden',
  },
  pickerItem: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  pickerItemText: {
    fontSize: 12,
    color: colors.textPrimary,
  },
  note: {
    fontSize: 10,
    color: colors.textSecondary,
    marginTop: spacing.sm,
  },
});
