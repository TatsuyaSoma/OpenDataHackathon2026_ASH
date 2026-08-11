import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { useColorScheme } from 'react-native';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { MembersProvider } from '@/context/MembersContext';

export default function RootLayout() {
  const colorScheme = useColorScheme();

  // モジュールロード時の直接呼び出しはタイミング次第で不安定になりうるため、
  // レンダリング後に確実に実行されるuseEffect内へ移動（レビュー指摘反映）。
  useEffect(() => {
    SplashScreen.preventAutoHideAsync();
  }, []);

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <AnimatedSplashOverlay />
      {/* (tabs) をタブ本体、member/[id] をその上に積むスタック画面として扱う。
          NativeTabs を直接ルートレイアウトにすると、タブ外のルート（詳細画面等）を
          プッシュする土台が無く遷移できないため、ルートStackで包む構成にしている。 */}
      <MembersProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="member/[id]" />
          <Stack.Screen name="member/new" />
        </Stack>
      </MembersProvider>
    </ThemeProvider>
  );
}
