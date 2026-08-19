import React from 'react';
import { Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { RISK_CONFIG, RISK_LEVEL_COUNT } from '../constants/riskConfig';
import { colors } from '../constants/theme';
import { RiskLevel } from '../types';

interface Props {
  riskLevel: RiskLevel; // リング（ゲージ）の色・塗りつぶし量のフォールバックに使う危険度レベル
  score?: number; // 0〜100。指定時はリングの塗りつぶし量に使う
  valueLabel?: number; // 中央に表示する数値。未指定の場合はscoreを表示する（ゲージの値と表示したい数値が異なる場合に指定する）
  valueSuffix?: string; // 中央の数値に付ける単位
  valueColor?: string; // 中央の数値の色。未指定の場合はriskLevelの色を使う（ゲージの色と数値の色を分けたい場合に指定する）
  size?: number;
  strokeWidth?: number;
  hideValue?: boolean; // trueの場合、中央の数値テキストを表示しない（マップのアイコン用）
}

/**
 * 円形リングのゲージ。リング自体はriskLevel（色）とscore（塗りつぶし量、0〜100）で決まり、
 * 中央に表示する数値・色はvalueLabel/valueColorで別途指定できる
 * （例：ゲージ自体は体力ゲージの残量、中央の数値は危険度スコア、というように意味を分離できる）。
 * score未指定の場合はriskLevelのorder（1〜6）に応じた塗りつぶし量にフォールバックする。
 */
export const RiskGauge: React.FC<Props> = ({
  riskLevel,
  score,
  valueLabel,
  valueSuffix,
  valueColor,
  size = 56,
  strokeWidth = 6,
  hideValue = false,
}) => {
  const config = RISK_CONFIG[riskLevel];
  // order(1〜6) をそのまま /6 すると「ほぼ安全」でも16%表示されてしまいUX上不自然なため、
  // 最も安全な段階を0%起点にする（レビュー指摘反映）。
  // ただし完全に0%だとリングが全く見えず「未取得」と誤認されやすいため、視認性のため最小4%を保証する。
  const rawProgress =
    score !== undefined ? score / 100 : (config.order - 1) / (RISK_LEVEL_COUNT - 1); // 0〜1
  const progress = Math.max(rawProgress, 0.04);
  const displayValue = valueLabel ?? score;
  const displayColor = valueColor ?? config.color;

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
      {displayValue !== undefined && !hideValue && (
        <Text
          style={{
            width: size - strokeWidth * 2,
            fontSize: size * 0.46,
            fontWeight: '800',
            color: displayColor,
            textAlign: 'center',
          }}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.6}>
          {displayValue}{valueSuffix}
        </Text>
      )}
    </View>
  );
};
