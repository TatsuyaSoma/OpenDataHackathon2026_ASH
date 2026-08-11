import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, StatusBar, Alert } from 'react-native';
import { ArrowLeft, BedDouble, Navigation } from 'lucide-react-native';
import { Member } from '../types';
import { RISK_CONFIG } from '../constants/riskConfig';
import { colors, spacing, radius } from '../constants/theme';
import { mockMapSpots } from '../data/mockData';
import { useMembers } from '../context/MembersContext';
import { MapLegendCard } from '../components/MapLegendCard';
import { MapDisplayControls } from '../components/MapDisplayControls';
import { MapSpotLegendBar } from '../components/MapSpotLegendBar';
import { MapMemberPin } from '../components/MapMemberPin';
import { MapSpotPin } from '../components/MapSpotPin';
import { MapHeatmapLayer } from '../components/MapHeatmapLayer';

interface Props {
  onBack?: () => void;
  onOpenMemberDetail?: (member: Member) => void;
}

// マップ表示範囲の緯度経度境界（モックメンバーの位置が収まる東京都心付近を仮定）
const MAP_BOUNDS = { latMin: 35.615, latMax: 35.71, lngMin: 139.66, lngMax: 139.8 };

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

// 緯度経度を0〜1の正規化座標に変換する（実地図タイル導入までの仮の投影）
const projectToMap = (latitude: number, longitude: number) => ({
  x: clamp01((longitude - MAP_BOUNDS.lngMin) / (MAP_BOUNDS.lngMax - MAP_BOUNDS.lngMin)),
  y: clamp01(1 - (latitude - MAP_BOUNDS.latMin) / (MAP_BOUNDS.latMax - MAP_BOUNDS.latMin)),
});

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

export const MapScreen: React.FC<Props> = ({ onBack, onOpenMemberDetail }) => {
  const { members } = useMembers();
  const [heatmapEnabled, setHeatmapEnabled] = useState(true);
  const [membersEnabled, setMembersEnabled] = useState(true);
  const [convenienceEnabled, setConvenienceEnabled] = useState(true);
  const [vendingEnabled, setVendingEnabled] = useState(true);

  // ヒートマップの基準にできるのは、実際の屋外環境にいる（お休み中でない）メンバーのみ
  const referenceCandidates = useMemo(
    () => members.filter((m) => !m.isResting),
    [members]
  );
  const defaultReference = useMemo(
    () =>
      [...referenceCandidates].sort(
        (a, b) => RISK_CONFIG[b.riskLevel].order - RISK_CONFIG[a.riskLevel].order
      )[0] ?? members[0],
    [referenceCandidates, members]
  );
  const [referenceMemberId, setReferenceMemberId] = useState(defaultReference?.id);
  const referenceMember =
    members.find((m) => m.id === referenceMemberId) ?? defaultReference;

  const hasResting = members.some((m) => m.isResting);

  const memberPositions = useMemo(() => {
    const positions: Record<string, { x: number; y: number }> = {};
    members.forEach((member) => {
      positions[member.id] = projectToMap(member.location.latitude, member.location.longitude);
    });
    return positions;
  }, [members]);

  const visibleSpots = mockMapSpots.filter((spot) => {
    if (spot.type === 'convenience') return convenienceEnabled;
    if (spot.type === 'vending') return vendingEnabled;
    return true; // 給水スポット・カフェは常時表示
  });

  if (members.length === 0 || !referenceMember) {
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
          <View style={[styles.road, styles.roadHorizontal]} />
          <View style={[styles.road, styles.roadVertical]} />

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

          {heatmapEnabled && (
            <MapHeatmapLayer members={members} positions={memberPositions} />
          )}

          {visibleSpots.map((spot) => (
            <MapSpotPin key={spot.id} spot={spot} />
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
          <MapLegendCard referenceMemberName={referenceMember.name} />
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
            referenceCandidates={referenceCandidates}
            referenceMember={referenceMember}
            onSelectReferenceMember={(member) => setReferenceMemberId(member.id)}
          />
        </View>

        <TouchableOpacity
          style={styles.locateButton}
          activeOpacity={0.8}
          onPress={() => Alert.alert('現在地', '現在地への移動は準備中です。')}>
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
