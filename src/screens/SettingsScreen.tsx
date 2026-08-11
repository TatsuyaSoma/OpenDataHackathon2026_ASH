import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, StatusBar, Alert } from 'react-native';
import { Bell, Database, Settings as SettingsIcon } from 'lucide-react-native';
import type { LucideIcon } from 'lucide-react-native';
import { Member } from '../types';
import { colors, spacing } from '../constants/theme';
import { useMembers } from '../context/MembersContext';
import { SettingsSubTabBar, SettingsTabKey } from '../components/SettingsSubTabBar';
import { MemberManagementSection } from '../components/MemberManagementSection';
import { RestModeSection } from '../components/RestModeSection';

interface StubSectionDef {
  title: string;
  message: string;
  Icon: LucideIcon;
}

// メンバ管理・お休みモード以外のタブは未着手のため、準備中の案内のみを表示する
const STUB_SECTIONS: Record<Exclude<SettingsTabKey, 'members' | 'rest'>, StubSectionDef> = {
  notifications: {
    title: '通知設定',
    message: '通知の受け取り方法・危険度の通知しきい値の設定は準備中です。',
    Icon: Bell,
  },
  app: {
    title: 'アプリ設定',
    message: 'テーマや表示に関する設定は準備中です。',
    Icon: SettingsIcon,
  },
  data: {
    title: 'データ・その他',
    message: 'データのエクスポートやアプリ情報の確認は準備中です。',
    Icon: Database,
  },
};

interface Props {
  onAddMember?: () => void; // メンバ登録画面への遷移（未指定時はモック案内を表示）
  onEditMember?: (member: Member) => void; // メンバ編集画面への遷移（未指定時はモック案内を表示）
}

/**
 * 設定画面。メンバ管理／お休みモード／通知設定／アプリ設定／データ・その他のサブタブを持つ。
 * 現状はメンバ管理のみ実装済みで、他は準備中の案内を表示する。
 */
export const SettingsScreen: React.FC<Props> = ({ onAddMember, onEditMember }) => {
  const [activeTab, setActiveTab] = useState<SettingsTabKey>('members');
  const { members, removeAllMembers, toggleResting } = useMembers();

  const handleAddMember = () => {
    if (onAddMember) {
      onAddMember();
    } else {
      Alert.alert('メンバを追加', 'メンバー追加機能は準備中です。');
    }
  };

  const handleEditMember = (member: Member) => {
    if (onEditMember) {
      onEditMember(member);
    } else {
      Alert.alert('メンバを編集', `${member.name}さんの編集画面は準備中です。`);
    }
  };

  const handleReorderMembers = () =>
    Alert.alert('並び順を変更', 'メンバーの並び替え機能は準備中です。');

  const handleBulkDelete = () => {
    Alert.alert(
      '見守りメンバを一括削除',
      'すべての見守りメンバを削除します。よろしいですか？',
      [
        { text: 'キャンセル', style: 'cancel' },
        { text: '削除する', style: 'destructive', onPress: removeAllMembers },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>設定</Text>
      </View>

      <SettingsSubTabBar activeTab={activeTab} onChangeTab={setActiveTab} />

      <ScrollView contentContainerStyle={styles.content}>
        {activeTab === 'members' ? (
          <MemberManagementSection
            members={members}
            onAddMember={handleAddMember}
            onEditMember={handleEditMember}
            onReorderMembers={handleReorderMembers}
            onBulkDelete={handleBulkDelete}
          />
        ) : activeTab === 'rest' ? (
          <RestModeSection members={members} onToggleResting={toggleResting} />
        ) : (
          <StubSection {...STUB_SECTIONS[activeTab]} />
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const StubSection: React.FC<StubSectionDef> = ({ title, message, Icon }) => (
  <View style={styles.stub}>
    <Icon size={36} color={colors.textSecondary} />
    <Text style={styles.stubTitle}>{title}</Text>
    <Text style={styles.stubMessage}>{message}</Text>
  </View>
);

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  content: {
    padding: spacing.lg,
  },
  stub: {
    alignItems: 'center',
    paddingVertical: 64,
  },
  stubTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: spacing.md,
  },
  stubMessage: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: spacing.sm,
    textAlign: 'center',
    paddingHorizontal: spacing.lg,
  },
});
