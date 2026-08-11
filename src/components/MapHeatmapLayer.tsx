import React from 'react';
import { StyleSheet } from 'react-native';
import Svg, { Defs, RadialGradient, Stop, Circle } from 'react-native-svg';
import { RiskLevel } from '../types';
import { StationWeatherPoint } from '../services/amedasWeather';
import { RISK_CONFIG } from '../constants/riskConfig';
import { projectToMap } from '../utils/mapProjection';

interface Props {
  stations: StationWeatherPoint[]; // アメダスの実測地点（気温・湿度）
}

// 湿度が高いほど体感の暑さが増すことを簡易的に織り込んだ「体感温度もどき」を算出する。
// 正式なWBGT（暑さ指数）ではなく、ヒートマップの色分け用の簡易ヒューリスティックである点に注意。
const estimateFeelsLikeTemperature = (temperature: number, humidity: number) =>
  temperature + Math.max(0, humidity - 60) * 0.05;

// 体感温度もどきを、アプリ共通の危険度6段階（RISK_CONFIG）に対応づける
const FEELS_LIKE_THRESHOLDS: { level: RiskLevel; max: number }[] = [
  { level: 'safeLight', max: 24 },
  { level: 'safe', max: 27 },
  { level: 'caution', max: 30 },
  { level: 'warning', max: 33 },
  { level: 'danger', max: 36 },
  { level: 'severe', max: Infinity },
];

const estimateHeatColor = (temperature: number, humidity: number): string => {
  const feelsLike = estimateFeelsLikeTemperature(temperature, humidity);
  const matched = FEELS_LIKE_THRESHOLDS.find((t) => feelsLike < t.max) ?? FEELS_LIKE_THRESHOLDS.at(-1)!;
  return RISK_CONFIG[matched.level].color;
};

/**
 * アメダスの実測気温・湿度をもとに、観測地点ごとの色の滲みを重ねてヒートマップ風に見せるレイヤー。
 * 湿度が高いほど滲みをやや大きくし、蒸し暑さの広がりを表現する。
 */
export const MapHeatmapLayer: React.FC<Props> = ({ stations }) => {
  return (
    <Svg style={StyleSheet.absoluteFill} viewBox="0 0 100 100" pointerEvents="none">
      <Defs>
        {stations.map((station) => (
          <RadialGradient key={station.stationId} id={`heat-${station.stationId}`} cx="50%" cy="50%" r="50%">
            <Stop
              offset="0%"
              stopColor={estimateHeatColor(station.temperature, station.humidity)}
              stopOpacity={0.55}
            />
            <Stop
              offset="100%"
              stopColor={estimateHeatColor(station.temperature, station.humidity)}
              stopOpacity={0}
            />
          </RadialGradient>
        ))}
      </Defs>
      {stations.map((station) => {
        const position = projectToMap(station.latitude, station.longitude);
        const radius = 16 + (station.humidity / 100) * 10;
        return (
          <Circle
            key={station.stationId}
            cx={position.x * 100}
            cy={position.y * 100}
            r={radius}
            fill={`url(#heat-${station.stationId})`}
          />
        );
      })}
    </Svg>
  );
};
