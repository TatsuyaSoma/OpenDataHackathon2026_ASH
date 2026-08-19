import { AppleMaps, CameraMoveEvent, GoogleMaps } from 'expo-maps';
import { BedDouble, LocateFixed } from 'lucide-react-native';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { LayoutChangeEvent, Platform, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MapDisplayControls } from '../components/MapDisplayControls';
import { MapLegendCard } from '../components/MapLegendCard';
import { MapMemberPin } from '../components/MapMemberPin';
import { MapSpotLegendBar } from '../components/MapSpotLegendBar';
import { MapSpotPin } from '../components/MapSpotPin';
import { MapWbgtReferenceBadge } from '../components/MapWbgtReferenceBadge';
import { MapWbgtTileLayer } from '../components/MapWbgtTileLayer';
import { colors, radius, spacing } from '../constants/theme';
import { useMembers } from '../context/MembersContext';
import { mockMapSpots } from '../data/mockData';
import { useNearbySpots } from '../hooks/use-nearby-spots';
import { useNearestWbgt } from '../hooks/use-nearest-wbgt';
import { useTokyoWaterSpots } from '../hooks/use-tokyo-water-spots';
import { useTokyoWbgtGrid } from '../hooks/use-tokyo-wbgt-grid';
import { MapSpot, Member } from '../types';
import { MAP_BOUNDS, MapRegion, projectToRegion } from '../utils/mapProjection';

/**
 * ネイティブ（iOS/Android）版マップ画面。expo-mapsで実際のApple Maps/Google Mapsを表示し、
 * その上にこのアプリ独自のメンバーピン（体力ゲージリング等）・スポットピンを重ねて描画する。
 *
 * 【重要】expo-maps（SDK 57時点）のmarkersプロパティは画像アイコンのみ対応で、
 * 体力ゲージや各種バッジを含むカスタムReactコンポーネントをマーカーとして表示できない。
 * また緯度経度→画面座標の変換API（プロジェクション）も提供されていない。
 * そのため、地図自体はexpo-mapsのネイティブビューに任せつつ、ピンは別レイヤーとして
 * 画面に絶対配置し、onCameraMoveで得られる表示範囲（中心座標＋緯度経度スパン）をもとに
 * 自前で線形補間して位置を計算する、という非公式の力技構成になっている
 * （対象エリアが都心の数km四方と狭いため、正確なWebメルカトル図法ではなく
 * 単純な線形補間で近似している。地図を大きく傾ける操作等には追従できない）。
 */

// 環境省WBGT実況値の「最寄り地点」を探す際の基準点（本人がいない場合のフォールバック中心）
const MAP_CENTER = {
  latitude: (MAP_BOUNDS.latMin + MAP_BOUNDS.latMax) / 2,
  longitude: (MAP_BOUNDS.lngMin + MAP_BOUNDS.lngMax) / 2,
};

interface Props {
  onOpenMemberDetail?: (member: Member) => void;
  // 指定時、マウント時（または値が変わるたび）にこのメンバーの位置へカメラをジャンプさせる。
  // ホーム画面のメンバーカードから「位置を見る」で遷移してきた場合に使う。
  focusMemberId?: string;
}

// ピンを画面端にクランプする際、アイコンが枠に隠れて見切れないようにする余白
const MEMBER_EDGE_MARGIN = 38;
const SPOT_EDGE_MARGIN = 18;

interface Size {
  width: number;
  height: number;
}

interface ScreenPosition {
  x: number; // ビューポートに対する0〜1の相対位置
  y: number;
  offscreenDirectionDeg?: number; // 表示範囲外に出てクランプした場合、実際の位置への方向（度、0=右・90=下）
}

