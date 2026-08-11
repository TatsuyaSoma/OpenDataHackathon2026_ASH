import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MAP_SPOT_CONFIG } from '../constants/mapSpotConfig';
import { colors, spacing, radius } from '../constants/theme';

/**
 * マップ下部に表示するスポット種別の凡例（コンビニ／自販機／給水スポット／カフェ）。
 */
export const MapSpotLegendBar: React.FC = () => {
  return (
    <View style={styles.container}>
      {Object.entries(MAP_SPOT_CONFIG).map(([type, config]) => (
        <View key={type} style={styles.item}>
          <View style={[styles.iconChip, { backgroundColor: config.color }]}>
            <config.Icon size={14} color="#FFFFFF" />
          </View>
          <Text style={styles.label} numberOfLines={1}>
            {config.label}
          </Text>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: colors.cardBackground,
    borderRadius: radius.lg,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconChip: {
    width: 22,
    height: 22,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
  },
  label: {
    fontSize: 11,
    color: colors.textPrimary,
  },
});
