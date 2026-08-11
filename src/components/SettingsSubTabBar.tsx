import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { BedDouble, Bell, Database, Settings as SettingsIcon, Users } from 'lucide-react-native';
import type { LucideIcon } from 'lucide-react-native';
import { colors, spacing } from '../constants/theme';

export type SettingsTabKey = 'members' | 'rest' | 'notifications' | 'app' | 'data';

interface TabDef {
  key: SettingsTabKey;
  label: string;
  Icon: LucideIcon;
}

const TABS: TabDef[] = [
  { key: 'members', label: 'メンバ管理', Icon: Users },
  { key: 'rest', label: 'お休みモード', Icon: BedDouble },
  { key: 'notifications', label: '通知設定', Icon: Bell },
  { key: 'app', label: 'アプリ設定', Icon: SettingsIcon },
  { key: 'data', label: 'データ・その他', Icon: Database },
];

interface Props {
  activeTab: SettingsTabKey;
  onChangeTab: (tab: SettingsTabKey) => void;
}

/**
 * 設定画面内のサブナビゲーション（メンバ管理／お休みモード／通知設定／アプリ設定／データ・その他）。
 */
export const SettingsSubTabBar: React.FC<Props> = ({ activeTab, onChangeTab }) => {
  return (
    <View style={styles.container}>
      {TABS.map(({ key, label, Icon }) => {
        const active = key === activeTab;
        const color = active ? colors.primary : colors.textSecondary;
        return (
          <TouchableOpacity
            key={key}
            style={styles.tab}
            activeOpacity={0.7}
            onPress={() => onChangeTab(key)}>
            <Icon size={22} color={color} />
            <Text style={[styles.label, { color }]} numberOfLines={1}>
              {label}
            </Text>
            <View style={[styles.indicator, active && styles.indicatorActive]} />
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingHorizontal: spacing.sm,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  label: {
    fontSize: 10,
    marginTop: 4,
    fontWeight: '600',
  },
  indicator: {
    marginTop: spacing.sm,
    height: 2,
    width: '100%',
    borderRadius: 1,
    backgroundColor: 'transparent',
  },
  indicatorActive: {
    backgroundColor: colors.primary,
  },
});
