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
  const progress = config.order / RISK_LEVEL_COUNT; // 0〜1

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
          rotation={-90}
          origin={`${center}, ${center}`}
        />
      </Svg>
    </View>
  );
};
