import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { RiskLevel } from '../types';
import { RISK_CONFIG } from '../constants/riskConfig';

const GRID_COLS = 8;
const GRID_ROWS = 8;

const RISK_LEVELS_BY_ORDER: RiskLevel[] = ['safeLight', 'safe', 'caution', 'warning', 'danger', 'severe'];

interface Tile {
  key: string;
  col: number;
  row: number;
  level: RiskLevel;
}

// 実測WBGTデータ連携までの仮表示。中心部ほど暑くなる緩やかな分布に、
// タイルごとの緩急をつけて自然な見た目にしている（数値そのものに意味はないダミー値）。
const mockTileLevel = (col: number, row: number): RiskLevel => {
  const centerCol = (GRID_COLS - 1) / 2;
  const centerRow = (GRID_ROWS - 1) / 2;
  const maxDistance = Math.hypot(centerCol, centerRow);
  const distance = Math.hypot(col - centerCol, row - centerRow);
  const wave = Math.sin(col * 0.9) * Math.cos(row * 0.7) * 0.15;
  const heat = 1 - distance / maxDistance + wave;
  const index = Math.min(
    RISK_LEVELS_BY_ORDER.length - 1,
    Math.max(0, Math.round(heat * (RISK_LEVELS_BY_ORDER.length - 1)))
  );
  return RISK_LEVELS_BY_ORDER[index];
};

/**
 * マップ上にWBGT危険度をタイル状のグリッドで重ねて表示するレイヤー。
 * 現状は実データ未連携のため、ダミー値による見た目確認用の実装。
 */
export const MapWbgtTileLayer: React.FC = () => {
  const tiles = useMemo(() => {
    const result: Tile[] = [];
    for (let row = 0; row < GRID_ROWS; row++) {
      for (let col = 0; col < GRID_COLS; col++) {
        result.push({ key: `${col}-${row}`, col, row, level: mockTileLevel(col, row) });
      }
    }
    return result;
  }, []);

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {tiles.map((tile) => (
        <View
          key={tile.key}
          style={[
            styles.tile,
            {
              left: `${(tile.col / GRID_COLS) * 100}%`,
              top: `${(tile.row / GRID_ROWS) * 100}%`,
              width: `${100 / GRID_COLS}%`,
              height: `${100 / GRID_ROWS}%`,
              backgroundColor: RISK_CONFIG[tile.level].color,
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
