import { ChevronRight, MapPin, User } from 'lucide-react-native';
import React, { useState } from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { isHighRisk } from '../constants/riskConfig';
import { colors, radius, spacing } from '../constants/theme';
import { estimateVitalityLevel } from '../logic/vitalityGauge';
import { Member } from '../types';
import { RiskBadge } from './RiskBadge';
import { RiskGauge } from './RiskGauge';

interface Props {
  member: Member;
  onPress: (member: Member) => void;
  showChevron?: boolean; // 設定画面のメンバ管理など「編集へ進む」導線で使う矢印表示
  // 指定時、位置情報の行をタップ可能にし、そのメンバーを中心にマップ画面を開く導線にする
  onPressLocation?: (member: Member) => void;
}

/**
 * ホーム画面に並ぶメンバー1人分のカード。
 * 危険度が「危険」「非常に危険」の場合は枠を赤くハイライトする。
 */
export const MemberCard: React.FC<Props> = ({ member, onPress, showChevron, onPressLocation }) => {
  const highlighted = isHighRisk(member.riskLevel) && !member.isResting;
  // 画像URLが無い/読み込み失敗した場合はイニシャルアイコンにフォールバックする（レビュー指摘反映）
  const [imageFailed, setImageFailed] = useState(false);
  const showFallbackAvatar = !member.photoUrl || imageFailed;

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={() => onPress(member)}
      style={[styles.card, highlighted && styles.cardHighlighted]}
    >
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
        <View style={styles.nameRow}>
          <Text style={styles.name}>{member.name}</Text>
        </View>
        <Text style={styles.subInfo}>
          {member.age}歳　{member.gender}
        </Text>
        <TouchableOpacity
          style={styles.locationRow}
          disabled={!onPressLocation}
          hitSlop={6}
          onPress={() => onPressLocation?.(member)}>
          <MapPin size={14} color={onPressLocation ? colors.primary : colors.textSecondary} />
          {/* member.location が未取得の間にレンダリングされてもクラッシュしないよう防御（レビュー指摘反映） */}
          <Text
            style={[styles.locationText, onPressLocation && styles.locationTextPressable]}
            numberOfLines={1}>
            {member.location?.address ?? '位置情報を取得中…'}
          </Text>
        </TouchableOpacity>
        <Text style={styles.updatedText}>最終更新：{member.lastUpdated ?? '-'}</Text>
      </View>

      <View style={styles.rightColumn}>
        <RiskBadge riskLevel={member.riskLevel} isResting={member.isResting} />
        <RiskGauge
          riskLevel={estimateVitalityLevel(member.vitality)}
          score={member.vitality}
          valueLabel={Math.round(member.vitality)}
          valueSuffix="%"
        />
      </View>

      {showChevron && (
        <ChevronRight size={20} color={colors.textSecondary} style={styles.chevron} />
      )}
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
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  name: {
    fontSize: 18,
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
  locationTextPressable: {
    color: colors.primary,
    textDecorationLine: 'underline',
  },
  updatedText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
  },
  rightColumn: {
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 56,
  },
  chevron: {
    marginLeft: spacing.xs,
  },
});
