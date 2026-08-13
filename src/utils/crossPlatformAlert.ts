import { Alert, Platform } from 'react-native';

interface AlertButton {
  text?: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive';
}

// react-native-webのAlert.alertは空実装（何も起きない）のため、Web向けにwindow.alert/confirmで代替する。
// 3つ以上の選択肢を持つダイアログ（例：写真の取得方法選択）はこの方式で表現できないため、
// そういった箇所は専用のモーダルコンポーネントを別途用意すること。
const showWebAlert = (title: string, message?: string, buttons?: AlertButton[]) => {
  const fullMessage = [title, message].filter(Boolean).join('\n\n');

  if (!buttons || buttons.length === 0) {
    window.alert(fullMessage);
    return;
  }
  if (buttons.length === 1) {
    window.alert(fullMessage);
    buttons[0].onPress?.();
    return;
  }

  const cancelButton = buttons.find((b) => b.style === 'cancel');
  const confirmButton = buttons.find((b) => b !== cancelButton) ?? buttons[0];
  if (window.confirm(fullMessage)) {
    confirmButton.onPress?.();
  } else {
    cancelButton?.onPress?.();
  }
};

/**
 * Alert.alertのクロスプラットフォーム版。ネイティブ（iOS/Android）ではAlert.alertをそのまま使い、
 * Webではwindow.alert/confirmで代替する。
 */
export const showAlert = (title: string, message?: string, buttons?: AlertButton[]) => {
  if (Platform.OS === 'web') {
    showWebAlert(title, message, buttons);
  } else {
    Alert.alert(title, message, buttons);
  }
};
