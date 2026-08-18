import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MapPin as MapPinIcon, Map } from 'lucide-react-native';
import { LocationInfo } from '../types';
import { colors, spacing, radius } from '../constants/theme';
import { MapBackgroundLayer } from './MapBackgroundLayer';

interface Props {
  location: LocationInfo;
  onPressOpenMap: () => void;
}

/**
 * 現在地のプレビューカード。
 * 背景はモックとして実際のGoogleマップのスクリーンショット画像
 * （MapBackgroundLayer、東京駅・丸の内付近）を敷いている。ピンの位置は固定表示で、
 * 実際の緯度経度には連動していない。実際の地図タイル連携は expo-maps 等への置き換えが必要
 * （詳細は google-maps-integration.md）。
 */
export const MapPreviewCard: React.FC<Props> = ({ location, onPressOpenMap }) => {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>現在地</Text>
        <TouchableOpacity style={styles.button} onPress={onPressOpenMap} activeOpacity={0.7}>
          <Map size={14} color={colors.primary} />
          <Text style={styles.buttonText}>マップで確認</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.mapPlaceholder}>
        <MapBackgroundLayer />

        <Text style={[styles.placeLabel, { top: 10, left: 16 }]}>丸の内北口</Text>
        <Text style={[styles.placeLabel, { bottom: 14, right: 18 }]}>KITTE</Text>

        <View style={styles.pinWrapper}>
          <View style={styles.pinPulse} />
          <MapPinIcon size={28} color="#E53935" fill="#E53935" />
        </View>

        <Text style={styles.addressCaption} numberOfLines={1}>
          {location.address}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.cardBackground,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginBottom: spacing.md,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
  },
  buttonText: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '600',
    marginLeft: 4,
  },
  mapPlaceholder: {
    height: 160,
    borderRadius: radius.md,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeLabel: {
    position: 'absolute',
    fontSize: 10,
    fontWeight: '600',
    color: '#5B6470',
    backgroundColor: 'rgba(255,255,255,0.72)',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  pinWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  pinPulse: {
    position: 'absolute',
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(229, 57, 53, 0.18)',
  },
  addressCaption: {
    position: 'absolute',
    bottom: 6,
    left: 6,
    right: 6,
    fontSize: 10,
    color: '#5B6470',
    backgroundColor: 'rgba(255,255,255,0.85)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
});
