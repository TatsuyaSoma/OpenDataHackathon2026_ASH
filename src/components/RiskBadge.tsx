import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { RiskLevel } from '../types';
import { RISK_CONFIG } from '../constants/riskConfig';
import { radius, spacing } from '../constants/theme';

interface Props {
  riskLevel: RiskLevel;
}

export const RiskBadge: React.FC<Props> = ({ riskLevel }) => {
  const config = RISK_CONFIG[riskLevel];
  return (
    <View style={[styles.badge, { backgroundColor: config.bgColor }]}>
      <Text style={[styles.text, { color: config.color }]}>{config.label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    alignSelf: 'flex-end',
  },
  text: {
    fontSize: 14,
    fontWeight: '700',
  },
});
