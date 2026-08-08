import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Home, MapPin, Bell, Settings } from 'lucide-react-native';
import { colors, spacing } from '../constants/theme';

export type TabKey = 'home' | 'map' | 'notifications' | 'settings';

interface Props {
  activeTab: TabKey;
  onChangeTab: (tab: TabKey) => void;
}

const TABS: { key: TabKey; label: string; Icon: typeof Home }[] = [
  { key: 'home', label: 'ホーム', Icon: Home },
  { key: 'map', label: 'マップ', Icon: MapPin },
  { key: 'notifications', label: '通知履歴', Icon: Bell },
  { key: 'settings', label: '設定', Icon: Settings },
];

/**
 * 画面下部のタブバー（見た目のみのモック）。
 * 本実装では @react-navigation/bottom-tabs への置き換えを想定。
 */
export const BottomTabBar: React.FC<Props> = ({ activeTab, onChangeTab }) => {
  return (
    <View style={styles.container}>
      {TABS.map(({ key, label, Icon }) => {
        const active = key === activeTab;
        const color = active ? colors.primary : colors.textSecondary;
        return (
          <TouchableOpacity key={key} style={styles.tab} onPress={() => onChangeTab(key)}>
            <Icon size={22} color={color} />
            <Text style={[styles.label, { color }]}>{label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.cardBackground,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
  },
  label: {
    fontSize: 11,
    marginTop: 2,
  },
});
