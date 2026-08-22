import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { RISK_CONFIG } from '../constants/riskConfig';
import { CoolingFeature } from '../services/tokyoLandCover';
import { MapRegion } from '../utils/mapProjection';
import { TokyoWbgtReading, haversineDistanceKm, wbgtToRiskLevel } from '../services/envWbgt';

const GRID_COLS = 10;
const GRID_ROWS = 10;

// 逆距離加重法（IDW）の減衰の強さ。値が大きいほど、近い地点の実況値の影響が強くなる
// （距離が離れるほど急激に重みが下がり、遠い地点同士の値が平均化されにくくなる）。
const IDW_POWER = 2;

// 水辺・緑地からの距離に応じた冷却量（WBGT換算）。水面・緑地周辺で気温が下がる
// 「クールアイランド効果」を簡易的にモデル化したもので、ごく近傍ほど効果が大きく、
// 半径の外側では効果なし（直線的に減衰）とする。水面は蒸発冷却が大きいため、
// 緑地よりも効果を大きく・広めに設定している。
// タイルは10x10の粗いグリッドで、表示範囲が広いほど1マスが数百m四方になりうるため、
// 半径はマス目の中心が実際の水辺・緑地に十分な確率で入る大きさを確保している
// （光が丘公園のような数百m四方の公園を1点の座標で近似している都合上、
// 半径を公園自体の広さと同程度以上に広げないと、どのマスの中心も範囲内に入らないことがある）。
const WATER_COOLING_MAX_WBGT = 2.5;
const WATER_COOLING_RADIUS_KM = 0.7;
const GREEN_COOLING_MAX_WBGT = 1.5;
const GREEN_COOLING_RADIUS_KM = 0.5;

// coolingFeaturesは都内全域に散らばる数百件の実データで、タイル1マスごと（最大100マス）に
// 全件との距離を求めるとhaversine（三角関数を使う正確な距離計算）の呼び出しが数万回に達し、
// 地図をパンするたびに毎回走ることになる。半径の外にあることが緯度経度の単純な差だけで
// 明らかな地点は、その安価なチェックだけでhaversineの呼び出し自体を省略する
// （東京近辺＝北緯35〜36度を前提にした、km→度のおおまかな換算。経度方向は実際より
// 広めに見積もっている＝誤って除外することはない）。
const MAX_COOLING_RADIUS_KM = Math.max(WATER_COOLING_RADIUS_KM, GREEN_COOLING_RADIUS_KM);
const MAX_COOLING_RADIUS_LAT_DEG = MAX_COOLING_RADIUS_KM / 111;
const MAX_COOLING_RADIUS_LNG_DEG = MAX_COOLING_RADIUS_KM / 91;

interface Props {
  // 現在の地図の表示範囲。ネイティブ版はonCameraMoveから得た実際のカメラ位置、
  // Web版はMAP_BOUNDS相当の固定範囲を渡す（Web側は表示コンテナ自体が
  // パン・ズーム操作で変形されるため、範囲自体は固定のままでよい）。
  region: MapRegion;
  // 環境省WBGT実況値（実データ）。都内に点在するこれらの地点から
  // 逆距離加重法で補間してタイルの色を決める。
  readings: TokyoWbgtReading[];
  // 河川・公園緑地の位置（実データ）。IDW補間だけでは実況値地点が疎らすぎて
  // 地図の表示範囲内がほぼ同じ色になってしまうため、これらの近くのタイルを追加で
  // 冷却する補正をかけ、水辺・緑地は涼しく／それ以外の市街地は暑いままというメリハリを出す。
  coolingFeatures: CoolingFeature[];
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

// 指定座標に最も近い水辺・緑地からの冷却量（WBGT換算、常に0以上）を求める。
// 複数の地点が近くにあっても単純合算はせず、種別（水辺／緑地）ごとに最も効果が大きい
// 1件だけを採用する（同じ種類の効果が近接して重なっても物理的に効果が倍加するわけではないため）。
const calculateCooling = (latitude: number, longitude: number, features: CoolingFeature[]): number => {
  let waterCooling = 0;
  let greenCooling = 0;

  for (const feature of features) {
    if (
      Math.abs(feature.latitude - latitude) > MAX_COOLING_RADIUS_LAT_DEG ||
      Math.abs(feature.longitude - longitude) > MAX_COOLING_RADIUS_LNG_DEG
    ) {
      continue;
    }

    const distanceKm = haversineDistanceKm(latitude, longitude, feature.latitude, feature.longitude);
    if (feature.kind === 'water') {
      if (distanceKm >= WATER_COOLING_RADIUS_KM) continue;
      const cooling = WATER_COOLING_MAX_WBGT * (1 - distanceKm / WATER_COOLING_RADIUS_KM);
      waterCooling = Math.max(waterCooling, cooling);
    } else {
      if (distanceKm >= GREEN_COOLING_RADIUS_KM) continue;
      const cooling = GREEN_COOLING_MAX_WBGT * (1 - distanceKm / GREEN_COOLING_RADIUS_KM);
      greenCooling = Math.max(greenCooling, cooling);
    }
  }

  return waterCooling + greenCooling;
};

/**
 * マップ上にWBGT危険度をタイル状のグリッドで重ねて表示するレイヤー。
 * 環境省「熱中症予防情報サイト」の実況値（都内10地点程度、`src/services/envWbgt.ts`）を
 * 逆距離加重法で補間した、実データに基づく（ただし低解像度な）ヒートマップ。
 * ネイティブ版は現在の地図の表示範囲全体を覆うため、広域表示・パン操作にも追従する。
 * さらに、実況値地点の疎らさだけでは出せない面的なメリハリを補うため、河川・公園緑地の
 * 実データ（`coolingFeatures`）に近いタイルほど涼しく補正する。
 */
export const MapWbgtTileLayer: React.FC<Props> = ({ region, readings, coolingFeatures }) => {
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

        const cooling = calculateCooling(cellLat, cellLng, coolingFeatures);
        const correctedWbgt = wbgt - cooling;

        result.push({
          key: `${col}-${row}`,
          left: (col / GRID_COLS) * 100,
          top: (row / GRID_ROWS) * 100,
          width: 100 / GRID_COLS,
          height: 100 / GRID_ROWS,
          color: RISK_CONFIG[wbgtToRiskLevel(correctedWbgt)].color,
        });
      }
    }
    return result;
  }, [region, readings, coolingFeatures]);

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
