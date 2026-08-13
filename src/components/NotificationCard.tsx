import React, { useState } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { Bell, ChevronRight, Lightbulb, MapPin, MessageCircleQuestion, Smile, User } from 'lucide-react-native';
import { Member, NotificationItem } from '../types';
import { RISK_CONFIG, isHighRisk } from '../constants/riskConfig';
import { colors, spacing, radius } from '../constants/theme';

interface Props {
  notification: NotificationItem;
  member: Member;
  onPress?: (member: Member, notification: NotificationItem) => void;
  onPressCheckIn?: (member: Member) => void;
  onPressImFine?: (member: Member) => void;
}

/**
 * 通知履歴の1件分のカード。
 * 「大丈夫？」は自分以外のメンバーにのみ表示（危険度が「やや危険」以上の場合のみ）。
 * 「元気！」は自分自身の通知にのみ表示する（他人の代わりに元気アピールはできないため）。
 */
export const NotificationCard: React.FC<Props> = ({
  notification,
  member,
  onPress,
  onPressCheckIn,
  onPressImFine,
}) => {
  const [imageFailed, setImageFailed] = useState(false);
  const showFallbackAvatar = !member.photoUrl || imageFailed;
  const config = RISK_CONFIG[notification.riskLevel];
  const showCheckIn =
    !member.isSelf && (isHighRisk(notification.riskLevel) || notification.riskLevel === 'warning');
  const showImFine = !!member.isSelf;
  // 安全レベルでは行動提案の内容が薄いため、注意以上のときだけ表示する
  const showAdvice = config.order >= RISK_CONFIG.caution.order;

  return (
    <TouchableOpacity
      style={[styles.card, !notification.isRead && styles.cardUnread]}
      activeOpacity={0.8}
      onPress={() => onPress?.(member, notification)}>
      <View style={styles.row}>
        <View style={[styles.bellChip, { backgroundColor: config.color }]}>
          <Bell size={14} color="#FFFFFF" />
        </View>

        {showFallbackAvatar ? (
          <View style={[styles.avatar, styles.avatarFallback]}>
            <User size={20} color={colors.textSecondary} />
          </View>
        ) : (
          <Image
            source={{ uri: member.photoUrl }}
            style={styles.avatar}
            onError={() => setImageFailed(true)}
          />
        )}

        <View style={styles.content}>
          <View style={styles.nameRow}>
            <Text style={styles.name}>{member.name}</Text>
            <Text style={styles.time}>{notification.time}</Text>
          </View>
          <Text style={styles.message}>
            <Text style={{ color: config.color, fontWeight: '700' }}>
              {config.label}（レベル{config.order}）
            </Text>
            {notification.changed ? 'になりました' : 'です'}
          </Text>
          <View style={styles.locationRow}>
            <MapPin size={12} color={colors.textSecondary} />
            <Text style={styles.locationText} numberOfLines={1}>
              {notification.location}
            </Text>
          </View>
          {showAdvice && (
            <View style={styles.adviceRow}>
              <Lightbulb size={12} color={config.color} />
              <Text style={styles.adviceText} numberOfLines={2}>
                {config.advice}
              </Text>
            </View>
          )}
        </View>

        <ChevronRight size={18} color={colors.textSecondary} />
      </View>

      {(showCheckIn || showImFine) && (
        <View style={styles.actionsRow}>
          {showCheckIn && (
            <TouchableOpacity
              style={[styles.actionButton, styles.checkInButton]}
              activeOpacity={0.7}
              onPress={() => onPressCheckIn?.(member)}>
              <MessageCircleQuestion size={16} color={colors.primary} />
              <Text style={[styles.actionText, { color: colors.primary }]}>大丈夫？</Text>
            </TouchableOpacity>
          )}
          {showImFine && (
            <TouchableOpacity
              style={[styles.actionButton, styles.imFineButton]}
              activeOpacity={0.7}
              onPress={() => onPressImFine?.(member)}>
              <Smile size={16} color={colors.successText} />
              <Text style={[styles.actionText, { color: colors.successText }]}>元気！</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.cardBackground,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  cardUnread: {
    borderColor: colors.primary,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  bellChip: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
    marginTop: 2,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: spacing.sm,
  },
  avatarFallback: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  content: {
    flex: 1,
    marginRight: spacing.xs,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  name: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  time: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  message: {
    fontSize: 13,
    color: colors.textPrimary,
    marginTop: 2,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  locationText: {
    fontSize: 11,
    color: colors.textSecondary,
    marginLeft: 4,
    flexShrink: 1,
  },
  adviceRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 4,
  },
  adviceText: {
    flex: 1,
    fontSize: 11,
    color: colors.textPrimary,
    marginLeft: 4,
    lineHeight: 15,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  checkInButton: {
    borderColor: colors.primary,
  },
  imFineButton: {
    borderColor: colors.successText,
  },
  actionText: {
    fontSize: 13,
    fontWeight: '700',
    marginLeft: 6,
  },
});
