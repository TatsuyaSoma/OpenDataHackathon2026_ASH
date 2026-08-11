import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, StatusBar } from 'react-native';
import type { LucideIcon } from 'lucide-react-native';
import { colors, spacing } from '../constants/theme';

interface Props {
  title: string;
  message: string;
  Icon: LucideIcon;
}

/**
 * マップ／通知履歴／設定など、実装が未着手の画面用の仮置き画面。
 * 各画面の本実装が進み次第、このコンポーネントの利用箇所を専用画面に置き換える。
 */
export const PlaceholderScreen: React.FC<Props> = ({ title, message, Icon }) => {
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{title}</Text>
      </View>
      <View style={styles.content}>
        <Icon size={40} color={colors.textSecondary} />
        <Text style={styles.message}>{message}</Text>
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
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  message: {
    marginTop: spacing.md,
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
