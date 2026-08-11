import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { RiskLevel, RiskHistoryPoint } from '../types';
import { RISK_CONFIG } from '../constants/riskConfig';
import { spacing, radius } from '../constants/theme';
import { RiskTrendChart } from './RiskTrendChart';

interface Props {
  riskLevel: RiskLevel;
  riskHistory?: RiskHistoryPoint[];
}

/**
 * カード詳細画面の中核パネル。
 * 「熱中症危険度 レベルX（色）」の大きな表示、注意喚起アドバイス、
 * 直近6時間の危険度推移グラフを1つのパネルにまとめている。
 * 背景色はその時点の危険度カラーに応じて自動的に変化する。
 */
export const RiskLevelPanel: React.FC<Props> = ({ riskLevel, riskHistory }) => {
  const config = RISK_CONFIG[riskLevel];

  return (
    <View style={[styles.container, { backgroundColor: config.bgColor, borderColor: config.color }]}>
      <View style={styles.contentRow}>
        <View style={styles.textColumn}>
          <Text style={[styles.heading, { color: config.color }]}>熱中症危険度</Text>
          <Text style={[styles.level, { color: config.color }]}>
            レベル{config.order}（{config.colorName}）
          </Text>
          <Text style={styles.advice}>{config.advice}</Text>
        </View>

        {riskHistory && riskHistory.length > 0 && (
          <RiskTrendChart data={riskHistory} />
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  contentRow: {
    flexDirection: 'row',
  },
  textColumn: {
    flex: 1,
    marginRight: spacing.md,
    justifyContent: 'center',
  },
  heading: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  level: {
    fontSize: 22,
    fontWeight: '800',
    marginBottom: spacing.sm,
  },
  advice: {
    fontSize: 12,
    lineHeight: 18,
    color: '#4B4B4B',
  },
});
