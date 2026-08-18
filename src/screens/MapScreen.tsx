import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, StatusBar, LayoutChangeEvent } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { runOnJS, useSharedValue } from 'react-native-reanimated';
import { ArrowLeft, BedDouble } from 'lucide-react-native';
import { Member } from '../types';
import { colors, spacing, radius } from '../constants/theme';
import { mockMapSpots } from '../data/mockData';
import { useMembers } from '../context/MembersContext';
import { useNearbySpots } from '../hooks/use-nearby-spots';
import { MAP_BOUNDS, projectToMap } from '../utils/mapProjection';
import { MapLegendCard } from '../components/MapLegendCard';
import { MapDisplayControls } from '../components/MapDisplayControls';
import { MapSpotLegendBar } from '../components/MapSpotLegendBar';
import { MapMemberPin } from '../components/MapMemberPin';
import { MapSpotPin } from '../components/MapSpotPin';
import { MapWbgtTileLayer } from '../components/MapWbgtTileLayer';
import { MapBackgroundLayer } from '../components/MapBackgroundLayer';

interface Props {
  onBack?: () => void;
  onOpenMemberDetail?: (member: Member) => void;
}

// 背景画像・ピンの座標系を画面（ビューポート）よりひとまわり大きく持たせ、ドラッグして見回せるようにする倍率
const MAP_ZOOM = 1.6;
// ピンを画面端にクランプする際、アイコンが枠に隠れて見切れないようにする余白（メンバーピンはゲージ込みの半径ぶん確保）
const MEMBER_EDGE_MARGIN = 38;
const SPOT_EDGE_MARGIN = 18;

interface Size {
  width: number;
  height: number;
}

interface Offset {
  x: number;
  y: number;
}

interface ScreenPosition {
  x: number; // ビューポートに対する0〜1の相対位置
  y: number;
  offscreenDirectionDeg?: number; // 範囲外に出てクランプした場合、実際の位置への方向（度、0=右・90=下）
}

const clampPanOffset = (offset: Offset, viewport: Size): Offset => {
  if (viewport.width === 0 || viewport.height === 0) return offset;
  const minX = viewport.width - viewport.width * MAP_ZOOM;
  const minY = viewport.height - viewport.height * MAP_ZOOM;
  return {
    x: Math.min(0, Math.max(minX, offset.x)),
    y: Math.min(0, Math.max(minY, offset.y)),
  };
};

// 正規化座標（0〜1）を、現在のパン位置を反映したビューポート内の表示位置に変換する。
// 範囲外に出た場合は余白ぶん内側にクランプし、実際の位置への方向を添える。
const toScreenPosition = (
  normalized: { x: number; y: number },
  viewport: Size,
  panOffset: Offset,
  margin: number
): ScreenPosition => {
  if (viewport.width === 0 || viewport.height === 0) {
    return { x: normalized.x, y: normalized.y };
  }
  const screenX = normalized.x * viewport.width * MAP_ZOOM + panOffset.x;
  const screenY = normalized.y * viewport.height * MAP_ZOOM + panOffset.y;

  const clampedX = Math.min(Math.max(screenX, margin), viewport.width - margin);
  const clampedY = Math.min(Math.max(screenY, margin), viewport.height - margin);
  const offscreen = clampedX !== screenX || clampedY !== screenY;

  return {
    x: clampedX / viewport.width,
    y: clampedY / viewport.height,
    offscreenDirectionDeg: offscreen
      ? (Math.atan2(screenY - clampedY, screenX - clampedX) * 180) / Math.PI
      : undefined,
  };
};

