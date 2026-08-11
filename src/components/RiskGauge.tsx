import React from 'react';
import { View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { RiskLevel } from '../types';
import { RISK_CONFIG, RISK_LEVEL_COUNT } from '../constants/riskConfig';
import { colors } from '../constants/theme';

interface Props {
  riskLevel: RiskLevel;
  size?: number;
  strokeWidth?: number;
}

/**
 * メンバーの危険度を円形リングで表示するゲージ。
 * order（1〜6）に応じて円周の何割を塗りつぶすかを決定する。
 */
export const RiskGauge: React.FC<Props> = ({ riskLevel, size = 56, strokeWidth = 6 }) => {
  const config = RISK_CONFIG[riskLevel];
  // order(1〜6) をそのまま /6 すると「ほぼ安全」でも16%表示されてしまいUX上不自然なため、
  // 最も安全な段階を0%起点にする（レビュー指摘反映）。
  // ただし完全に0%だとリングが全く見えず「未取得」と誤認されやすいため、視認性のため最小4%を保証する。
  const rawProgress = (config.order - 1) / (RISK_LEVEL_COUNT - 1); // 0〜1
  const progress = Math.max(rawProgress, 0.04);

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - progress);
  const center = size / 2;

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size}>
        {/* 背景の薄いリング */}
        <Circle
          cx={center}
          cy={center}
          r={radius}
          stroke={colors.border}
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* 危険度に応じた進捗リング */}
        <Circle
          cx={center}
          cy={center}
          r={radius}
          stroke={config.color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={dashOffset}
          fill="none"
          transform={`rotate(-90 ${center} ${center})`}
        />
      </Svg>
    </View>
  );
};
