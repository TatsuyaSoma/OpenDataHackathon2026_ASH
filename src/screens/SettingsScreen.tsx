import React, { useState } from 'react';
import { StyleSheet, ScrollView, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Member } from '../types';
import { colors, spacing } from '../constants/theme';
import { showAlert } from '../utils/crossPlatformAlert';
import { useMembers } from '../context/MembersContext';
import { SettingsSubTabBar, SettingsTabKey } from '../components/SettingsSubTabBar';
import { MemberManagementSection } from '../components/MemberManagementSection';
import { RestModeSection } from '../components/RestModeSection';
import { NotificationSettingsSection } from '../components/NotificationSettingsSection';
import { AppSettingsSection } from '../components/AppSettingsSection';

interface Props {
  onAddMember?: () => void; // メンバ登録画面への遷移（未指定時はモック案内を表示）
  onEditMember?: (member: Member) => void; // メンバ編集画面への遷移（未指定時はモック案内を表示）
  onReorderMembers?: () => void; // 並び順変更画面への遷移（未指定時はモック案内を表示）
}

/**
 * 設定画面。メンバ管理／お休みモード／通知設定／アプリ設定のサブタブを持つ。
 */
export const SettingsScreen: React.FC<Props> = ({ onAddMember, onEditMember, onReorderMembers }) => {
  const [activeTab, setActiveTab] = useState<SettingsTabKey>('members');
  const { members, removeAllMembers, toggleResting } = useMembers();

  const handleAddMember = () => {
    if (onAddMember) {
      onAddMember();
    } else {
      showAlert('メンバを追加', 'メンバー追加機能は準備中です。');
    }
  };

  const handleEditMember = (member: Member) => {
    if (onEditMember) {
      onEditMember(member);
    } else {
      showAlert('メンバを編集', `${member.name}の編集画面は準備中です。`);
    }
  };

  const handleReorderMembers = () => {
    if (onReorderMembers) {
      onReorderMembers();
    } else {
      showAlert('並び順を変更', 'メンバーの並び替え機能は準備中です。');
    }
  };

  const handleBulkDelete = () => {
    showAlert(
      '見守りメンバを一括削除',
      'すべての見守りメンバを削除します。よろしいですか？',
      [
        { text: 'キャンセル', style: 'cancel' },
        { text: '削除する', style: 'destructive', onPress: removeAllMembers },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

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
        ) : activeTab === 'notifications' ? (
          <NotificationSettingsSection members={members} />
        ) : (
          <AppSettingsSection />
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.lg,
  },
});
