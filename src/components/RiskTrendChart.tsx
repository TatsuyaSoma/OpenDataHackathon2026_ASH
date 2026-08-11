import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Line, Circle } from 'react-native-svg';
import { RiskHistoryPoint } from '../types';
import { RISK_CONFIG } from '../constants/riskConfig';
import { colors, spacing } from '../constants/theme';

interface Props {
  data: RiskHistoryPoint[];
  width?: number;
  height?: number;
}

const ORDER_MIN = 1;
const ORDER_MAX = 6;

/**
 * 直近の危険度推移を表す折れ線グラフ。
 * 危険度（order:1〜6）をY軸に、時刻をX軸にとり、各区間を終点の危険度カラーで描画することで
 * 「徐々に危険度が上がっていく」様子をひと目で分かるようにしている。
 */
export const RiskTrendChart: React.FC<Props> = ({ data, width = 168, height = 110 }) => {
  if (data.length === 0) return null;

  const toY = (order: number) =>
    height - ((order - ORDER_MIN) / (ORDER_MAX - ORDER_MIN)) * height;
  const toX = (index: number) =>
    data.length <= 1 ? 0 : (index / (data.length - 1)) * width;

  const points = data.map((point, index) => ({
    x: toX(index),
    y: toY(RISK_CONFIG[point.riskLevel].order),
    color: RISK_CONFIG[point.riskLevel].color,
    time: point.time,
  }));

  return (
    <View style={styles.container}>
      <Text style={styles.title}>危険度の推移（直近6時間）</Text>
      <View style={styles.chartRow}>
        <View style={[styles.yAxis, { height }]}>
          <Text style={styles.axisLabel}>高</Text>
          <Text style={styles.axisLabel}>中</Text>
          <Text style={styles.axisLabel}>低</Text>
        </View>

        <View>
          <Svg width={width} height={height}>
            {/* 中央の目安ライン */}
            <Line
              x1={0}
              y1={height / 2}
              x2={width}
              y2={height / 2}
              stroke={colors.border}
              strokeWidth={1}
            />
            {points.slice(1).map((point, i) => {
              const prev = points[i];
              return (
                <Line
                  key={`seg-${i}`}
                  x1={prev.x}
                  y1={prev.y}
                  x2={point.x}
                  y2={point.y}
                  stroke={point.color}
                  strokeWidth={3}
                  strokeLinecap="round"
                />
              );
            })}
            {points.map((point, i) => (
              <Circle key={`dot-${i}`} cx={point.x} cy={point.y} r={5} fill={point.color} />
            ))}
          </Svg>

          <View style={[styles.xAxis, { width }]}>
            {points.map((point, i) => {
              const isLast = i === points.length - 1;
              const showLabel = i === 0 || isLast || i % 2 === 0;
              return (
                <Text key={`label-${i}`} style={styles.axisLabel}>
                  {showLabel ? `${point.time}${isLast ? '（現在）' : ''}` : ''}
                </Text>
              );
            })}
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  title: {
    fontSize: 12,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  chartRow: {
    flexDirection: 'row',
  },
  yAxis: {
    justifyContent: 'space-between',
    marginRight: spacing.xs,
    paddingVertical: 2,
  },
  xAxis: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.xs,
  },
  axisLabel: {
    fontSize: 10,
    color: colors.textSecondary,
  },
});
