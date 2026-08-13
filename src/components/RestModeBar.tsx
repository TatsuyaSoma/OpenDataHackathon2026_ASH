import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { BedDouble } from 'lucide-react-native';
import { colors, spacing, radius } from '../constants/theme';

interface Props {
  onPressStart: () => void;
}

/**
 * 「お休み（冷房が効いた部屋にいるよ）」への切り替えを促すバー。
 * ボタンを押すとその場でお休みモードがONになる（設定画面への遷移はしない）。
 */
export const RestModeBar: React.FC<Props> = ({ onPressStart }) => {
  return (
    <View style={styles.container}>
      <BedDouble size={22} color={colors.primary} style={styles.icon} />
      <View style={styles.textColumn}>
        <Text style={styles.title}>お休み（冷房が効いた部屋にいるよ）</Text>
        <Text style={styles.subtitle}>位置が動いたら自動で解除します</Text>
      </View>
      <TouchableOpacity style={styles.button} onPress={onPressStart} activeOpacity={0.7}>
        <Text style={styles.buttonText}>お休みにする</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.restBackground,
    borderColor: colors.restBorder,
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.lg,
  },
  icon: {
    marginRight: spacing.md,
  },
  textColumn: {
    flex: 1,
    marginRight: spacing.sm,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  subtitle: {
    fontSize: 12,
    color: colors.primary,
    opacity: 0.8,
    marginTop: 2,
  },
  button: {
    backgroundColor: colors.cardBackground,
    borderColor: colors.primary,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  buttonText: {
    color: colors.primary,
    fontWeight: '700',
    fontSize: 13,
  },
});
