import React from 'react';
import { View, Text, StyleSheet, StyleProp, TouchableOpacity, ViewStyle } from 'react-native';
import { BedDouble } from 'lucide-react-native';
import { colors, spacing, radius } from '../constants/theme';

interface Props {
  restStartedAt?: string;
  onPressRelease: () => void;
  style?: StyleProp<ViewStyle>; // 表示先ごとに下マージンを打ち消す等の調整に使う
}

/**
 * カード詳細画面上部に表示する「お休み中」バナー。
 * ホーム画面の RestModeBar（設定用・青系）とは異なり、
 * こちらは「現在お休み中である」ことを示す表示用バナー（緑系）で、解除ボタンを持つ。
 */
export const RestStatusBanner: React.FC<Props> = ({ restStartedAt, onPressRelease, style }) => {
  return (
    <View style={[styles.container, style]}>
      <BedDouble size={22} color={colors.successText} style={styles.icon} />
      <View style={styles.textColumn}>
        <Text style={styles.title}>お休み中　（冷房が効いた部屋にいるよ）</Text>
        {restStartedAt && <Text style={styles.subtitle}>開始時刻：　{restStartedAt}</Text>}
      </View>
      <TouchableOpacity style={styles.button} onPress={onPressRelease} activeOpacity={0.7}>
        <Text style={styles.buttonText}>お休みを解除</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.successBackground,
    borderColor: colors.successBorder,
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
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
    fontWeight: '700',
    color: colors.successText,
  },
  subtitle: {
    fontSize: 12,
    color: colors.successText,
    opacity: 0.85,
    marginTop: 2,
  },
  button: {
    backgroundColor: colors.cardBackground,
    borderColor: colors.successText,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  buttonText: {
    color: colors.successText,
    fontWeight: '700',
    fontSize: 13,
  },
});
