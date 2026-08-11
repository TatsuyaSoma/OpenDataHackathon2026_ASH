import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, StatusBar, Alert } from 'react-native';
import { ArrowLeft, BedDouble, Navigation } from 'lucide-react-native';
import { Member } from '../types';
import { colors, spacing, radius } from '../constants/theme';
import { mockMapSpots } from '../data/mockData';
import { useMembers } from '../context/MembersContext';
import { useNearbySpots } from '../hooks/use-nearby-spots';
import { useAreaWeather } from '../hooks/use-area-weather';
import { MAP_BOUNDS, projectToMap } from '../utils/mapProjection';
import { MapLegendCard } from '../components/MapLegendCard';
import { MapDisplayControls } from '../components/MapDisplayControls';
import { MapSpotLegendBar } from '../components/MapSpotLegendBar';
import { MapMemberPin } from '../components/MapMemberPin';
import { MapSpotPin } from '../components/MapSpotPin';
import { MapHeatmapLayer } from '../components/MapHeatmapLayer';
import { MapBackgroundLayer } from '../components/MapBackgroundLayer';

interface Props {
  onBack?: () => void;
  onOpenMemberDetail?: (member: Member) => void;
}

// 地図らしさを演出するための駅・地域ラベル（表示位置は目安）
const STATIONS = [
  { name: '新宿駅', x: 0.22, y: 0.22 },
  { name: '飯田橋駅', x: 0.68, y: 0.1 },
  { name: '東京駅', x: 0.62, y: 0.38 },
  { name: '渋谷駅', x: 0.12, y: 0.6 },
  { name: '品川駅', x: 0.55, y: 0.88 },
];

const AREAS = [
  { name: '新宿区', x: 0.13, y: 0.13 },
  { name: '千代田区', x: 0.55, y: 0.28 },
  { name: '港区', x: 0.35, y: 0.74 },
];

// アメダスの観測地点はまばらなため、表示範囲より少し広めの範囲から検索し、
// 範囲外の地点は投影時にマップの端に寄せて表示する
const WEATHER_SEARCH_BOUNDS = {
  latMin: MAP_BOUNDS.latMin - 0.15,
  latMax: MAP_BOUNDS.latMax + 0.15,
  lngMin: MAP_BOUNDS.lngMin - 0.15,
  lngMax: MAP_BOUNDS.lngMax + 0.15,
};

export const MapScreen: React.FC<Props> = ({ onBack, onOpenMemberDetail }) => {
  const { members, selfLocationStatus, refreshSelfLocation } = useMembers();
  const [heatmapEnabled, setHeatmapEnabled] = useState(true);
  const [membersEnabled, setMembersEnabled] = useState(true);
  const [convenienceEnabled, setConvenienceEnabled] = useState(true);
  const [vendingEnabled, setVendingEnabled] = useState(true);

  const hasResting = members.some((m) => m.isResting);

  // ヒートマップはアメダスの実測気温・湿度に基づく
  const { stations: weatherStations } = useAreaWeather(WEATHER_SEARCH_BOUNDS);

  const memberPositions = useMemo(() => {
    const positions: Record<string, { x: number; y: number }> = {};
    members.forEach((member) => {
      positions[member.id] = projectToMap(member.location.latitude, member.location.longitude);
    });
    return positions;
  }, [members]);

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
    return true; // 給水スポット・カフェは常時表示
  });

  const spotPositions: Record<string, { x: number; y: number }> = {};
  visibleSpots.forEach((spot) => {
    spotPositions[spot.id] = projectToMap(spot.latitude, spot.longitude);
  });

  const handleLocatePress = () => {
    if (selfLocationStatus === 'denied') {
      Alert.alert(
        '位置情報の利用が許可されていません',
        '端末の設定から位置情報へのアクセスを許可してください。'
      );
      return;
    }
    refreshSelfLocation();
  };

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

      <View style={styles.mapArea}>
        <View style={styles.mapBackground}>
          <MapBackgroundLayer stations={STATIONS} />

          {AREAS.map((area) => (
            <Text
              key={area.name}
              style={[styles.areaLabel, { left: `${area.x * 100}%`, top: `${area.y * 100}%` }]}>
              {area.name}
            </Text>
          ))}
          {STATIONS.map((station) => (
            <View
              key={station.name}
              style={[styles.stationTag, { left: `${station.x * 100}%`, top: `${station.y * 100}%` }]}>
              <View style={styles.stationDot} />
              <Text style={styles.stationLabel}>{station.name}</Text>
            </View>
          ))}

          {heatmapEnabled && <MapHeatmapLayer stations={weatherStations} />}

          {visibleSpots.map((spot) => (
            <MapSpotPin
              key={spot.id}
              spot={spot}
              x={spotPositions[spot.id].x}
              y={spotPositions[spot.id].y}
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
              />
            ))}
        </View>

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
          />
        </View>

        <TouchableOpacity style={styles.locateButton} activeOpacity={0.8} onPress={handleLocatePress}>
          <Navigation size={20} color={colors.primary} />
        </TouchableOpacity>
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
  areaLabel: {
    position: 'absolute',
    fontSize: 12,
    fontWeight: '700',
    color: '#6B7684',
    backgroundColor: 'rgba(255,255,255,0.72)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  stationTag: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
  },
  stationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
    marginRight: 4,
  },
  stationLabel: {
    fontSize: 11,
    color: colors.textPrimary,
    fontWeight: '600',
    backgroundColor: 'rgba(255,255,255,0.7)',
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
  locateButton: {
    position: 'absolute',
    bottom: spacing.md,
    right: spacing.md,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.cardBackground,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomLegend: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
});
