import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MapSpot } from '../types';
import { MAP_SPOT_CONFIG } from '../constants/mapSpotConfig';
import { colors, radius } from '../constants/theme';

interface Props {
  spot: MapSpot;
  x: number; // マップ表示エリア内の水平位置（0〜1）
  y: number; // マップ表示エリア内の垂直位置（0〜1）
  // ドラッグして表示範囲外に出た場合、画面端にクランプして表示する際は少し薄く見せる
  offscreen?: boolean;
  // タップして選択中かどうか。選択中は種別・名称を表示するふきだしを出す
  selected?: boolean;
  onPress?: (spot: MapSpot) => void;
}

/**
 * コンビニ・自販機・給水スポット・カフェを表すピン。
 * 角丸の四角形＋下端の小さな三角（tail）でマップピン風の見た目にしている。
 * タップすると種別・名称を表示するふきだしが開く（もう一度タップすると閉じる）。
 */
export const MapSpotPin: React.FC<Props> = ({ spot, x, y, offscreen, selected, onPress }) => {
  const config = MAP_SPOT_CONFIG[spot.type];

  return (
    <View
      style={[
        styles.wrapper,
        { left: `${x * 100}%`, top: `${y * 100}%` },
        offscreen && styles.wrapperOffscreen,
      ]}
      pointerEvents="box-none">
      {selected && (
        <View style={styles.callout} pointerEvents="none">
          <Text style={styles.calloutType}>{config.label}</Text>
          <Text style={styles.calloutName} numberOfLines={2}>
            {spot.name}
          </Text>
        </View>
      )}

      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => onPress?.(spot)}
        style={[styles.body, { backgroundColor: config.color }]}>
        <config.Icon size={14} color="#FFFFFF" />
      </TouchableOpacity>
      <View style={[styles.tail, { backgroundColor: config.color }]} pointerEvents="none" />
    </View>
  );
};

const SIZE = 26;
const CALLOUT_WIDTH = 150;

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    alignItems: 'center',
    transform: [{ translateX: -SIZE / 2 }, { translateY: -SIZE }],
  },
  wrapperOffscreen: {
    opacity: 0.6,
  },
  body: {
    width: SIZE,
    height: SIZE,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  tail: {
    width: 8,
    height: 8,
    marginTop: -5,
    transform: [{ rotate: '45deg' }],
    borderRadius: 1,
  },
  callout: {
    position: 'absolute',
    bottom: SIZE + 6,
    left: -(CALLOUT_WIDTH - SIZE) / 2,
    width: CALLOUT_WIDTH,
    alignItems: 'center',
    backgroundColor: colors.cardBackground,
    borderRadius: radius.md,
    paddingHorizontal: 10,
    paddingVertical: 6,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  calloutType: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  calloutName: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textPrimary,
    textAlign: 'center',
  },
});
