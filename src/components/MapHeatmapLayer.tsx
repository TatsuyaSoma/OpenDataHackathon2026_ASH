import React from 'react';
import { StyleSheet } from 'react-native';
import Svg, { Defs, RadialGradient, Stop, Circle } from 'react-native-svg';
import { StationWeatherPoint } from '../services/amedasWeather';
import { RISK_CONFIG } from '../constants/riskConfig';
import { estimateRiskLevel } from '../logic/riskCalculation';
import { projectToMap } from '../utils/mapProjection';

interface Props {
  stations: StationWeatherPoint[]; // アメダスの実測地点（気温・湿度）
}

// メンバーのriskLevelと同じ算出ロジックで観測地点ごとの危険度カラーを決める（表示の一貫性のため）
const estimateHeatColor = (temperature: number, humidity: number): string =>
  RISK_CONFIG[estimateRiskLevel({ temperature, humidity })].color;

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
