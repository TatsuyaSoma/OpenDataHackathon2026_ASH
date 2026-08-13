import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, Pressable, TouchableOpacity } from 'react-native';
import { Check, MapPin, X } from 'lucide-react-native';
import { colors, spacing, radius } from '../constants/theme';

interface Props {
  visible: boolean;
  onClose: () => void;
  onConfirm: (address: string) => void;
}

// 実際の地図タイルはまだ導入していないため、マップ画面と同様の簡易背景（道路風の線＋地域ラベル）で
// 「地図らしさ」を演出したプレースホルダー上でピン位置を選ばせる。
const AREA_LABELS = [
  { name: '新宿区', x: 0.18, y: 0.22 },
  { name: '千代田区', x: 0.55, y: 0.32 },
  { name: '渋谷区', x: 0.22, y: 0.62 },
  { name: '港区', x: 0.5, y: 0.75 },
];

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

const nearestAreaName = (pin: { x: number; y: number }) => {
  let best = AREA_LABELS[0];
  let bestDistance = Infinity;
  AREA_LABELS.forEach((area) => {
    const distance = Math.hypot(area.x - pin.x, area.y - pin.y);
    if (distance < bestDistance) {
      bestDistance = distance;
      best = area;
    }
  });
  return best.name;
};

/**
 * 自宅住所をテキスト入力の代わりに地図上のピン指定で決定するモーダル。
 * 実際の地図タイル・逆ジオコーディングは未導入のため、タップした位置に最も近い
 * エリアラベルから「東京都〇〇区付近（地図で選択）」という住所文字列を仮生成する。
 */
export const AddressMapPickerModal: React.FC<Props> = ({ visible, onClose, onConfirm }) => {
  const [mapSize, setMapSize] = useState({ width: 0, height: 0 });
  const [pin, setPin] = useState<{ x: number; y: number } | null>(null);

  const handlePressMap = (event: { nativeEvent: { locationX: number; locationY: number } }) => {
    if (!mapSize.width || !mapSize.height) return;
    const { locationX, locationY } = event.nativeEvent;
    setPin({
      x: clamp01(locationX / mapSize.width),
      y: clamp01(locationY / mapSize.height),
    });
  };

  const handleConfirm = () => {
    if (!pin) return;
    onConfirm(`東京都${nearestAreaName(pin)}付近（地図で選択）`);
    setPin(null);
  };

  return (
    <Modal visible={visible} onRequestClose={onClose}>
      <View style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} hitSlop={8}>
            <X size={22} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>地図でピンをさす</Text>
          <View style={styles.headerSpacer} />
        </View>

        <Text style={styles.hint}>地図をタップして自宅の位置を指定してください。</Text>

        <View
          style={styles.mapArea}
          onLayout={(e) =>
            setMapSize({ width: e.nativeEvent.layout.width, height: e.nativeEvent.layout.height })
          }>
          <Pressable style={StyleSheet.absoluteFill} onPress={handlePressMap}>
            <View style={[styles.road, styles.roadHorizontal]} />
            <View style={[styles.road, styles.roadVertical]} />

            {AREA_LABELS.map((area) => (
              <Text
                key={area.name}
                style={[styles.areaLabel, { left: `${area.x * 100}%`, top: `${area.y * 100}%` }]}>
                {area.name}
              </Text>
            ))}

            {pin && (
              <View
                style={[styles.pinWrapper, { left: `${pin.x * 100}%`, top: `${pin.y * 100}%` }]}
                pointerEvents="none">
                <MapPin size={32} color={colors.primary} fill={colors.primary} />
              </View>
            )}
          </Pressable>
        </View>

        <TouchableOpacity
          style={[styles.confirmButton, !pin && styles.confirmButtonDisabled]}
          activeOpacity={0.8}
          disabled={!pin}
          onPress={handleConfirm}>
          <Check size={18} color="#FFFFFF" />
          <Text style={styles.confirmButtonText}>この位置に決定</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  headerSpacer: {
    width: 22,
  },
  hint: {
    fontSize: 12,
    color: colors.textSecondary,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  mapArea: {
    flex: 1,
    marginHorizontal: spacing.lg,
    borderRadius: radius.lg,
    overflow: 'hidden',
    backgroundColor: '#EAEFF2',
  },
  road: {
    position: 'absolute',
    backgroundColor: '#FFFFFF',
  },
  roadHorizontal: {
    top: '45%',
    left: 0,
    right: 0,
    height: 10,
  },
  roadVertical: {
    left: '30%',
    top: 0,
    bottom: 0,
    width: 8,
  },
  areaLabel: {
    position: 'absolute',
    fontSize: 13,
    fontWeight: '600',
    color: '#8A94A6',
  },
  pinWrapper: {
    position: 'absolute',
    transform: [{ translateX: -16 }, { translateY: -32 }],
  },
  confirmButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    marginHorizontal: spacing.lg,
    marginVertical: spacing.lg,
  },
  confirmButtonDisabled: {
    opacity: 0.4,
  },
  confirmButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    marginLeft: spacing.sm,
  },
});
