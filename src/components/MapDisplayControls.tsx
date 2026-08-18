import React, { useState } from 'react';
import { View, Text, StyleSheet, Switch, TouchableOpacity } from 'react-native';
import { ChevronUp, SlidersHorizontal } from 'lucide-react-native';
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
  cafeEnabled: boolean;
  onToggleCafe: (value: boolean) => void;
  waterEnabled: boolean;
  onToggleWater: (value: boolean) => void;
}

/**
 * マップ右側の表示設定パネル。レイヤーのオン／オフを行う。
 * ヘッダーをタップすると最小化（丸いボタンのみ）でき、再タップで展開できる。
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
  cafeEnabled,
  onToggleCafe,
  waterEnabled,
  onToggleWater,
}) => {
  const [collapsed, setCollapsed] = useState(true);

  if (collapsed) {
    return (
      <TouchableOpacity
        style={styles.collapsedButton}
        activeOpacity={0.8}
        onPress={() => setCollapsed(false)}>
        <SlidersHorizontal size={18} color={colors.primary} />
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.card}>
      <TouchableOpacity style={styles.header} activeOpacity={0.7} onPress={() => setCollapsed(true)}>
        <Text style={styles.headerTitle}>表示設定</Text>
        <ChevronUp size={16} color={colors.textSecondary} />
      </TouchableOpacity>

      <ToggleRow label="WBGT" value={heatmapEnabled} onValueChange={onToggleHeatmap} />
      <ToggleRow label="メンバー" value={membersEnabled} onValueChange={onToggleMembers} />
      <ToggleRow label="コンビニ" value={convenienceEnabled} onValueChange={onToggleConvenience} />
      <ToggleRow label="自販機" value={vendingEnabled} onValueChange={onToggleVending} />
      <ToggleRow label="カフェ" value={cafeEnabled} onValueChange={onToggleCafe} />
      <ToggleRow label="給水スポット" value={waterEnabled} onValueChange={onToggleWater} />
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
  collapsedButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.cardBackground,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
