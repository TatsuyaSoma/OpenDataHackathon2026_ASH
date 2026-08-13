import React from 'react';
import { View, Text, StyleSheet, Modal, Pressable, TouchableOpacity } from 'react-native';
import { Camera, Images } from 'lucide-react-native';
import { colors, spacing, radius } from '../constants/theme';

interface Props {
  visible: boolean;
  onClose: () => void;
  onSelectCamera: () => void;
  onSelectLibrary: () => void;
}

/**
 * 写真の取得方法（カメラ撮影／アルバムから選択）を選ぶ下からのシート。
 * Alert.alertは react-native-web で何も起きない実装（空の関数）になっており、
 * Web上ではこのダイアログ自体が機能しなかったため、専用のModalで置き換えている。
 */
export const PhotoSourceModal: React.FC<Props> = ({
  visible,
  onClose,
  onSelectCamera,
  onSelectLibrary,
}) => {
  return (
    <Modal visible={visible} transparent onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={() => {}}>
          <Text style={styles.title}>写真を追加</Text>
          <Text style={styles.subtitle}>取得方法を選んでください。</Text>

          <TouchableOpacity style={styles.option} activeOpacity={0.7} onPress={onSelectCamera}>
            <Camera size={20} color={colors.primary} />
            <Text style={styles.optionText}>カメラで撮影</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.option} activeOpacity={0.7} onPress={onSelectLibrary}>
            <Images size={20} color={colors.primary} />
            <Text style={styles.optionText}>アルバムから選択</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.cancelButton} activeOpacity={0.7} onPress={onClose}>
            <Text style={styles.cancelText}>キャンセル</Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.cardBackground,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    padding: spacing.lg,
    paddingBottom: spacing.xl,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: spacing.lg,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.sm,
  },
  optionText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
    marginLeft: spacing.md,
  },
  cancelButton: {
    alignItems: 'center',
    paddingVertical: spacing.md,
    marginTop: spacing.xs,
  },
  cancelText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textSecondary,
  },
});
