import React, { useState } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { BedDouble, Navigation, User } from 'lucide-react-native';
import { Member } from '../types';
import { RISK_CONFIG } from '../constants/riskConfig';
import { colors, radius } from '../constants/theme';

interface Props {
  member: Member;
  x: number; // マップ表示エリア内の水平位置（0〜1）
  y: number; // マップ表示エリア内の垂直位置（0〜1）
  onPress?: (member: Member) => void;
}

const SIZE = 56;

/**
 * マップ上のメンバーアイコン。危険度カラーのリングで囲み、
 * お休み中の場合は右上にお休みバッジを重ねて表示する。
 * 本人（isSelf）の場合は、実際の現在地であることが分かるよう青いパルスと現在地バッジを表示する。
 */
export const MapMemberPin: React.FC<Props> = ({ member, x, y, onPress }) => {
  const [imageFailed, setImageFailed] = useState(false);
  const showFallbackAvatar = !member.photoUrl || imageFailed;
  const ringColor = RISK_CONFIG[member.riskLevel].color;

  return (
    <View style={[styles.wrapper, { left: `${x * 100}%`, top: `${y * 100}%` }]}>
      {member.isSelf && <View style={styles.selfPulse} />}

      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => onPress?.(member)}
        style={[styles.ring, { borderColor: ringColor }]}>
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
  ring: {
    width: SIZE,
    height: SIZE,
    borderRadius: SIZE / 2,
    borderWidth: 3,
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
    top: '50%',
    left: '50%',
    width: SIZE + 24,
    height: SIZE + 24,
    borderRadius: (SIZE + 24) / 2,
    backgroundColor: 'rgba(41, 121, 255, 0.18)',
    transform: [{ translateX: -(SIZE + 24) / 2 }, { translateY: -(SIZE + 24) / 2 }],
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
