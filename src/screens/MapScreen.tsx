import { AppleMaps, CameraMoveEvent, GoogleMaps } from 'expo-maps';
import { LocateFixed } from 'lucide-react-native';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { LayoutChangeEvent, Platform, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
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
import { MAP_BOUNDS, MapRegion, projectToRegion, regionToBounds } from '../utils/mapProjection';

// 地図の移動が落ち着いてから周辺スポットを取得し直すまでの待ち時間。
// onCameraMoveはドラッグ中に連続発火するため、そのたびに範囲を変えて取得すると
// Overpass API（無料の共用サービス）への過剰な連打になってしまう。
const SPOT_BOUNDS_DEBOUNCE_MS = 600;

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
// 画面端にクランプした表示位置に変換する。呼び出し側でviewportが実測済み（幅・高さとも0より大きい）
// であることを保証している（mapReady判定）。
const toScreenPosition = (normalized: { x: number; y: number }, viewport: Size, margin: number): ScreenPosition => {
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

// 画面外にクランプされたメンバーピン同士が完全に重なるのを防ぐための、辺沿いのずらし幅。
const OFFSCREEN_SPREAD_PX = 34;

// メンバーピンの表示位置を計算する。toScreenPositionと同じクランプ方式だが、
// 練馬・調布のように離れた場所にまとまって住んでいるメンバーが同時に画面外へ出た場合、
// 素朴にクランプするだけだと全員が画面端の同じ位置に重なってしまい、後ろのアイコンが
// 隠れて「消えた」ように見えてしまう。そこで、同じ辺にクランプされたメンバーが複数いる場合は、
// その辺に沿って少しずつ位置をずらし、全員のアイコンが見えるようにする
// （矢印バッジが示す方向自体は、ずらす前の本来の位置への方向を使う）。
// 呼び出し側でviewportが実測済み（幅・高さとも0より大きい）であることを保証している（mapReady判定）。
const computeMemberPositions = (
  members: Member[],
  region: MapRegion,
  viewport: Size,
  margin: number
): Record<string, ScreenPosition> => {
  const raws = members.map((member) => {
    const normalized = projectToRegion(member.location.latitude, member.location.longitude, region);
    const screenX = normalized.x * viewport.width;
    const screenY = normalized.y * viewport.height;
    const clampedX = Math.min(Math.max(screenX, margin), viewport.width - margin);
    const clampedY = Math.min(Math.max(screenY, margin), viewport.height - margin);
    // クランプされた辺を表すキー（例: 上端かつ左端なら"TL"）。空文字なら画面内。
    const edgeKey =
      (clampedY !== screenY ? (screenY < clampedY ? 'T' : 'B') : '') +
      (clampedX !== screenX ? (screenX < clampedX ? 'L' : 'R') : '');
    return { member, screenX, screenY, clampedX, clampedY, edgeKey };
  });

  const groups = new Map<string, typeof raws>();
  raws.forEach((raw) => {
    if (!raw.edgeKey) return;
    const group = groups.get(raw.edgeKey);
    if (group) group.push(raw);
    else groups.set(raw.edgeKey, [raw]);
  });

  const spreadOffsetById = new Map<string, { dx: number; dy: number }>();
  groups.forEach((group, edgeKey) => {
    if (group.length <= 1) return;
    // 上端・下端にクランプされている場合は横方向へ、左端・右端の場合は縦方向へ並べる。
    const spreadHorizontally = edgeKey.includes('T') || edgeKey.includes('B');
    const sorted = [...group].sort((a, b) => a.member.id.localeCompare(b.member.id));
    sorted.forEach((raw, index) => {
      const offset = (index - (sorted.length - 1) / 2) * OFFSCREEN_SPREAD_PX;
      spreadOffsetById.set(raw.member.id, spreadHorizontally ? { dx: offset, dy: 0 } : { dx: 0, dy: offset });
    });
  });

  const positions: Record<string, ScreenPosition> = {};
  raws.forEach((raw) => {
    const spread = spreadOffsetById.get(raw.member.id);
    const finalX = Math.min(Math.max(raw.clampedX + (spread?.dx ?? 0), margin), viewport.width - margin);
    const finalY = Math.min(Math.max(raw.clampedY + (spread?.dy ?? 0), margin), viewport.height - margin);
    positions[raw.member.id] = {
      x: finalX / viewport.width,
      y: finalY / viewport.height,
      offscreenDirectionDeg: raw.edgeKey
        ? (Math.atan2(raw.screenY - raw.clampedY, raw.screenX - raw.clampedX) * 180) / Math.PI
        : undefined,
    };
  });
  return positions;
};

// 初期カメラのズーム。都心の数ブロック程度が見える大きさの目安値
// （expo-mapsのcameraPositionは初期値のみで、以降はネイティブ地図が自身でパン/ズームを処理する）。
const INITIAL_ZOOM = 15;

export const MapScreen: React.FC<Props> = ({ onOpenMemberDetail, focusMemberId }) => {
  const { members } = useMembers();
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

  // regionとviewportSizeは別々の非同期タイミングで揃う（regionはonCameraMove、
  // viewportSizeはコンテナのonLayout）。地図起動直後や特定メンバーへのジャンプ直後は、
  // regionが先に確定してviewportSizeがまだ{0,0}のまま、という順序になることがある。
  // その状態でピン位置を計算すると、画面中央にいるメンバー以外は不正な位置に飛んでしまい
  // 実質的に見えなくなるため、両方揃うまではピンそのものを描画しない。
  const mapReady = region !== null && viewportSize.width > 0 && viewportSize.height > 0;

  const memberPositions = useMemo(() => {
    if (!mapReady || !region) return {};
    return computeMemberPositions(members, region, viewportSize, MEMBER_EDGE_MARGIN);
  }, [members, viewportSize, region, mapReady]);

  // コンビニ・自販機・カフェ・給水スポット等は、地図の表示範囲が変わるたびに取得し直す。
  // 表示範囲そのもの（region）を直接使うと、ドラッグ中の連続発火のたびに取得してしまうため、
  // 移動が落ち着いてから確定する値（spotBounds）を別に持つ。region取得前（起動直後）は
  // MAP_BOUNDS（丸の内・日本橋周辺の固定範囲）を初期値として使う。
  const [spotBounds, setSpotBounds] = useState(MAP_BOUNDS);
  useEffect(() => {
    if (!region) return;
    const timeoutId = setTimeout(() => {
      setSpotBounds(regionToBounds(region));
    }, SPOT_BOUNDS_DEBOUNCE_MS);
    return () => clearTimeout(timeoutId);
  }, [region]);

  // 「参考WBGT」バッジも、spotBoundsと同じデバウンス済みの表示範囲を使い、
  // 中心に最も近い環境省実況値地点を追従させる（region取得前はMAP_BOUNDS中心＝丸の内周辺）。
  const referenceWbgtCenter = useMemo(
    () => ({
      latitude: (spotBounds.latMin + spotBounds.latMax) / 2,
      longitude: (spotBounds.lngMin + spotBounds.lngMax) / 2,
    }),
    [spotBounds]
  );
  const { data: nearestWbgt } = useNearestWbgt(referenceWbgtCenter.latitude, referenceWbgtCenter.longitude);

  // コンビニ・自販機・カフェはOpenStreetMap(Overpass API)、給水スポット・災害時給水は
  // 東京都水道局のオープンデータの実データを取得し、取得中・失敗時はモックにフォールバックする
  const { spots: liveOsmSpots, status: liveOsmSpotsStatus } = useNearbySpots(spotBounds);
  const osmSpots =
    liveOsmSpotsStatus === 'success'
      ? liveOsmSpots
      : mockMapSpots.filter((spot) => spot.type === 'convenience' || spot.type === 'vending' || spot.type === 'cafe');

  const { drinkingSpots, disasterSpots, status: waterSpotsStatus } = useTokyoWaterSpots(spotBounds);
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
  if (mapReady && region) {
    visibleSpots.forEach((spot) => {
      const normalized = projectToRegion(spot.latitude, spot.longitude, region);
      spotPositions[spot.id] = toScreenPosition(normalized, viewportSize, SPOT_EDGE_MARGIN);
    });
  }

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

          {region && heatmapEnabled && (
            <MapWbgtTileLayer region={region} readings={wbgtReadings} coolingFeatures={coolingFeatures} />
          )}
        </View>

        {heatmapEnabled && nearestWbgt && (
          <View style={styles.wbgtBadgeWrapper}>
            <MapWbgtReferenceBadge data={nearestWbgt} />
          </View>
        )}

        <View
          style={[styles.rightColumn, filterExpanded && styles.rightColumnRaised]}
          pointerEvents="box-none">
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
            onExpandedChange={setFilterExpanded}
          />
        </View>

        {/* 凡例カード・WBGT実況バッジ・右側ボタン列より後（＝手前）に描画することで、
            画面端にクランプされたスポット・メンバーのピンがそれらのUIの下に隠れて
            見えなくなるのを防ぐ（例: 現在地から離れたメンバーへジャンプすると、
            残りのメンバー全員が画面上端に寄り、凡例カードの真裏に隠れてしまっていた）。
            pointerEvents="box-none"で、ピンが無い部分は地図の操作を妨げないようにする。 */}
        <View style={styles.mapBackground} pointerEvents="box-none">
          {mapReady &&
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

          {mapReady &&
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
