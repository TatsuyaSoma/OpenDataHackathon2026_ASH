import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MapPin as MapPinIcon, Map } from 'lucide-react-native';
import { LocationInfo } from '../types';
import { colors, spacing, radius } from '../constants/theme';

interface Props {
  location: LocationInfo;
  onPressOpenMap: () => void;
}

/**
 * 現在地のプレビューカード。
 * モックのため実際の地図タイルは使用せず、道路風の線と地名ラベルで
 * 「地図らしさ」を演出したプレースホルダーを表示している。
 * 実装時は react-native-maps 等の地図コンポーネントに置き換える想定。
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
        {/* 道路風の飾り線（モック表示） */}
        <View style={[styles.road, styles.roadHorizontal]} />
        <View style={[styles.road, styles.roadVertical]} />

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
    backgroundColor: '#EAEFF2',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  road: {
    position: 'absolute',
    backgroundColor: '#FFFFFF',
  },
  roadHorizontal: {
    top: '55%',
    left: 0,
    right: 0,
    height: 10,
  },
  roadVertical: {
    left: '20%',
    top: 0,
    bottom: 0,
    width: 8,
  },
  placeLabel: {
    position: 'absolute',
    fontSize: 10,
    color: '#5B6470',
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
