import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { RISK_CONFIG } from '../constants/riskConfig';
import { MapRegion } from '../utils/mapProjection';
import { TokyoWbgtReading, haversineDistanceKm, wbgtToRiskLevel } from '../services/envWbgt';

const GRID_COLS = 10;
const GRID_ROWS = 10;

// 逆距離加重法（IDW）の減衰の強さ。値が大きいほど、近い地点の実況値の影響が強くなる
// （距離が離れるほど急激に重みが下がり、遠い地点同士の値が平均化されにくくなる）。
const IDW_POWER = 2;

interface Props {
  // 現在の地図の表示範囲。ネイティブ版はonCameraMoveから得た実際のカメラ位置、
  // Web版はMAP_BOUNDS相当の固定範囲を渡す（Web側は表示コンテナ自体が
  // パン・ズーム操作で変形されるため、範囲自体は固定のままでよい）。
  region: MapRegion;
  // 環境省WBGT実況値（実データ）。都内に点在するこれらの地点から
  // 逆距離加重法で補間してタイルの色を決める。
  readings: TokyoWbgtReading[];
}

interface Tile {
  key: string;
  left: number;
  top: number;
  width: number;
  height: number;
  color: string;
}

// 指定座標のWBGTを、都内の実況値地点からの逆距離加重法（IDW）で推定する。
// 地点数が10地点程度と少ないため、あくまで粗い推定（都内全域を対象にした
// 高解像度メッシュではない）。readingsが空の場合はnullを返す。
const interpolateWbgt = (latitude: number, longitude: number, readings: TokyoWbgtReading[]): number | null => {
  if (readings.length === 0) return null;

  let weightedSum = 0;
  let weightSum = 0;
  for (const reading of readings) {
    const distanceKm = haversineDistanceKm(latitude, longitude, reading.latitude, reading.longitude);
    if (distanceKm < 0.05) return reading.wbgt; // ほぼ同一地点の場合はその値をそのまま使う
    const weight = 1 / distanceKm ** IDW_POWER;
    weightedSum += weight * reading.wbgt;
    weightSum += weight;
  }
  return weightedSum / weightSum;
};

/**
 * マップ上にWBGT危険度をタイル状のグリッドで重ねて表示するレイヤー。
 * 環境省「熱中症予防情報サイト」の実況値（都内10地点程度、`src/services/envWbgt.ts`）を
 * 逆距離加重法で補間した、実データに基づく（ただし低解像度な）ヒートマップ。
 * ネイティブ版は現在の地図の表示範囲全体を覆うため、広域表示・パン操作にも追従する。
 */
export const MapWbgtTileLayer: React.FC<Props> = ({ region, readings }) => {
  const tiles = useMemo(() => {
    if (readings.length === 0) return [];

    const latMin = region.latitude - region.latitudeDelta / 2;
    const latMax = region.latitude + region.latitudeDelta / 2;
    const lngMin = region.longitude - region.longitudeDelta / 2;
    const lngMax = region.longitude + region.longitudeDelta / 2;

    const result: Tile[] = [];
    for (let row = 0; row < GRID_ROWS; row++) {
      for (let col = 0; col < GRID_COLS; col++) {
        const cellLat = latMax - ((row + 0.5) / GRID_ROWS) * (latMax - latMin);
        const cellLng = lngMin + ((col + 0.5) / GRID_COLS) * (lngMax - lngMin);
        const wbgt = interpolateWbgt(cellLat, cellLng, readings);
        if (wbgt === null) continue;

        result.push({
          key: `${col}-${row}`,
          left: (col / GRID_COLS) * 100,
          top: (row / GRID_ROWS) * 100,
          width: 100 / GRID_COLS,
          height: 100 / GRID_ROWS,
          color: RISK_CONFIG[wbgtToRiskLevel(wbgt)].color,
        });
      }
    }
    return result;
  }, [region, readings]);

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {tiles.map((tile) => (
        <View
          key={tile.key}
          style={[
            styles.tile,
            {
              left: `${tile.left}%`,
              top: `${tile.top}%`,
              width: `${tile.width}%`,
              height: `${tile.height}%`,
              backgroundColor: tile.color,
            },
          ]}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  tile: {
    position: 'absolute',
    opacity: 0.4,
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.5)',
  },
});
