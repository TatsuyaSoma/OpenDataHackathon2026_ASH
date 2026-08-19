import type * as NotificationsType from 'expo-notifications';
import { Platform } from 'react-native';

// Expo Go（特にAndroid）では 'expo-notifications' をimportした時点（モジュール評価時）で
// 例外が投げられ、アプリ全体をクラッシュさせることがある。
// 静的importだとその場でモジュールが評価されてしまうため、require()をtry/catchで包み、
// 失敗した場合は通知機能そのものを無効化してアプリ本体は動作を継続させる。
let Notifications: typeof NotificationsType | undefined;
try {
  Notifications = require('expo-notifications');
} catch (error) {
  console.warn('通知機能を初期化できませんでした（この環境では利用できない可能性があります）:', error);
}

if (Notifications) {
  try {
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
      }).catch((error) => console.warn('通知チャンネルを作成できませんでした:', error));
    }
  } catch (error) {
    console.warn('通知機能の初期化に失敗しました:', error);
    Notifications = undefined;
  }
}

export const requestNotificationPermission = async (): Promise<boolean> => {
  if (!Notifications) return false;
  try {
    const { status } = await Notifications.requestPermissionsAsync();
    return status === 'granted';
  } catch (error) {
    console.warn('通知の権限リクエストに失敗しました:', error);
    return false;
  }
};

/**
 * 本人の体力ゲージが減ってきたことを端末のローカル通知で知らせる。
 * サーバーを介さないため、他メンバーの端末には届かない（バックエンド未実装のため対応不可）。
 */
export const sendDangerNotification = async (message: string): Promise<void> => {
  if (!Notifications) return;
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '体力ゲージが減っています',
        body: message,
      },
      trigger: null,
    });
  } catch (error) {
    console.warn('通知の送信に失敗しました:', error);
  }
};

/**
 * 本人の体力ゲージが一定値を下回るたびに、水分補給や休憩を促す端末のローカル通知を送る。
 */
export const sendVitalityReminderNotification = async (message: string): Promise<void> => {
  if (!Notifications) return;
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '体力ゲージが減っています',
        body: message,
      },
      trigger: null,
    });
  } catch (error) {
    console.warn('通知の送信に失敗しました:', error);
  }
};
