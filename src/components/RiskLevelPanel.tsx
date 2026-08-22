import { ChevronDown, ChevronUp } from 'lucide-react-native';
import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
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
 * ヘッダー（見出し・レベル表示）は常に表示し、アドバイス文と推移グラフのみ開閉できる。
 */
export const RiskLevelPanel: React.FC<Props> = ({ riskLevel, riskHistory, lastUpdated }) => {
  const [expanded, setExpanded] = useState(false);
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
      <TouchableOpacity
        style={styles.header}
        activeOpacity={0.7}
        onPress={() => setExpanded((prev) => !prev)}>
        <View style={styles.headerText}>
          <Text style={[styles.heading, { color: config.color }]}>熱中症危険度</Text>
          <Text style={[styles.level, { color: config.color }]}>
            レベル{config.order}（{config.colorName}）
          </Text>
        </View>
        {expanded ? (
          <ChevronUp size={20} color={config.color} />
        ) : (
          <ChevronDown size={20} color={config.color} />
        )}
      </TouchableOpacity>

      {expanded && (
        <View style={styles.contentRow}>
          <Text style={styles.advice}>{config.advice}</Text>
          {currentHistory && currentHistory.length > 0 && (
            <RiskTrendChart data={currentHistory} />
          )}
        </View>
      )}
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerText: {
    flex: 1,
    marginRight: spacing.md,
  },
  contentRow: {
    flexDirection: 'row',
    marginTop: spacing.md,
  },
  heading: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  level: {
    fontSize: 22,
    fontWeight: '800',
  },
  advice: {
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
    color: '#4B4B4B',
    marginRight: spacing.md,
  },
});
