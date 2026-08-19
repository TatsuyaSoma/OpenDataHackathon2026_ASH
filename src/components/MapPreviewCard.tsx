import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { AppleMaps, GoogleMaps } from 'expo-maps';
import { MapPin as MapPinIcon, Map } from 'lucide-react-native';
import { LocationInfo } from '../types';
import { colors, spacing, radius } from '../constants/theme';

interface Props {
  location: LocationInfo;
  onPressOpenMap: () => void;
}

// プレビュー用の地図のズーム。ピンとその周辺の地名が分かる程度の大きさの目安値
const PREVIEW_ZOOM = 14;

/**
 * 現在地のプレビューカード。
 * iOS/Androidではexpo-mapsの実地図をそのメンバーの位置で小さく表示する（Webは非対応のため
 * プレースホルダーのまま）。カード内はスクロールリストの中に埋め込まれているため、地図自体の
 * パン・ズーム操作はさせず（AndroidはuiSettingsで無効化、iOSは無効化オプションが無いため、
 * 透明なタッチレイヤーで地図へのジェスチャーそのものを到達させない）、タップしたら実際の
 * マップ画面（そのメンバーの位置を中心に表示）を開く導線にしている。
 */
export const MapPreviewCard: React.FC<Props> = ({ location, onPressOpenMap }) => {
  const cameraPosition = {
    coordinates: { latitude: location.latitude, longitude: location.longitude },
    zoom: PREVIEW_ZOOM,
  };

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
        {Platform.OS === 'ios' ? (
          <AppleMaps.View style={StyleSheet.absoluteFill} cameraPosition={cameraPosition} />
        ) : Platform.OS === 'android' ? (
          <GoogleMaps.View
            style={StyleSheet.absoluteFill}
            cameraPosition={cameraPosition}
            uiSettings={{
              scrollGesturesEnabled: false,
              zoomGesturesEnabled: false,
              rotationGesturesEnabled: false,
              tiltGesturesEnabled: false,
              zoomControlsEnabled: false,
              compassEnabled: false,
              myLocationButtonEnabled: false,
            }}
          />
        ) : (
          <View style={styles.pinWrapper}>
            <View style={styles.pinPulse} />
            <MapPinIcon size={28} color="#E53935" fill="#E53935" />
          </View>
        )}

        {/* ネイティブ地図の手前を覆う透明なタッチレイヤー。iOSのAppleMaps.Viewはジェスチャーを
            無効化するオプションが無いため、タップ自体をここで先取りすることで、カード内の地図が
            スクロールリスト内でパン・ズームされてしまうのを防ぎつつ、タップでマップ画面を開けるようにする。 */}
        <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={0.85} onPress={onPressOpenMap} />

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
    backgroundColor: colors.background,
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
