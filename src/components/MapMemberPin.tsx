import React, { useState } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { BedDouble, ChevronRight, Navigation, User } from 'lucide-react-native';
import { Member } from '../types';
import { estimateVitalityLevel } from '../logic/vitalityGauge';
import { colors, radius } from '../constants/theme';
import { RiskGauge } from './RiskGauge';

interface Props {
  member: Member;
  x: number; // マップ表示エリア内の水平位置（0〜1）
  y: number; // マップ表示エリア内の垂直位置（0〜1）
  onPress?: (member: Member) => void;
  // ドラッグして表示範囲外に出た場合、画面端にクランプして表示する際の実際の位置への方向（度、0=右）。
  // 指定時は画面端にいることが分かるよう矢印バッジを表示し、本体を少し薄く見せる。
  offscreenDirectionDeg?: number;
  // 画面端の矢印バッジをタップした際のハンドラ。指定時、遠方にいるメンバーへ
  // カメラをワンタップでジャンプさせる導線として使う（アバター本体のonPressとは別動作）。
  onPressOffscreenIndicator?: (member: Member) => void;
}

const SIZE = 56;
const GAUGE_SIZE = SIZE + 12; // 体力ゲージのリングをアイコンの外側に見せるための直径
const PULSE_SIZE = SIZE + 24;

/**
 * マップ上のメンバーアイコン。体力ゲージ（減算式のリング。少ないほど危険）で取り囲み、
 * お休み中の場合は右上にお休みバッジを重ねて表示する。
 * 本人（isSelf）の場合は、実際の現在地であることが分かるよう青いパルスと現在地バッジを表示する。
 *
 * ゲージ・パルス・バッジ類は、下の名前タグを含まない「avatarArea」（アイコンと同じSIZE四方）を
 * 基準に位置決めしている。名前タグを含むwrapper全体を基準にすると、名前タグの高さの分だけ
 * ゲージの中心がアイコンの中心からずれてしまうため。
 */
export const MapMemberPin: React.FC<Props> = ({
  member,
  x,
  y,
  onPress,
  offscreenDirectionDeg,
  onPressOffscreenIndicator,
}) => {
  const [imageFailed, setImageFailed] = useState(false);
  const showFallbackAvatar = !member.photoUrl || imageFailed;
  const isOffscreen = offscreenDirectionDeg !== undefined;

  return (
    <View
      style={[
        styles.wrapper,
        { left: `${x * 100}%`, top: `${y * 100}%` },
        isOffscreen && styles.wrapperOffscreen,
      ]}>
      <View style={styles.avatarArea}>
        {member.isSelf && <View style={styles.selfPulse} />}

        <View style={styles.gaugeWrapper} pointerEvents="none">
          <RiskGauge
            riskLevel={estimateVitalityLevel(member.vitality)}
            score={member.vitality}
            size={GAUGE_SIZE}
            strokeWidth={5}
            hideValue
          />
        </View>

        <TouchableOpacity activeOpacity={0.8} onPress={() => onPress?.(member)} style={styles.ring}>
          {showFallbackAvatar ? (
            <View style={[styles.avatar, styles.avatarFallback]}>
              <User size={22} color={colors.textSecondary} />
            </View>
          ) : (
            <Image
              source={{ uri: member.photoUrl }}
              style={styles.avatar}
              onError={() => setImageFailed(true)}
            />
          )}
        </TouchableOpacity>

        {member.isSelf && (
          <View style={styles.selfBadge}>
            <Navigation size={11} color="#FFFFFF" fill="#FFFFFF" />
          </View>
        )}

        {member.isResting && (
          <View style={styles.restingBadge}>
            <BedDouble size={11} color="#FFFFFF" />
          </View>
        )}

        {isOffscreen && (
          <TouchableOpacity
            style={styles.directionBadge}
            hitSlop={10}
            activeOpacity={0.7}
            onPress={() => onPressOffscreenIndicator?.(member)}>
            <ChevronRight size={12} color="#FFFFFF" style={{ transform: [{ rotate: `${offscreenDirectionDeg}deg` }] }} />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.nameTag}>
        <Text style={styles.nameText} numberOfLines={1}>
          {member.isSelf ? `${member.name}（現在地）` : member.name}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    alignItems: 'center',
    transform: [{ translateX: -SIZE / 2 }, { translateY: -SIZE / 2 }],
  },
  wrapperOffscreen: {
    opacity: 0.85,
  },
  avatarArea: {
    width: SIZE,
    height: SIZE,
  },
  gaugeWrapper: {
    position: 'absolute',
    top: (SIZE - GAUGE_SIZE) / 2,
    left: (SIZE - GAUGE_SIZE) / 2,
    width: GAUGE_SIZE,
    height: GAUGE_SIZE,
  },
  ring: {
    width: SIZE,
    height: SIZE,
    borderRadius: SIZE / 2,
    padding: 2,
    backgroundColor: colors.cardBackground,
  },
  avatar: {
    width: '100%',
    height: '100%',
    borderRadius: SIZE / 2,
  },
  avatarFallback: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  selfPulse: {
    position: 'absolute',
    top: (SIZE - PULSE_SIZE) / 2,
    left: (SIZE - PULSE_SIZE) / 2,
    width: PULSE_SIZE,
    height: PULSE_SIZE,
    borderRadius: PULSE_SIZE / 2,
    backgroundColor: 'rgba(41, 121, 255, 0.18)',
  },
  selfBadge: {
    position: 'absolute',
    bottom: -2,
    left: -2,
    width: 20,
    height: 20,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    borderWidth: 2,
    borderColor: colors.cardBackground,
    alignItems: 'center',
    justifyContent: 'center',
  },
  restingBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 20,
    height: 20,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    borderWidth: 2,
    borderColor: colors.cardBackground,
    alignItems: 'center',
    justifyContent: 'center',
  },
  directionBadge: {
    position: 'absolute',
    top: -2,
    left: -2,
    width: 20,
    height: 20,
    borderRadius: radius.full,
    backgroundColor: '#6B7684',
    borderWidth: 2,
    borderColor: colors.cardBackground,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nameTag: {
    marginTop: 4,
    maxWidth: SIZE + 24,
    backgroundColor: colors.cardBackground,
    borderRadius: radius.full,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  nameText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textPrimary,
    textAlign: 'center',
  },
});
