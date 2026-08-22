import { LocateFixed } from 'lucide-react-native';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { LayoutChangeEvent, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { runOnJS, useSharedValue } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MapBackgroundLayer } from '../components/MapBackgroundLayer';
import { MapDisplayControls } from '../components/MapDisplayControls';
import { MapMemberPin } from '../components/MapMemberPin';
import { MapSpotPin } from '../components/MapSpotPin';
import { MapWbgtReferenceBadge } from '../components/MapWbgtReferenceBadge';
import { MapWbgtTileLayer } from '../components/MapWbgtTileLayer';
import { colors, radius, spacing } from '../constants/theme';
import { useMembers } from '../context/MembersContext';
import { mockMapSpots } from '../data/mockData';
import { useNearbySpots } from '../hooks/use-nearby-spots';
import { useNearestWbgt } from '../hooks/use-nearest-wbgt';
import { useTokyoLandCover } from '../hooks/use-tokyo-land-cover';
import { useTokyoWaterSpots } from '../hooks/use-tokyo-water-spots';
import { useTokyoWbgtGrid } from '../hooks/use-tokyo-wbgt-grid';
import { MapSpot, Member } from '../types';
import { MAP_BOUNDS, projectToMap } from '../utils/mapProjection';

// 環境省WBGT実況値の「最寄り地点」を探す際の基準点（地図表示範囲の中心＝丸の内周辺）
const MAP_CENTER = {
  latitude: (MAP_BOUNDS.latMin + MAP_BOUNDS.latMax) / 2,
  longitude: (MAP_BOUNDS.lngMin + MAP_BOUNDS.lngMax) / 2,
};

// MapWbgtTileLayer用の表示範囲。Web版はネイティブ版と異なりカメラの実表示範囲を取得できないが、
// タイル自体はMAP_ZOOM分だけ拡大・パンされたコンテナ（mapContent）の内側に100%で敷いており、
// そのコンテナがちょうどMAP_BOUNDSに対応するため、この固定範囲をそのまま使えばよい。
const WBGT_TILE_REGION = {
  latitude: MAP_CENTER.latitude,
  longitude: MAP_CENTER.longitude,
  latitudeDelta: MAP_BOUNDS.latMax - MAP_BOUNDS.latMin,
  longitudeDelta: MAP_BOUNDS.lngMax - MAP_BOUNDS.lngMin,
};

