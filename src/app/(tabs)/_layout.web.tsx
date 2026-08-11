import { Tabs, TabList, TabTrigger, TabSlot } from 'expo-router/ui';
import type { TabTriggerSlotProps } from 'expo-router/ui';
import type { Href } from 'expo-router';
import { Pressable, Text, View, StyleSheet } from 'react-native';
import { Home, MapPin, Bell, Settings } from 'lucide-react-native';
import type { LucideIcon } from 'lucide-react-native';
import { colors, spacing } from '@/constants/theme';

// (tabs)グループのindexルートの実際のURLは "/" だが、typed routesの自動生成は
// グループ配下indexの素の "/" を候補に含めないため、ここだけ型キャストで回避する。
const HOME_HREF = '/' as Href;

type TabButtonProps = TabTriggerSlotProps & {
  Icon: LucideIcon;
};

function TabButton({ Icon, children, isFocused, ...props }: TabButtonProps) {
  const color = isFocused ? colors.primary : colors.textSecondary;
  return (
    <Pressable {...props} style={styles.tabButton}>
      <Icon size={22} color={color} />
      <Text style={[styles.tabLabel, { color }]}>{children}</Text>
    </Pressable>
  );
}

/**
 * NativeTabsはWebでは下部固定のシステムタブバーを持たず「iPad風の簡易表示」に
 * 自動フォールバックするため、Web版のみ expo-router/ui のheadless tabsで
 * 画面下部に固定したタブバーを自作する（ネイティブは同階層の _layout.tsx のNativeTabsを使用）。
 */
export default function WebTabLayout() {
  return (
    <Tabs>
      <TabSlot />
      <TabList asChild>
        <View style={styles.tabList}>
          <TabTrigger name="index" href={HOME_HREF} asChild>
            <TabButton Icon={Home}>ホーム</TabButton>
          </TabTrigger>
          <TabTrigger name="map" href="/map" asChild>
            <TabButton Icon={MapPin}>マップ</TabButton>
          </TabTrigger>
          <TabTrigger name="notifications" href="/notifications" asChild>
            <TabButton Icon={Bell}>通知履歴</TabButton>
          </TabTrigger>
          <TabTrigger name="settings" href="/settings" asChild>
            <TabButton Icon={Settings}>設定</TabButton>
          </TabTrigger>
        </View>
      </TabList>
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabList: {
    flexDirection: 'row',
    position: 'fixed',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.cardBackground,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
});
