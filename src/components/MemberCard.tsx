import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { MapPin, Moon } from 'lucide-react-native';
import { Member } from '../types';
import { isHighRisk } from '../constants/riskConfig';
import { colors, spacing, radius } from '../constants/theme';
import { RiskBadge } from './RiskBadge';
import { RiskGauge } from './RiskGauge';

interface Props {
  member: Member;
  onPress: (member: Member) => void;
}

/**
 * ホーム画面に並ぶメンバー1人分のカード。
 * 危険度が「危険」「非常に危険」の場合は枠を赤くハイライトする。
 */
export const MemberCard: React.FC<Props> = ({ member, onPress }) => {
  const highlighted = isHighRisk(member.riskLevel) && !member.isResting;

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={() => onPress(member)}
      style={[styles.card, highlighted && styles.cardHighlighted]}
    >
      <Image source={{ uri: member.photoUrl }} style={styles.avatar} />

      <View style={styles.info}>
        <View style={styles.nameRow}>
          <Text style={styles.name}>{member.name}</Text>
          {member.isResting && (
            <View style={styles.restingChip}>
              <Moon size={12} color={colors.primary} />
              <Text style={styles.restingChipText}>お休み中</Text>
            </View>
          )}
        </View>
        <Text style={styles.subInfo}>
          {member.age}歳　{member.gender}
        </Text>
        <View style={styles.locationRow}>
          <MapPin size={14} color={colors.textSecondary} />
          <Text style={styles.locationText} numberOfLines={1}>
            {member.location.address}
          </Text>
        </View>
        <Text style={styles.updatedText}>最終更新：{member.lastUpdated}</Text>
      </View>

      <View style={styles.rightColumn}>
        <RiskBadge riskLevel={member.riskLevel} />
        <RiskGauge riskLevel={member.riskLevel} />
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: colors.cardBackground,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  cardHighlighted: {
    borderColor: '#E53935',
    borderWidth: 2,
    backgroundColor: '#FDECEC',
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: radius.full,
    marginRight: spacing.md,
  },
  info: {
    flex: 1,
    marginRight: spacing.sm,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  name: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  restingChip: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: spacing.sm,
    backgroundColor: colors.restBackground,
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  restingChipText: {
    fontSize: 11,
    color: colors.primary,
    marginLeft: 2,
    fontWeight: '600',
  },
  subInfo: {
    fontSize: 14,
    color: colors.textPrimary,
    marginTop: 4,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  locationText: {
    fontSize: 13,
    color: colors.textSecondary,
    marginLeft: 4,
    flexShrink: 1,
  },
  updatedText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
  },
  rightColumn: {
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    minHeight: 56,
  },
});
