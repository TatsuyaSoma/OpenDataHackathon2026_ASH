import React from 'react';
import { HomeScreen } from './src/screens/HomeScreen';

/**
 * デモ用エントリポイント。
 * 本実装では @react-navigation/native の NavigationContainer + Stack Navigator配下に
 * HomeScreen / MemberDetailScreen / MapScreen / NotificationScreen / SettingsScreen を配置する想定。
 */
export default function App() {
  return <HomeScreen />;
}