export const MapScreen: React.FC<Props> = ({ onBack, onOpenMemberDetail }) => {
  const { members } = useMembers();
  const [heatmapEnabled, setHeatmapEnabled] = useState(true);
  const [membersEnabled, setMembersEnabled] = useState(true);
  const [convenienceEnabled, setConvenienceEnabled] = useState(true);
  const [vendingEnabled, setVendingEnabled] = useState(true);
  const [cafeEnabled, setCafeEnabled] = useState(true);
  const [waterEnabled, setWaterEnabled] = useState(true);

  // マップのドラッグ操作。表示は倍率MAP_ZOOM分だけビューポートより大きく、ドラッグして見回せる。
  // ドラッグの実処理はreact-native-gesture-handlerのGesture.Panで行う（PanResponderよりWeb上での
  // ポインタ追従が安定するため）。ジェスチャーのコールバックはUIスレッドのworkletとして動くため、
  // 座標計算はuseSharedValueで保持し、React側の状態（画面表示に使う）へはrunOnJS経由で反映する。
  const [viewportSize, setViewportSize] = useState<Size>({ width: 0, height: 0 });
  const [panOffset, setPanOffset] = useState<Offset>({ x: 0, y: 0 });
  const viewportWidthShared = useSharedValue(0);
  const viewportHeightShared = useSharedValue(0);
  const savedPanX = useSharedValue(0);
  const savedPanY = useSharedValue(0);
  const currentPanX = useSharedValue(0);
  const currentPanY = useSharedValue(0);

  const handleMapAreaLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    if (width === viewportSize.width && height === viewportSize.height) return;
    const nextViewport = { width, height };
    setViewportSize(nextViewport);
    viewportWidthShared.value = width;
    viewportHeightShared.value = height;

    // 初期表示は自分（本人）が画面中央に来るようにする
    const selfMember = members.find((member) => member.isSelf);
    const centerNormalized = selfMember
      ? projectToMap(selfMember.location.latitude, selfMember.location.longitude)
      : { x: 0.5, y: 0.5 };
    const centered = clampPanOffset(
      {
        x: width / 2 - centerNormalized.x * width * MAP_ZOOM,
        y: height / 2 - centerNormalized.y * height * MAP_ZOOM,
      },
      nextViewport
    );
    savedPanX.value = centered.x;
    savedPanY.value = centered.y;
    currentPanX.value = centered.x;
    currentPanY.value = centered.y;
    setPanOffset(centered);
  };

  const panGesture = Gesture.Pan()
    .minDistance(3)
    .onUpdate((event) => {
      const contentWidth = viewportWidthShared.value * MAP_ZOOM;
      const contentHeight = viewportHeightShared.value * MAP_ZOOM;
      const minX = viewportWidthShared.value - contentWidth;
      const minY = viewportHeightShared.value - contentHeight;
      currentPanX.value = Math.min(0, Math.max(minX, savedPanX.value + event.translationX));
      currentPanY.value = Math.min(0, Math.max(minY, savedPanY.value + event.translationY));
      runOnJS(setPanOffset)({ x: currentPanX.value, y: currentPanY.value });
    })
    .onEnd(() => {
      savedPanX.value = currentPanX.value;
      savedPanY.value = currentPanY.value;
    });

  const hasResting = members.some((m) => m.isResting);

  const memberPositions = useMemo(() => {
    const positions: Record<string, ScreenPosition> = {};
    members.forEach((member) => {
      const normalized = projectToMap(member.location.latitude, member.location.longitude);
      positions[member.id] = toScreenPosition(normalized, viewportSize, panOffset, MEMBER_EDGE_MARGIN);
    });
    return positions;
  }, [members, viewportSize, panOffset]);

  // コンビニ・自販機はOpenStreetMap(Overpass API)の実データを取得し、取得中・失敗時はモックにフォールバックする
  const { spots: liveSpots, status: liveSpotsStatus } = useNearbySpots(MAP_BOUNDS);
  const convenienceVendingSpots =
    liveSpotsStatus === 'success'
      ? liveSpots
      : mockMapSpots.filter((spot) => spot.type === 'convenience' || spot.type === 'vending');
  const waterCafeSpots = mockMapSpots.filter((spot) => spot.type === 'water' || spot.type === 'cafe');

  const visibleSpots = [...convenienceVendingSpots, ...waterCafeSpots].filter((spot) => {
    if (spot.type === 'convenience') return convenienceEnabled;
    if (spot.type === 'vending') return vendingEnabled;
    if (spot.type === 'cafe') return cafeEnabled;
    return waterEnabled; // water
  });

  const spotPositions: Record<string, ScreenPosition> = {};
  visibleSpots.forEach((spot) => {
    const normalized = projectToMap(spot.latitude, spot.longitude);
    spotPositions[spot.id] = toScreenPosition(normalized, viewportSize, panOffset, SPOT_EDGE_MARGIN);
  });

  if (members.length === 0) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack} hitSlop={8}>
            <ArrowLeft size={22} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>マップ</Text>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>見守りメンバーが登録されていません。</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} hitSlop={8}>
          <ArrowLeft size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>マップ</Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.mapArea} onLayout={handleMapAreaLayout}>
        <GestureDetector gesture={panGesture}>
          <View style={styles.mapBackground}>
            <View
              style={[
                styles.mapContent,
                {
                  width: viewportSize.width * MAP_ZOOM,
                  height: viewportSize.height * MAP_ZOOM,
                  transform: [{ translateX: panOffset.x }, { translateY: panOffset.y }],
                },
              ]}>
              <MapBackgroundLayer />
              {heatmapEnabled && <MapWbgtTileLayer />}
            </View>

            {visibleSpots.map((spot) => (
              <MapSpotPin
                key={spot.id}
                spot={spot}
                x={spotPositions[spot.id].x}
                y={spotPositions[spot.id].y}
                offscreen={spotPositions[spot.id].offscreenDirectionDeg !== undefined}
              />
            ))}

            {membersEnabled &&
              members.map((member) => (
                <MapMemberPin
                  key={member.id}
                  member={member}
                  x={memberPositions[member.id].x}
                  y={memberPositions[member.id].y}
                  onPress={onOpenMemberDetail}
                  offscreenDirectionDeg={memberPositions[member.id].offscreenDirectionDeg}
                />
              ))}
          </View>
        </GestureDetector>

        <View style={styles.legendWrapper} pointerEvents="box-none">
          <MapLegendCard />
        </View>

        {hasResting && (
          <View style={styles.restingPill}>
            <BedDouble size={14} color={colors.primary} />
            <Text style={styles.restingPillText}>お休み中のメンバーあり</Text>
          </View>
        )}

        <View style={styles.controlsWrapper}>
          <MapDisplayControls
            heatmapEnabled={heatmapEnabled}
            onToggleHeatmap={setHeatmapEnabled}
            membersEnabled={membersEnabled}
            onToggleMembers={setMembersEnabled}
            convenienceEnabled={convenienceEnabled}
            onToggleConvenience={setConvenienceEnabled}
            vendingEnabled={vendingEnabled}
            onToggleVending={setVendingEnabled}
            cafeEnabled={cafeEnabled}
            onToggleCafe={setCafeEnabled}
            waterEnabled={waterEnabled}
            onToggleWater={setWaterEnabled}
          />
        </View>
      </View>

      <View style={styles.bottomLegend}>
        <MapSpotLegendBar />
      </View>
    </SafeAreaView>
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
    fontSize: 17,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  headerSpacer: {
    width: 22,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  emptyStateText: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  mapArea: {
    flex: 1,
    marginHorizontal: spacing.lg,
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  mapBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  mapContent: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  legendWrapper: {
    position: 'absolute',
    top: spacing.md,
    left: spacing.md,
  },
  restingPill: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cardBackground,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.restBorder,
  },
  restingPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
    marginLeft: 6,
  },
  controlsWrapper: {
    position: 'absolute',
    top: 64,
    right: spacing.md,
  },
  bottomLegend: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
});
