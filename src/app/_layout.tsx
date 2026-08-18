import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { useColorScheme } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { MembersProvider } from '@/context/MembersContext';
import { NotificationsProvider } from '@/context/NotificationsContext';

export default function RootLayout() {
  const colorScheme = useColorScheme();

  // モジュールロード時の直接呼び出しはタイミング次第で不安定になりうるため、
  // レンダリング後に確実に実行されるuseEffect内へ移動（レビュー指摘反映）。
  useEffect(() => {
    SplashScreen.preventAutoHideAsync();
  }, []);

  return (
    // マップ画面のドラッグ操作（react-native-gesture-handlerのGesture.Pan）を使うため、
    // ルート直下をGestureHandlerRootViewで包む必要がある（公式ドキュメント要件）。
    <GestureHandlerRootView style={{ flex: 1 }}>
      {/* react-native標準のSafeAreaViewはAndroidでは正しくセーフエリアを反映しない（非推奨）ため、
          react-native-safe-area-contextのSafeAreaView/useSafeAreaInsetsが実際のインセットを
          取得できるよう、アプリ全体をSafeAreaProviderで包む。 */}
      <SafeAreaProvider>
        <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
          <AnimatedSplashOverlay />
          {/* (tabs) をタブ本体、member/[id] をその上に積むスタック画面として扱う。
              NativeTabs を直接ルートレイアウトにすると、タブ外のルート（詳細画面等）を
              プッシュする土台が無く遷移できないため、ルートStackで包む構成にしている。 */}
          {/* MembersProvider内部で体力ゲージ低下時に通知履歴へ記録するため、
              NotificationsProviderをMembersProviderの外側（先に）配置している。 */}
          <NotificationsProvider>
            <MembersProvider>
              <Stack screenOptions={{ headerShown: false }}>
                <Stack.Screen name="(tabs)" />
                <Stack.Screen name="member/[id]" />
                <Stack.Screen name="member/new" />
              </Stack>
            </MembersProvider>
          </NotificationsProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
