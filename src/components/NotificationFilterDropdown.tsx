import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { ChevronDown } from 'lucide-react-native';
import { colors, spacing, radius } from '../constants/theme';

export interface FilterOption {
  value: string;
  label: string;
}

interface Props {
  label: string; // 選択状態に応じて呼び出し側で計算済みのボタン表示ラベル
  active: boolean; // 現在この絞り込みの選択肢リストが開いているか
  onPress: () => void;
}

/**
 * 通知履歴画面の絞り込みチップ（危険度・メンバー・既読状態）のトリガーボタン。
 * 選択肢リストは画面側で1箇所にまとめて表示し、常に同時に1つしか開かないようにする
 * （チップごとに個別のドロップダウンを重ねて表示すると、開閉状態の排他制御や
 * レイアウト崩れが起きやすいため）。
 */
export const NotificationFilterDropdown: React.FC<Props> = ({ label, active, onPress }) => {
  return (
    <TouchableOpacity
      style={[styles.chip, active && styles.chipActive]}
      activeOpacity={0.7}
      onPress={onPress}>
      <Text style={styles.chipText} numberOfLines={1}>
        {label}
      </Text>
      <ChevronDown size={14} color={colors.textSecondary} />
    </TouchableOpacity>
  );
};

interface ListProps {
  options: FilterOption[];
  selectedValue: string;
  onSelect: (value: string) => void;
}

export const NotificationFilterList: React.FC<ListProps> = ({
  options,
  selectedValue,
  onSelect,
}) => {
  return (
    <View style={styles.list}>
      {options.map((option) => (
        <TouchableOpacity
          key={option.value}
          style={styles.listItem}
          onPress={() => onSelect(option.value)}>
          <Text
            style={[
              styles.listItemText,
              option.value === selectedValue && styles.listItemTextActive,
            ]}>
            {option.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.cardBackground,
  },
  chipActive: {
    borderColor: colors.primary,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textPrimary,
    marginRight: 4,
    maxWidth: 96,
  },
  list: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    padding: spacing.sm,
    backgroundColor: colors.cardBackground,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  listItem: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    backgroundColor: colors.background,
  },
  listItemText: {
    fontSize: 13,
    color: colors.textPrimary,
  },
  listItemTextActive: {
    color: colors.primary,
    fontWeight: '700',
  },
});
