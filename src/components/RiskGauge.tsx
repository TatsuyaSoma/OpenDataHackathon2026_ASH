import React from 'react';
import { View, Text } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { RiskLevel } from '../types';
import { RISK_CONFIG, RISK_LEVEL_COUNT } from '../constants/riskConfig';
import { colors } from '../constants/theme';

interface Props {
  riskLevel: RiskLevel;
  score?: number; // 0〜100の危険度スコア。指定時はリングの塗りつぶし・中央の数値表示に反映する
  size?: number;
  strokeWidth?: number;
}

/**
 * メンバーの危険度を円形リングで表示するゲージ。
 * scoreが指定された場合はその値（0〜100）で塗りつぶし量と中央の数値を決め、
 * 未指定の場合はriskLevelのorder（1〜6）に応じた塗りつぶし量にフォールバックする。
 */
export const RiskGauge: React.FC<Props> = ({ riskLevel, score, size = 56, strokeWidth = 6 }) => {
  const config = RISK_CONFIG[riskLevel];
  // order(1〜6) をそのまま /6 すると「ほぼ安全」でも16%表示されてしまいUX上不自然なため、
  // 最も安全な段階を0%起点にする（レビュー指摘反映）。
  // ただし完全に0%だとリングが全く見えず「未取得」と誤認されやすいため、視認性のため最小4%を保証する。
  const rawProgress =
    score !== undefined ? score / 100 : (config.order - 1) / (RISK_LEVEL_COUNT - 1); // 0〜1
  const progress = Math.max(rawProgress, 0.04);

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - progress);
  const center = size / 2;

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={{ position: 'absolute', top: 0, left: 0 }}>
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
      {score !== undefined && (
        <Text
          style={{
            width: size - strokeWidth * 2,
            fontSize: size * 0.46,
            fontWeight: '800',
            color: config.color,
            textAlign: 'center',
          }}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.6}>
          {score}
        </Text>
      )}
    </View>
  );
};
