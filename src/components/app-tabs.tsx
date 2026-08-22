import { Tabs, TabList, TabSlot, TabTrigger } from 'expo-router/ui';
import type { TabTriggerSlotProps } from 'expo-router/ui';
import { Bell, Home, ListChecks, Map as MapIcon, Settings as SettingsIcon } from 'lucide-react-native';
import type { LucideIcon } from 'lucide-react-native';
import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { MissionListScreen } from '@/screens/MissionListScreen';
import { colors, spacing } from '@/constants/theme';

type TabButtonProps = TabTriggerSlotProps & {
  icon: LucideIcon;
};

// TabTriggerのasChild経由でisFocused等のpropsが渡される
// （Web版の_layout.web.tsxと同じ、TabList自体もasChildで包む構成にしている）
function TabButton({ icon: Icon, children, isFocused, ...props }: TabButtonProps) {
  const color = isFocused ? colors.primary : colors.textSecondary;
  return (
    <Pressable {...props} style={styles.tabButton}>
      <Icon size={22} color={color} />
      <Text style={[styles.tabLabel, { color }]} numberOfLines={1}>
        {children}
      </Text>
    </Pressable>
  );
}

/**
 * 画面下部のタブバー。ホーム・マップ・通知履歴・設定は通常どおりルート遷移するタブとして
 * expo-router/ui のヘッドレスTabsで実装し、「ミッション」だけは画面遷移させず、
 * ローカルstateで現在の画面の上に別レイヤーとして重ねて表示する。
 *
 * TabListにstyleだけを渡す実装では "Couldn't find any screens for the navigator" エラーになり
 * 動作しなかったが、Web版（_layout.web.tsx）で使われている「TabList自体もasChildで包み、
 * 中のViewに直接TabTriggerを並べる」構成に合わせたところ正しく動作した。
 * この構成なら、TabTrigger以外の通常のPressable（ミッションボタン）もその同じView内に
 * そのまま並べられるため、タブ項目の間に自然に埋め込める。
 */
export default function AppTabs() {
  const insets = useSafeAreaInsets();
  const [missionOpen, setMissionOpen] = useState(false);

  return (
    <Tabs style={styles.root}>
      <TabSlot />

      <TabList asChild>
        <View style={StyleSheet.flatten([styles.tabBar, { paddingBottom: insets.bottom }])}>
          <TabTrigger name="index" href="/" asChild>
            <TabButton icon={Home}>ホーム</TabButton>
          </TabTrigger>
          <TabTrigger name="map" href="/map" asChild>
            <TabButton icon={MapIcon}>マップ</TabButton>
          </TabTrigger>

          <Pressable style={styles.tabButton} onPress={() => setMissionOpen(true)}>
            <ListChecks size={22} color={missionOpen ? colors.primary : colors.textSecondary} />
            <Text
              style={[styles.tabLabel, { color: missionOpen ? colors.primary : colors.textSecondary }]}
              numberOfLines={1}>
              ミッション
            </Text>
          </Pressable>

          <TabTrigger name="notifications" href="/notifications" asChild>
            <TabButton icon={Bell}>通知履歴</TabButton>
          </TabTrigger>
          <TabTrigger name="settings" href="/settings" asChild>
            <TabButton icon={SettingsIcon}>設定</TabButton>
          </TabTrigger>
        </View>
      </TabList>

      {missionOpen && (
        <View style={StyleSheet.absoluteFill}>
          <MissionListScreen onClose={() => setMissionOpen(false)} />
        </View>
      )}
    </Tabs>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: colors.cardBackground,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
  },
  tabLabel: {
    fontSize: 11,
    marginTop: 2,
  },
});