interface Props {
  onOpenMemberDetail?: (member: Member) => void;
  // 指定時、マウント時（または値が変わるたび）にこのメンバーの位置へパン位置をジャンプさせる。
  // ホーム画面のメンバーカードから「位置を見る」で遷移してきた場合に使う。
  focusMemberId?: string;
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

// 指定した地点（本人がいない場合はマップ中央）が画面中央に来るパン位置を、決まったズーム値(MAP_ZOOM)で算出する
const computeCenteredPanOffset = (viewport: Size, target?: { latitude: number; longitude: number }): Offset => {
  const centerNormalized = target ? projectToMap(target.latitude, target.longitude) : { x: 0.5, y: 0.5 };
  return clampPanOffset(
    {
      x: viewport.width / 2 - centerNormalized.x * viewport.width * MAP_ZOOM,
      y: viewport.height / 2 - centerNormalized.y * viewport.height * MAP_ZOOM,
    },
    viewport
  );
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

export const MapScreen: React.FC<Props> = ({ onOpenMemberDetail, focusMemberId }) => {
  const { members } = useMembers();
  // 環境省WBGT実況値のうち、この地図が表示するエリアに最も近い地点の値（参考値）
  const { data: nearestWbgt } = useNearestWbgt(MAP_CENTER.latitude, MAP_CENTER.longitude);
  // 都内WBGT実況値（広域ヒートマップの逆距離加重補間に使う実データ）
  const { readings: wbgtReadings } = useTokyoWbgtGrid();
  // ヒートマップに「水辺・緑地に近いほど涼しい」補正をかけるための実データ（河川・公園緑地の位置）
  const { features: coolingFeatures } = useTokyoLandCover();
  const [heatmapEnabled, setHeatmapEnabled] = useState(true);
  const [membersEnabled, setMembersEnabled] = useState(true);
  const [convenienceEnabled, setConvenienceEnabled] = useState(true);
  const [vendingEnabled, setVendingEnabled] = useState(true);
  const [cafeEnabled, setCafeEnabled] = useState(true);
  const [waterEnabled, setWaterEnabled] = useState(true);
  const [disasterWaterEnabled, setDisasterWaterEnabled] = useState(true);
  // 表示設定パネルの開閉状態。展開中はメンバー・スポットのピンより手前に表示するため、
  // rightColumnの重なり順をこの値で切り替える。
  const [filterExpanded, setFilterExpanded] = useState(false);
  // タップして種別・名称のふきだしを表示中のスポット。もう一度同じピンをタップすると閉じる。
  const [selectedSpotId, setSelectedSpotId] = useState<string | null>(null);
  const handleSpotPress = useCallback((spot: MapSpot) => {
    setSelectedSpotId((current) => (current === spot.id ? null : spot.id));
  }, []);

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
    const centered = computeCenteredPanOffset(nextViewport, selfMember?.location);
    savedPanX.value = centered.x;
    savedPanY.value = centered.y;
    currentPanX.value = centered.x;
    currentPanY.value = centered.y;
    setPanOffset(centered);
  };

  // 指定した位置（本人の登録位置、または任意のメンバーの位置）が画面中央に来るよう、
  // 決まったズーム値(MAP_ZOOM)でパン位置をジャンプさせる。
  const focusOnLocation = useCallback(
    (location?: { latitude: number; longitude: number }) => {
      const centered = computeCenteredPanOffset(viewportSize, location);
      savedPanX.value = centered.x;
      savedPanY.value = centered.y;
      currentPanX.value = centered.x;
      currentPanY.value = centered.y;
      setPanOffset(centered);
    },
    [viewportSize, savedPanX, savedPanY, currentPanX, currentPanY]
  );

  // 現在地（本人の登録位置）に、決まったズーム値(MAP_ZOOM)でパン位置を戻す
  const handleRecenter = useCallback(() => {
    const selfMember = members.find((member) => member.isSelf);
    focusOnLocation(selfMember?.location);
  }, [members, focusOnLocation]);

  // 画面端の矢印バッジのタップ、およびホーム画面からの「位置を見る」遷移の両方で使う。
  const handleFocusMember = useCallback(
    (member: Member) => {
      focusOnLocation(member.location);
    },
    [focusOnLocation]
  );

  useEffect(() => {
    if (!focusMemberId) return;
    const target = members.find((member) => member.id === focusMemberId);
    if (target) handleFocusMember(target);
  }, [focusMemberId, members, handleFocusMember]);

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

  const memberPositions = useMemo(() => {
    const positions: Record<string, ScreenPosition> = {};
    members.forEach((member) => {
      const normalized = projectToMap(member.location.latitude, member.location.longitude);
      positions[member.id] = toScreenPosition(normalized, viewportSize, panOffset, MEMBER_EDGE_MARGIN);
    });
    return positions;
  }, [members, viewportSize, panOffset]);

  // コンビニ・自販機・カフェはOpenStreetMap(Overpass API)、給水スポット・災害時給水は
  // 東京都水道局のオープンデータの実データを取得し、取得中・失敗時はモックにフォールバックする
  const { spots: liveOsmSpots, status: liveOsmSpotsStatus } = useNearbySpots(MAP_BOUNDS);
  const osmSpots =
    liveOsmSpotsStatus === 'success'
      ? liveOsmSpots
      : mockMapSpots.filter((spot) => spot.type === 'convenience' || spot.type === 'vending' || spot.type === 'cafe');

  const { drinkingSpots, disasterSpots, status: waterSpotsStatus } = useTokyoWaterSpots(MAP_BOUNDS);
  const waterSpots =
    waterSpotsStatus === 'success' ? drinkingSpots : mockMapSpots.filter((spot) => spot.type === 'water');
  const disasterWaterSpots =
    waterSpotsStatus === 'success' ? disasterSpots : mockMapSpots.filter((spot) => spot.type === 'disasterWater');

  const visibleSpots = [...osmSpots, ...waterSpots, ...disasterWaterSpots].filter((spot) => {
    if (spot.type === 'convenience') return convenienceEnabled;
    if (spot.type === 'vending') return vendingEnabled;
    if (spot.type === 'cafe') return cafeEnabled;
    if (spot.type === 'disasterWater') return disasterWaterEnabled;
    return waterEnabled; // water
  });

  const spotPositions: Record<string, ScreenPosition> = {};
  visibleSpots.forEach((spot) => {
    const normalized = projectToMap(spot.latitude, spot.longitude);
    spotPositions[spot.id] = toScreenPosition(normalized, viewportSize, panOffset, SPOT_EDGE_MARGIN);
  });

  if (members.length === 0) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>見守りメンバーが登録されていません。</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

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
              {heatmapEnabled && (
                <MapWbgtTileLayer
                  region={WBGT_TILE_REGION}
                  readings={wbgtReadings}
                  coolingFeatures={coolingFeatures}
                />
              )}
            </View>

            {visibleSpots.map((spot) => (
              <MapSpotPin
                key={spot.id}
                spot={spot}
                x={spotPositions[spot.id].x}
                y={spotPositions[spot.id].y}
                offscreen={spotPositions[spot.id].offscreenDirectionDeg !== undefined}
                selected={selectedSpotId === spot.id}
                onPress={handleSpotPress}
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
                  onPressOffscreenIndicator={handleFocusMember}
                />
              ))}
          </View>
        </GestureDetector>

        <View style={styles.bottomAttributionRow} pointerEvents="none">
          <View style={styles.googleAttribution}>
            <Text style={styles.googleLogo}>Google</Text>
          </View>
          {heatmapEnabled && nearestWbgt && <MapWbgtReferenceBadge data={nearestWbgt} />}
        </View>

        <View
          style={[styles.rightColumn, filterExpanded && styles.rightColumnRaised]}
          pointerEvents="box-none">
          {members.some((member) => member.isSelf) && (
            <TouchableOpacity
              style={styles.recenterButton}
              activeOpacity={0.8}
              onPress={handleRecenter}>
              <LocateFixed size={18} color={colors.primary} />
            </TouchableOpacity>
          )}

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
            disasterWaterEnabled={disasterWaterEnabled}
            onToggleDisasterWater={setDisasterWaterEnabled}
            onExpandedChange={setFilterExpanded}
          />
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
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
  bottomAttributionRow: {
    position: 'absolute',
    bottom: spacing.sm,
    left: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  googleAttribution: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 3,
    paddingVertical: 1,
  },
  googleLogo: {
    fontSize: 10,
    fontWeight: '500',
    color: '#4285F4',
  },
  // 右上に「現在地ボタン→表示設定→お休み中バナー」を縦に積むコンテナ。
  // 個別にposition:absoluteで配置すると、凡例カードや実況バッジと横方向に衝突しやすいため、
  // 1つの縦積みレイアウトにまとめて重なりを防いでいる。
  rightColumn: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    alignItems: 'flex-end',
    gap: spacing.sm,
    maxWidth: '60%',
  },
  // 表示設定パネルを展開している間だけ、メンバー・スポットのピンより手前に表示する
  // （ピン自体は画面端にクランプされた際に見えなくならないよう、通常はこのボタン列より
  // 手前＝後に描画しているため、パネルが開いている間はこちらのzIndexを引き上げて逆転させる）。
  rightColumnRaised: {
    zIndex: 10,
    elevation: 10,
  },
  recenterButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.cardBackground,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
});
