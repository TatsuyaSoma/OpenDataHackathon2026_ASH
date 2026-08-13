import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MessageCircleQuestion, Smile } from 'lucide-react-native';
import { colors, spacing, radius } from '../constants/theme';

interface Props {
  isSelf?: boolean; // trueの場合は本人のカードのため「元気！」のみ、falseの場合は他メンバーのため「大丈夫？」のみ表示する
  onPressCheckIn: () => void; // 「大丈夫？」：相手に安否確認を送る
  onPressImFine: () => void;  // 「元気！」：自分から元気アピールを送る
}

export const QuickReplyBar: React.FC<Props> = ({ isSelf, onPressCheckIn, onPressImFine }) => {
  return (
    <View style={styles.container}>
      {!isSelf && (
        <TouchableOpacity style={[styles.button, styles.checkInButton]} onPress={onPressCheckIn} activeOpacity={0.7}>
          <MessageCircleQuestion size={18} color={colors.primary} />
          <Text style={[styles.buttonText, { color: colors.primary }]}>大丈夫？</Text>
        </TouchableOpacity>
      )}

      {isSelf && (
        <TouchableOpacity style={[styles.button, styles.imFineButton]} onPress={onPressImFine} activeOpacity={0.7}>
          <Smile size={18} color={colors.successText} />
          <Text style={[styles.buttonText, { color: colors.successText }]}>元気！</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    padding: spacing.lg,
    gap: spacing.md,
    backgroundColor: colors.cardBackground,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
  },
  checkInButton: {
    borderColor: colors.primary,
    backgroundColor: colors.cardBackground,
  },
  imFineButton: {
    borderColor: colors.successText,
    backgroundColor: colors.cardBackground,
  },
  buttonText: {
    fontSize: 15,
    fontWeight: '700',
    marginLeft: spacing.sm,
  },
});
