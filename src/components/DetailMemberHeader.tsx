import React, { useState } from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { MapPin, User } from 'lucide-react-native';
import { Member } from '../types';
import { estimateVitalityLevel } from '../logic/vitalityGauge';
import { RISK_CONFIG } from '../constants/riskConfig';
import { colors, spacing, radius } from '../constants/theme';
import { RiskBadge } from './RiskBadge';
import { RiskGauge } from './RiskGauge';

interface Props {
  member: Member;
}

/**
 * カード詳細画面の最上部に表示するメンバー概要カード。
 * ホーム画面の MemberCard と似たレイアウトだが、タップ動作は持たず、
 * 危険度による赤枠ハイライトも行わない（詳細パネル側で危険度を表現するため）。
 */
export const DetailMemberHeader: React.FC<Props> = ({ member }) => {
  const [imageFailed, setImageFailed] = useState(false);
  const showFallbackAvatar = !member.photoUrl || imageFailed;

  return (
    <View style={styles.card}>
      {showFallbackAvatar ? (
        <View style={[styles.avatar, styles.avatarFallback]}>
          <User size={28} color={colors.textSecondary} />
        </View>
      ) : (
        <Image
          source={{ uri: member.photoUrl }}
          style={styles.avatar}
          onError={() => setImageFailed(true)}
        />
      )}

      <View style={styles.info}>
        <Text style={styles.name}>{member.name}</Text>
        <Text style={styles.subInfo}>
          {member.age}歳　{member.gender}
        </Text>
        <View style={styles.locationRow}>
          <MapPin size={14} color={colors.textSecondary} />
          <Text style={styles.locationText} numberOfLines={1}>
            {member.location?.address ?? '位置情報を取得中…'}
          </Text>
        </View>
        <Text style={styles.updatedText}>最終更新：{member.lastUpdated ?? '-'}</Text>
      </View>

      <View style={styles.rightColumn}>
        <RiskBadge riskLevel={member.riskLevel} />
        <RiskGauge
          riskLevel={estimateVitalityLevel(member.vitality)}
          score={member.vitality}
          valueLabel={member.riskScore}
          valueColor={RISK_CONFIG[member.riskLevel].color}
          size={64}
          strokeWidth={7}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cardBackground,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: radius.full,
    marginRight: spacing.md,
  },
  avatarFallback: {
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  info: {
    flex: 1,
    marginRight: spacing.sm,
  },
  name: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimary,
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
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 64,
  },
});
