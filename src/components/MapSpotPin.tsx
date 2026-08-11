import React from 'react';
import { View, StyleSheet } from 'react-native';
import { MapSpot } from '../types';
import { MAP_SPOT_CONFIG } from '../constants/mapSpotConfig';

interface Props {
  spot: MapSpot;
}

/**
 * コンビニ・自販機・給水スポット・カフェを表すピン。
 * 角丸の四角形＋下端の小さな三角（tail）でマップピン風の見た目にしている。
 */
export const MapSpotPin: React.FC<Props> = ({ spot }) => {
  const config = MAP_SPOT_CONFIG[spot.type];

  return (
    <View
      style={[
        styles.wrapper,
        { left: `${spot.x * 100}%`, top: `${spot.y * 100}%` },
      ]}
      pointerEvents="none">
      <View style={[styles.body, { backgroundColor: config.color }]}>
        <config.Icon size={14} color="#FFFFFF" />
      </View>
      <View style={[styles.tail, { backgroundColor: config.color }]} />
    </View>
  );
};

const SIZE = 26;

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    alignItems: 'center',
    transform: [{ translateX: -SIZE / 2 }, { translateY: -SIZE }],
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
});