// projectToRegionで得た（表示範囲外では0〜1の外に出うる）正規化座標を、
// 画面端にクランプした表示位置に変換する。
const toScreenPosition = (normalized: { x: number; y: number }, viewport: Size, margin: number): ScreenPosition => {
  if (viewport.width === 0 || viewport.height === 0) {
    return { x: normalized.x, y: normalized.y };
  }
  const screenX = normalized.x * viewport.width;
  const screenY = normalized.y * viewport.height;

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

// 初期カメラのズーム。都心の数ブロック程度が見える大きさの目安値
// （expo-mapsのcameraPositionは初期値のみで、以降はネイティブ地図が自身でパン/ズームを処理する）。
const INITIAL_ZOOM = 15;

export const MapScreen: React.FC<Props> = ({ onOpenMemberDetail, focusMemberId }) => {
  const { members } = useMembers();
  // 環境省WBGT実況値のうち、この地図が表示するエリアに最も近い地点の値（参考値）
  const { data: nearestWbgt } = useNearestWbgt(MAP_CENTER.latitude, MAP_CENTER.longitude);
  // 都内WBGT実況値（広域ヒートマップの逆距離加重補間に使う実データ）
  const { readings: wbgtReadings } = useTokyoWbgtGrid();
  const [heatmapEnabled, setHeatmapEnabled] = useState(true);
  const [membersEnabled, setMembersEnabled] = useState(true);
  const [convenienceEnabled, setConvenienceEnabled] = useState(true);
  const [vendingEnabled, setVendingEnabled] = useState(true);
  const [cafeEnabled, setCafeEnabled] = useState(true);
  const [waterEnabled, setWaterEnabled] = useState(true);
  const [disasterWaterEnabled, setDisasterWaterEnabled] = useState(true);

  const [viewportSize, setViewportSize] = useState<Size>({ width: 0, height: 0 });
  // 現在の地図の表示範囲（中心座標＋緯度経度スパン）。onCameraMoveは初回マウント時にも
  // 一度発火するため、地図が読み込まれ次第この値が入る。
  const [region, setRegion] = useState<MapRegion | null>(null);
  // タップして種別・名称のふきだしを表示中のスポット。もう一度同じピンをタップすると閉じる。
  const [selectedSpotId, setSelectedSpotId] = useState<string | null>(null);
  const handleSpotPress = useCallback((spot: MapSpot) => {
    setSelectedSpotId((current) => (current === spot.id ? null : spot.id));
  }, []);

  const handleMapAreaLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setViewportSize((prev) => (prev.width === width && prev.height === height ? prev : { width, height }));
  };

  const handleCameraMove = useCallback((event: CameraMoveEvent) => {
    const { latitude, longitude } = event.coordinates;
    if (latitude === undefined || longitude === undefined) return;
    setRegion({
      latitude,
      longitude,
      latitudeDelta: event.latitudeDelta,
      longitudeDelta: event.longitudeDelta,
    });
  }, []);

  const hasResting = members.some((m) => m.isResting);
  const selfMember = members.find((m) => m.isSelf);

  const mapRef = useRef<GoogleMaps.MapView | AppleMaps.MapView | null>(null);

  // 指定した緯度経度へ、決まったズーム値でカメラを移動させる
  const focusCamera = useCallback((latitude: number, longitude: number) => {
    mapRef.current?.setCameraPosition({ coordinates: { latitude, longitude }, zoom: INITIAL_ZOOM });
  }, []);

  // 現在地（本人の登録位置）に、決まったズーム値でカメラを戻す
  const handleRecenter = useCallback(() => {
    if (!selfMember) return;
    focusCamera(selfMember.location.latitude, selfMember.location.longitude);
  }, [selfMember, focusCamera]);

  // 指定したメンバーの位置へ、決まったズーム値でカメラをジャンプさせる。
  // 画面端の矢印バッジのタップ、およびホーム画面からの「位置を見る」遷移の両方で使う。
  const handleFocusMember = useCallback(
    (member: Member) => {
      focusCamera(member.location.latitude, member.location.longitude);
    },
    [focusCamera]
  );

  // focusMemberIdが変わった時にカメラをジャンプさせる（画面端の矢印バッジと同じ経路）。
  // ただし、マウント直後の初期値に対しては何もしない。マウント時点のfocusMemberIdは
  // すでにinitialCameraPositionで反映済みのため、ここで改めてsetCameraPositionを呼ぶと、
  // ネイティブ地図の初期化がまだ終わっていない（cameraStateが未セット）タイミングと重なり
  // Promiseのrejectで赤いエラー表示が出てしまう。以降、ユーザーがマップ画面を開いたまま
  // 別のメンバーの位置を指定してきた場合（＝地図はすでに初期化済み）だけ、ここでジャンプする。
  // さらに、上記の判定をすり抜けて画面遷移直後にここへ到達した場合の保険として、
  // 少し遅延させてから呼び出す（ネイティブ地図が初期化を終える猶予を与える）。
  const handledFocusMemberIdRef = useRef<string | undefined>(focusMemberId);
  useEffect(() => {
    if (!focusMemberId || handledFocusMemberIdRef.current === focusMemberId) return;
    handledFocusMemberIdRef.current = focusMemberId;
    const target = members.find((member) => member.id === focusMemberId);
    if (!target) return;
    const timeoutId = setTimeout(() => handleFocusMember(target), 400);
    return () => clearTimeout(timeoutId);
  }, [focusMemberId, members, handleFocusMember]);

  const memberPositions = useMemo(() => {
    if (!region) return {};
    const positions: Record<string, ScreenPosition> = {};
    members.forEach((member) => {
      const normalized = projectToRegion(member.location.latitude, member.location.longitude, region);
      positions[member.id] = toScreenPosition(normalized, viewportSize, MEMBER_EDGE_MARGIN);
    });
    return positions;
  }, [members, viewportSize, region]);

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
  if (region) {
    visibleSpots.forEach((spot) => {
      const normalized = projectToRegion(spot.latitude, spot.longitude, region);
      spotPositions[spot.id] = toScreenPosition(normalized, viewportSize, SPOT_EDGE_MARGIN);
    });
  }

  if (members.length === 0) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
        <View style={styles.header}>
          <Text style={styles.headerTitle}>マップ</Text>
        </View>
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>見守りメンバーが登録されていません。</Text>
        </View>
      </SafeAreaView>
    );
  }

  // 初期カメラ位置は、focusMemberIdが指定されていればそのメンバー、なければ本人（isSelf）を中心にする。
  // cameraPositionは初期値のみに使われ、以降のパン・ズーム操作はネイティブ地図が自前で処理する
  // （再レンダーで位置が戻ることはない）。focusMemberIdをここでも考慮しておくことで、
  // ネイティブ地図の初期化前にhandleFocusMemberの命令的な呼び出しが間に合わなくても、
  // 初期表示の時点で正しい位置が表示される。
  const focusMember = focusMemberId ? members.find((member) => member.id === focusMemberId) : undefined;
  const initialCameraPosition = {
    coordinates: {
      latitude: focusMember?.location.latitude ?? selfMember?.location.latitude ?? MAP_CENTER.latitude,
      longitude: focusMember?.location.longitude ?? selfMember?.location.longitude ?? MAP_CENTER.longitude,
    },
    zoom: INITIAL_ZOOM,
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>マップ</Text>
      </View>

      <View style={styles.mapArea} onLayout={handleMapAreaLayout}>
        <View style={styles.mapBackground}>
          {Platform.OS === 'ios' ? (
            <AppleMaps.View
              ref={mapRef as React.Ref<AppleMaps.MapView>}
              style={StyleSheet.absoluteFill}
              cameraPosition={initialCameraPosition}
              onCameraMove={handleCameraMove}
            />
          ) : (
            <GoogleMaps.View
              ref={mapRef as React.Ref<GoogleMaps.MapView>}
              style={StyleSheet.absoluteFill}
              cameraPosition={initialCameraPosition}
              onCameraMove={handleCameraMove}
            />
          )}

          {region && heatmapEnabled && <MapWbgtTileLayer region={region} readings={wbgtReadings} />}

          {region &&
            visibleSpots.map((spot) => (
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

          {region &&
            membersEnabled &&
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

        {region && heatmapEnabled && (
          <View style={styles.legendWrapper} pointerEvents="box-none">
            <MapLegendCard />
          </View>
        )}

        {heatmapEnabled && nearestWbgt && (
          <View style={styles.wbgtBadgeWrapper}>
            <MapWbgtReferenceBadge data={nearestWbgt} />
          </View>
        )}

        <View style={styles.rightColumn} pointerEvents="box-none">
          {selfMember && (
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
          />

          {hasResting && (
            <View style={styles.restingPill}>
              <BedDouble size={14} color={colors.primary} />
              <Text style={styles.restingPillText}>お休み中のメンバーあり</Text>
            </View>
          )}
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
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
    textAlign: 'center',
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
  legendWrapper: {
    position: 'absolute',
    top: spacing.md,
    left: spacing.md,
  },
  wbgtBadgeWrapper: {
    position: 'absolute',
    bottom: spacing.sm,
    left: 72,
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
  restingPill: {
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
    flexShrink: 1,
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
  bottomLegend: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
});
