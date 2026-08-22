import { ArrowLeft, ChevronDown, ChevronUp, User } from 'lucide-react-native';
import React, { useState } from 'react';
import { Image, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, radius, spacing } from '../constants/theme';
import { Member } from '../types';

interface Props {
  members: Member[];
  onBack: () => void;
  onReorder: (orderedIds: string[]) => void;
}

/**
 * 設定画面「メンバ管理」タブの「メンバの並び順を変更」から遷移する画面。
 * 上下ボタンで1件ずつ並びを入れ替え、押すたびに即座に並び順を確定する
 * （他の一覧更新と同様、確定操作は都度反映＝AsyncStorageへも自動で永続化される）。
 */
export const MemberReorderScreen: React.FC<Props> = ({ members, onBack, onReorder }) => {
  const [orderedMembers, setOrderedMembers] = useState<Member[]>(members);

  const move = (index: number, direction: -1 | 1) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= orderedMembers.length) return;

    const next = [...orderedMembers];
    [next[index], next[targetIndex]] = [next[targetIndex], next[index]];
    setOrderedMembers(next);
    onReorder(next.map((member) => member.id));
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} hitSlop={8}>
          <ArrowLeft size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>並び順を変更</Text>
        <View style={styles.headerSpacer} />
      </View>

      <Text style={styles.description}>
        上下の矢印でメンバの表示順を入れ替えられます。変更は自動で保存されます。
      </Text>

      <View style={styles.list}>
        {orderedMembers.map((member, index) => {
          const showFallbackAvatar = !member.photoUrl;
          return (
            <View key={member.id} style={styles.row}>
              {showFallbackAvatar ? (
                <View style={[styles.avatar, styles.avatarFallback]}>
                  <User size={20} color={colors.textSecondary} />
                </View>
              ) : (
                <Image source={{ uri: member.photoUrl }} style={styles.avatar} />
              )}

              <Text style={styles.name} numberOfLines={1}>
                {member.name}
              </Text>

              <View style={styles.moveButtons}>
                <TouchableOpacity
                  style={[styles.moveButton, index === 0 && styles.moveButtonDisabled]}
                  activeOpacity={0.7}
                  disabled={index === 0}
                  hitSlop={6}
                  onPress={() => move(index, -1)}>
                  <ChevronUp size={18} color={index === 0 ? colors.border : colors.primary} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.moveButton,
                    index === orderedMembers.length - 1 && styles.moveButtonDisabled,
                  ]}
                  activeOpacity={0.7}
                  disabled={index === orderedMembers.length - 1}
                  hitSlop={6}
                  onPress={() => move(index, 1)}>
                  <ChevronDown
                    size={18}
                    color={index === orderedMembers.length - 1 ? colors.border : colors.primary}
                  />
                </TouchableOpacity>
              </View>
            </View>
          );
        })}
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
  description: {
    fontSize: 12,
    color: colors.textSecondary,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  list: {
    paddingHorizontal: spacing.lg,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cardBackground,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    marginRight: spacing.sm,
  },
  avatarFallback: {
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  name: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
    marginRight: spacing.sm,
  },
  moveButtons: {
    flexDirection: 'row',
  },
  moveButton: {
    width: 32,
    height: 32,
    borderRadius: radius.full,
    borderWidth: 1.5,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing.xs,
  },
  moveButtonDisabled: {
    borderColor: colors.border,
  },
});
