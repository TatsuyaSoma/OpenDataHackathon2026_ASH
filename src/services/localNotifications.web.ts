// expo-notificationsはWeb未対応（対応プラットフォームはandroid/iosのみ）のため、Web版は何もしないダミー実装。
export const requestNotificationPermission = async (): Promise<boolean> => false;

export const sendDangerNotification = async (_message: string): Promise<void> => {};

export const sendVitalityReminderNotification = async (_message: string): Promise<void> => {};
