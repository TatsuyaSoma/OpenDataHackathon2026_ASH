import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { RISK_CONFIG } from '../constants/riskConfig';
import { radius, spacing } from '../constants/theme';
import { RiskHistoryPoint, RiskLevel } from '../types';
import { RiskTrendChart } from './RiskTrendChart';

interface Props {
  riskLevel: RiskLevel;
  riskHistory?: RiskHistoryPoint[];
  lastUpdated?: string;
}

/**
 * カード詳細画面の中核パネル。
 * 「熱中症危険度 レベルX（色）」の大きな表示、注意喚起アドバイス、
 * 直近6時間の危険度推移グラフを1つのパネルにまとめている。
 * 背景色はその時点の危険度カラーに応じて自動的に変化する。
 */
export const RiskLevelPanel: React.FC<Props> = ({ riskLevel, riskHistory, lastUpdated }) => {
  const config = RISK_CONFIG[riskLevel];
  const currentHistory = riskHistory?.length
    ? riskHistory.map((point, index) =>
        index === riskHistory.length - 1
          ? { ...point, riskLevel, time: lastUpdated ?? point.time }
          : point
      )
    : undefined;

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

        {currentHistory && currentHistory.length > 0 && (
          <RiskTrendChart data={currentHistory} />
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
