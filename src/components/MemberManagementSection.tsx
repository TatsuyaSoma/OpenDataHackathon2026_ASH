import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { ChevronRight, Info, Plus, Trash2, Users } from 'lucide-react-native';
import { Member } from '../types';
import { colors, spacing, radius } from '../constants/theme';
import { MemberCard } from './MemberCard';

interface Props {
  members: Member[];
  onAddMember: () => void;
  onEditMember: (member: Member) => void;
  onReorderMembers: () => void;
  onBulkDelete: () => void;
}

/**
 * 設定画面「メンバ管理」タブの内容。
 * 見守りメンバの一覧（タップで編集導線）、並び順変更、一括削除を提供する。
 */
export const MemberManagementSection: React.FC<Props> = ({
  members,
  onAddMember,
  onEditMember,
  onReorderMembers,
  onBulkDelete,
}) => {
  return (
    <View>
      <View style={styles.headerRow}>
        <View style={styles.headerTextColumn}>
          <Text style={styles.title}>見守りメンバ</Text>
          <Text style={styles.subtitle}>見守り対象のメンバを登録・編集・削除できます。</Text>
        </View>
        <TouchableOpacity style={styles.addButton} activeOpacity={0.7} onPress={onAddMember}>
          <Plus size={16} color={colors.primary} />
          <Text style={styles.addButtonText}>メンバを追加</Text>
        </TouchableOpacity>
      </View>

      {members.length === 0 ? (
        <Text style={styles.emptyText}>見守りメンバがいません。</Text>
      ) : (
        <>
          {members.map((member) => (
            <MemberCard key={member.id} member={member} onPress={onEditMember} showChevron />
          ))}

          <View style={styles.infoRow}>
            <Info size={14} color={colors.textSecondary} />
            <Text style={styles.infoText}>メンバをタップすると登録情報の編集ができます。</Text>
          </View>

          <TouchableOpacity style={styles.reorderButton} activeOpacity={0.7} onPress={onReorderMembers}>
            <Users size={18} color={colors.primary} />
            <Text style={styles.reorderText}>メンバの並び順を変更</Text>
            <ChevronRight size={18} color={colors.primary} style={styles.reorderChevron} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.deleteButton} activeOpacity={0.7} onPress={onBulkDelete}>
            <Trash2 size={18} color={colors.bannerText} />
            <Text style={styles.deleteText}>見守りメンバを一括削除</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  headerTextColumn: {
    flex: 1,
    marginRight: spacing.sm,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  subtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.primary,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  addButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
    marginLeft: 4,
  },
  emptyText: {
    textAlign: 'center',
    color: colors.textSecondary,
    fontSize: 13,
    marginTop: spacing.xl,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  infoText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginLeft: spacing.xs,
    flexShrink: 1,
  },
  reorderButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  reorderText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primary,
    marginLeft: spacing.sm,
  },
  reorderChevron: {
    marginLeft: 'auto',
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: colors.bannerText,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    marginBottom: spacing.lg,
  },
  deleteText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.bannerText,
    marginLeft: spacing.sm,
  },
});
