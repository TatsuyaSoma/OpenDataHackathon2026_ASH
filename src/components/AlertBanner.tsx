import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { TriangleAlert, ChevronRight } from 'lucide-react-native';
import { colors, spacing, radius } from '../constants/theme';

interface Props {
  dangerCount: number;
  onPress?: () => void;
}

/**
 * 「現在の危険者：n名」を表示するバナー。
 * dangerCount が 0 のときは表示自体を呼び出し側で制御する想定。
 */
export const AlertBanner: React.FC<Props> = ({ dangerCount, onPress }) => {
  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      style={styles.container}
    >
      <View style={styles.left}>
        <TriangleAlert size={20} color={colors.bannerText} />
        <Text style={styles.text}>現在の危険者：{dangerCount}名</Text>
      </View>
      <ChevronRight size={20} color={colors.textSecondary} />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.bannerBackground,
    borderRadius: radius.lg,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  text: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.bannerText,
    marginLeft: spacing.sm,
  },
});
