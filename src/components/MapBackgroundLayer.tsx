import React from 'react';
import { StyleSheet } from 'react-native';
import Svg, { Circle, Line, Path, Rect } from 'react-native-svg';
import { colors } from '../constants/theme';

interface StationPoint {
  x: number; // 0〜1の正規化座標
  y: number;
}

interface Props {
  stations?: StationPoint[]; // 路線（駅を結ぶ点線）の経由点。指定がなければ路線は描画しない
}

// 0〜100の仮想座標系（viewBoxと同じ）で街区（道路で区切られたブロック）を並べる境界線
const H_BANDS = [-6, 20, 44, 68, 92, 116];
const V_BANDS = [-6, 20, 44, 68, 92, 116];
const BLOCK_INSET = 2.5;

// 主要道路（少し太め）にする位置
const MAJOR_ROAD_VALUES = [44, 68];

/**
 * マップ画面の背景レイヤー。
 * 街区・公園・河川・道路網・鉄道路線をSVGで描画し、
 * 単純な十字の道路線だけだったプレースホルダーより「地図らしい」見た目にする。
 * 実際の地図タイルではなく、あくまで疑似ベクターマップである点は変わらない。
 */
export const MapBackgroundLayer: React.FC<Props> = ({ stations }) => {
  const blocks: React.ReactElement[] = [];
  for (let row = 0; row < H_BANDS.length - 1; row += 1) {
    for (let col = 0; col < V_BANDS.length - 1; col += 1) {
      const x = V_BANDS[col] + BLOCK_INSET;
      const y = H_BANDS[row] + BLOCK_INSET;
      const width = V_BANDS[col + 1] - V_BANDS[col] - BLOCK_INSET * 2;
      const height = H_BANDS[row + 1] - H_BANDS[row] - BLOCK_INSET * 2;
      const shade = (row * 3 + col * 7) % 5 === 0 ? '#E8EEF3' : (row + col) % 2 === 0 ? '#FFFFFF' : '#F1F5F8';
      blocks.push(
        <Rect
          key={`block-${row}-${col}`}
          x={x}
          y={y}
          width={width}
          height={height}
          rx={2}
          fill={shade}
        />
      );
    }
  }

  const railPath =
    stations && stations.length > 1
      ? stations.map((s, i) => `${i === 0 ? 'M' : 'L'} ${s.x * 100} ${s.y * 100}`).join(' ')
      : undefined;

  return (
    <Svg style={StyleSheet.absoluteFill} viewBox="0 0 100 100" pointerEvents="none">
      <Rect x={0} y={0} width={100} height={100} fill="#EDF1F4" />
      {blocks}

      {/* 公園（緑地） */}
      <Circle cx={9} cy={54} r={8} fill="#CFE8CB" opacity={0.9} />
      <Circle cx={16} cy={50} r={6} fill="#CFE8CB" opacity={0.9} />
      <Circle cx={91} cy={90} r={7} fill="#CFE8CB" opacity={0.9} />
      <Circle cx={85} cy={94} r={5} fill="#CFE8CB" opacity={0.9} />

      {/* 河川 */}
      <Path
        d="M 100 6 C 84 18, 92 28, 76 40 C 62 52, 70 64, 52 74 C 40 82, 44 94, 26 100"
        stroke="#BFE0F2"
        strokeWidth={8}
        strokeLinecap="round"
        fill="none"
        opacity={0.95}
      />

      {/* 道路網 */}
      {H_BANDS.slice(1, -1).map((y) => (
        <React.Fragment key={`h-${y}`}>
          <Line
            x1={0}
            y1={y}
            x2={100}
            y2={y}
            stroke="#D7DEE5"
            strokeWidth={MAJOR_ROAD_VALUES.includes(y) ? 3.4 : 2.2}
          />
          <Line
            x1={0}
            y1={y}
            x2={100}
            y2={y}
            stroke="#FFFFFF"
            strokeWidth={MAJOR_ROAD_VALUES.includes(y) ? 2 : 1.1}
          />
        </React.Fragment>
      ))}
      {V_BANDS.slice(1, -1).map((x) => (
        <React.Fragment key={`v-${x}`}>
          <Line
            x1={x}
            y1={0}
            x2={x}
            y2={100}
            stroke="#D7DEE5"
            strokeWidth={MAJOR_ROAD_VALUES.includes(x) ? 3.4 : 2.2}
          />
          <Line
            x1={x}
            y1={0}
            x2={x}
            y2={100}
            stroke="#FFFFFF"
            strokeWidth={MAJOR_ROAD_VALUES.includes(x) ? 2 : 1.1}
          />
        </React.Fragment>
      ))}
      {/* 斜めの大通り */}
      <Line x1={0} y1={82} x2={46} y2={0} stroke="#D7DEE5" strokeWidth={3} />
      <Line x1={0} y1={82} x2={46} y2={0} stroke="#FFFFFF" strokeWidth={1.6} />

      {/* 鉄道路線（駅を結ぶ点線） */}
      {railPath && (
        <Path d={railPath} stroke={colors.primary} strokeWidth={0.7} strokeDasharray="2.2 1.6" opacity={0.55} fill="none" />
      )}
    </Svg>
  );
};
