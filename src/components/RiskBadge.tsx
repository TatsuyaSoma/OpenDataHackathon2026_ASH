import { Moon } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { RISK_CONFIG } from '../constants/riskConfig';
import { radius, spacing } from '../constants/theme';
import { RiskLevel } from '../types';

interface Props {
  riskLevel: RiskLevel;
  isResting?: boolean;
}

export const RiskBadge: React.FC<Props> = ({ riskLevel, isResting = false }) => {
  const config = RISK_CONFIG[riskLevel];
  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: isResting ? '#D9EEFF' : config.bgColor },
      ]}>
      {isResting ? (
        <>
          <Moon size={14} color="#1677B8" />
          <Text style={[styles.text, styles.restingText]}>お休み中</Text>
        </>
      ) : (
        <Text style={[styles.text, { color: config.color }]}>{config.label}</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 4,
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
  restingText: {
    color: '#1677B8',
  },
});
