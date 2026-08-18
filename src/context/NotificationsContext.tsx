import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NotificationItem } from '../types';
import { mockNotifications } from '../data/mockData';

// 通知履歴をローカル端末に永続化する際のAsyncStorageキー
const NOTIFICATIONS_STORAGE_KEY = '@family-heatstroke-watch/notifications';

interface NotificationsContextValue {
  notifications: NotificationItem[];
  addNotification: (notification: NotificationItem) => void;
}

const NotificationsContext = createContext<NotificationsContextValue | undefined>(undefined);

/**
 * 通知履歴をアプリ全体で共有するstate。端末に永続化するため、アプリを再起動しても消えない。
 * データソースはモックのため、実装時はAPI連携のstate管理に置き換える想定。
 */
export const NotificationsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<NotificationItem[]>(mockNotifications);
  // 起動直後の読み込み完了前に、モックの初期値でストレージを上書きしてしまわないようにするためのフラグ
  const hasHydratedRef = useRef(false);

  // 起動時に、端末に永続化された通知履歴があれば読み込む（無ければモックのまま）
  useEffect(() => {
    AsyncStorage.getItem(NOTIFICATIONS_STORAGE_KEY)
      .then((json) => {
        if (json) setNotifications(JSON.parse(json));
      })
      .catch((error) => console.warn('通知履歴の読み込みに失敗しました:', error))
      .finally(() => {
        hasHydratedRef.current = true;
      });
  }, []);

  // 通知履歴が変化するたびに端末へ永続化する
  useEffect(() => {
    if (!hasHydratedRef.current) return;
    AsyncStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(notifications)).catch((error) =>
      console.warn('通知履歴の保存に失敗しました:', error)
    );
  }, [notifications]);

  // 新しい通知履歴を先頭に追加する（体力ゲージのしきい値超過など、アプリ内で発生したイベントを記録する用途）
  const addNotification = useCallback((notification: NotificationItem) => {
    setNotifications((prev) => [notification, ...prev]);
  }, []);

  return (
    <NotificationsContext.Provider value={{ notifications, addNotification }}>
      {children}
    </NotificationsContext.Provider>
  );
};

export const useNotifications = (): NotificationsContextValue => {
  const context = useContext(NotificationsContext);
  if (!context) {
    throw new Error('useNotifications は NotificationsProvider の内側でのみ使用できます。');
  }
  return context;
};
