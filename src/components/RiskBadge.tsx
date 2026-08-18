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
    // ラベルの文字数（「安全」〜「非常に危険」）によって幅が変わると、MemberCard/DetailMemberHeaderの
    // 縦積みレイアウト内でバッジの中心位置がリスクレベルごとにずれて見えるため、
    // 最も長いラベル（「非常に危険」）でも収まる幅をminWidthで固定し、常に同じ幅で中央揃えする。
    minWidth: 100,
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
  },
  text: {
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
  },
});
