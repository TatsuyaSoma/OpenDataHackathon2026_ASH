import React, { useState } from 'react';
import { View, Text, StyleSheet, Switch, TouchableOpacity } from 'react-native';
import { ChevronUp, SlidersHorizontal, Thermometer, Users } from 'lucide-react-native';
import { colors, spacing, radius } from '../constants/theme';
import { MAP_SPOT_CONFIG } from '../constants/mapSpotConfig';
import { RISK_CONFIG } from '../constants/riskConfig';
import { MapSpotType } from '../types';

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
  disasterWaterEnabled: boolean;
  onToggleDisasterWater: (value: boolean) => void;
  // パネルの開閉状態が変わるたびに呼ばれる。展開中はメンバー・スポットのピンより
  // 手前に表示したいため、呼び出し元でこの値をもとに周囲のレイヤーの重なり順を調整する。
  onExpandedChange?: (expanded: boolean) => void;
}

const RISK_LEVELS = Object.values(RISK_CONFIG).sort((a, b) => a.order - b.order);

/**
 * マップ右側の表示設定パネル。レイヤーのオン／オフを行う。
 * 地図面が凡例カードで混み合わないよう、危険度の色分け・スポット種別アイコンの凡例も
 * このパネル内に統合している（各行のアイコン・色がそのままピンの見た目と対応する凡例を兼ねる）。
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
  disasterWaterEnabled,
  onToggleDisasterWater,
  onExpandedChange,
}) => {
  const [collapsed, setCollapsed] = useState(true);

  const expand = () => {
    setCollapsed(false);
    onExpandedChange?.(true);
  };
  const collapse = () => {
    setCollapsed(true);
    onExpandedChange?.(false);
  };

  if (collapsed) {
    return (
      <TouchableOpacity style={styles.collapsedButton} activeOpacity={0.8} onPress={expand}>
        <SlidersHorizontal size={18} color={colors.primary} />
      </TouchableOpacity>
    );
  }

  const spotToggles: { type: MapSpotType; value: boolean; onValueChange: (value: boolean) => void }[] = [
    { type: 'convenience', value: convenienceEnabled, onValueChange: onToggleConvenience },
    { type: 'vending', value: vendingEnabled, onValueChange: onToggleVending },
    { type: 'water', value: waterEnabled, onValueChange: onToggleWater },
    { type: 'disasterWater', value: disasterWaterEnabled, onValueChange: onToggleDisasterWater },
    { type: 'cafe', value: cafeEnabled, onValueChange: onToggleCafe },
  ];

  return (
    <View style={styles.card}>
      <TouchableOpacity style={styles.header} activeOpacity={0.7} onPress={collapse}>
        <Text style={styles.headerTitle}>表示設定</Text>
        <ChevronUp size={16} color={colors.textSecondary} />
      </TouchableOpacity>

      <ToggleRow
        label="WBGT"
        value={heatmapEnabled}
        onValueChange={onToggleHeatmap}
        icon={<IconChip color={colors.primary} Icon={Thermometer} />}
      />
      {heatmapEnabled && (
        <View style={styles.riskLegend}>
          <View style={styles.riskGradientRow}>
            {RISK_LEVELS.map((level) => (
              <View key={level.label} style={[styles.riskSegment, { backgroundColor: level.color }]} />
            ))}
          </View>
          <View style={styles.riskLabelRow}>
            {RISK_LEVELS.map((level) => (
              <Text key={level.label} style={styles.riskLabel} numberOfLines={1}>
                {level.colorName}
              </Text>
            ))}
          </View>
        </View>
      )}

      <ToggleRow
        label="メンバー"
        value={membersEnabled}
        onValueChange={onToggleMembers}
        icon={<IconChip color={colors.primary} Icon={Users} />}
      />

      {spotToggles.map(({ type, value, onValueChange }) => {
        const config = MAP_SPOT_CONFIG[type];
        return (
          <ToggleRow
            key={type}
            label={config.label}
            value={value}
            onValueChange={onValueChange}
            icon={<IconChip color={config.color} Icon={config.Icon} />}
          />
        );
      })}
    </View>
  );
};

interface IconChipProps {
  color: string;
  Icon: React.ComponentType<{ size?: number; color?: string }>;
}

// トグル行の先頭に置く、地図上のピンと同じ色・アイコンの小さなチップ（凡例を兼ねる）
const IconChip: React.FC<IconChipProps> = ({ color, Icon }) => (
  <View style={[styles.iconChip, { backgroundColor: color }]}>
    <Icon size={12} color="#FFFFFF" />
  </View>
);

interface ToggleRowProps {
  label: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
  icon: React.ReactNode;
}

const ToggleRow: React.FC<ToggleRowProps> = ({ label, value, onValueChange, icon }) => (
  <View style={styles.toggleRow}>
    <View style={styles.toggleLabelRow}>
      {icon}
      <Text style={styles.toggleLabel}>{label}</Text>
    </View>
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
    width: 240,
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
  toggleLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  toggleLabel: {
    fontSize: 13,
    color: colors.textPrimary,
    marginLeft: spacing.sm,
  },
  iconChip: {
    width: 22,
    height: 22,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  riskLegend: {
    marginBottom: 6,
  },
  riskGradientRow: {
    flexDirection: 'row',
    height: 6,
    borderRadius: radius.full,
    overflow: 'hidden',
  },
  riskSegment: {
    flex: 1,
  },
  riskLabelRow: {
    flexDirection: 'row',
    marginTop: 4,
  },
  riskLabel: {
    flex: 1,
    fontSize: 9,
    color: colors.textSecondary,
    textAlign: 'center',
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
