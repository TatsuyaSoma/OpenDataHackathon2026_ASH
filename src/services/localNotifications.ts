import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';

// フォアグラウンド中もバナー表示させる（デフォルトのままだとアプリ起動中は表示されないため）
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// Android 13+は通知チャンネルが1つも無いと権限プロンプト自体が表示されないため、起動時に作成しておく
if (Platform.OS === 'android') {
  Notifications.setNotificationChannelAsync('default', {
    name: '危険度アラート',
    importance: Notifications.AndroidImportance.HIGH,
  });
}

export const requestNotificationPermission = async (): Promise<boolean> => {
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
};

/**
 * 本人の熱中症危険度がしきい値を超えたことを端末のローカル通知で知らせる。
 * サーバーを介さないため、他メンバーの端末には届かない（バックエンド未実装のため対応不可）。
 */
export const sendDangerNotification = async (memberName: string, riskLabel: string): Promise<void> => {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: '熱中症の危険度が上昇しています',
      body: `${memberName}の危険度が「${riskLabel}」になりました。水分補給や涼しい場所での休憩を心がけてください。`,
    },
    trigger: null,
  });
};
