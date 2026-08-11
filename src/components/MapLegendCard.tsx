import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { RISK_CONFIG } from '../constants/riskConfig';
import { colors, spacing, radius } from '../constants/theme';

interface Props {
  referenceMemberName: string;
}

const LEVELS = Object.values(RISK_CONFIG).sort((a, b) => a.order - b.order);

/**
 * マップ左上に表示する危険度の凡例。
 * ヒートマップの基準メンバーによって危険度の感じ方が変わることを示すため、
 * タイトルに基準メンバー名を含める。
 */
export const MapLegendCard: React.FC<Props> = ({ referenceMemberName }) => {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>熱中症危険度（{referenceMemberName}基準）</Text>
      <View style={styles.gradientRow}>
        {LEVELS.map((level) => (
          <View key={level.label} style={[styles.segment, { backgroundColor: level.color }]} />
        ))}
      </View>
      <View style={styles.labelRow}>
        {LEVELS.map((level) => (
          <Text key={level.label} style={styles.label} numberOfLines={1}>
            {level.colorName}
          </Text>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.cardBackground,
    borderRadius: radius.md,
    padding: spacing.md,
    maxWidth: 260,
  },
  title: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  gradientRow: {
    flexDirection: 'row',
    height: 8,
    borderRadius: radius.full,
    overflow: 'hidden',
  },
  segment: {
    flex: 1,
  },
  labelRow: {
    flexDirection: 'row',
    marginTop: 4,
  },
  label: {
    flex: 1,
    fontSize: 10,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
