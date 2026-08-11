import React from 'react';
import { View, Text, StyleSheet, Switch } from 'react-native';
import { SlidersHorizontal } from 'lucide-react-native';
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
}

/**
 * マップ右側の表示設定パネル。レイヤーのオン／オフを行う。
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
}) => {
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
});
