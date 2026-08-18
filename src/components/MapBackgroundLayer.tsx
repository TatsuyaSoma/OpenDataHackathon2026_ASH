import React from 'react';
import { Image, StyleSheet } from 'react-native';

/**
 * マップ画面の背景レイヤー。
 * モックとして、実際のGoogleマップのスクリーンショット画像
 * （東京駅・日本橋・京橋・銀座付近、assets/images/map/tokyo-marunouchi-mock.png）を敷いている。
 * 実際の地図タイル連携（expo-maps等）はdevelopment buildが必要なため保留中
 * （詳細はgoogle-maps-integration.md）。ピンの座標系（src/utils/mapProjection.tsのMAP_BOUNDS）は
 * この画像が表す範囲に合わせて調整している。
 */
export const MapBackgroundLayer: React.FC = () => {
  return (
    <Image
      source={require('@/assets/images/map/tokyo-marunouchi-mock.png')}
      style={StyleSheet.absoluteFill}
      resizeMode="cover"
    />
  );
};
