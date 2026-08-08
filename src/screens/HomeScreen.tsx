import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { Menu, Bell } from 'lucide-react-native';
import { Member } from '../types';
import { isHighRisk } from '../constants/riskConfig';
import { colors, spacing } from '../constants/theme';
import { mockMembers } from '../data/mockData';
import { AlertBanner } from '../components/AlertBanner';
import { MemberCard } from '../components/MemberCard';
import { RestModeBar } from '../components/RestModeBar';
import { BottomTabBar, TabKey } from '../components/BottomTabBar';

interface Props {
  // カード詳細画面への遷移をここで受け取る（react-navigation導入後は navigation.navigate に置き換え）
  onOpenMemberDetail?: (member: Member) => void;
  onOpenMenu?: () => void;
  onOpenNotifications?: () => void;
  onOpenRestModeSetting?: () => void;
}

export const HomeScreen: React.FC<Props> = ({
  onOpenMemberDetail,
  onOpenMenu,
  onOpenNotifications,
  onOpenRestModeSetting,
}) => {
  const [members] = useState<Member[]>(mockMembers);
  const [activeTab, setActiveTab] = useState<TabKey>('home');

  // お休み中のメンバーは危険者数のカウントから除外する
  const dangerCount = useMemo(
    () => members.filter((m) => isHighRisk(m.riskLevel) && !m.isResting).length,
    [members]
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

      {/* ヘッダー */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onOpenMenu} hitSlop={8}>
          <Menu size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>家族の熱中症見守り</Text>
        <TouchableOpacity onPress={onOpenNotifications} hitSlop={8} style={styles.bellButton}>
          <Bell size={24} color={colors.textPrimary} />
          <View style={styles.bellDot} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={members}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          dangerCount > 0 ? (
            <AlertBanner dangerCount={dangerCount} onPress={onOpenNotifications} />
          ) : null
        }
        renderItem={({ item }) => (
          <MemberCard member={item} onPress={(m) => onOpenMemberDetail?.(m)} />
        )}
        ListFooterComponent={
          <RestModeBar onPressSetting={() => onOpenRestModeSetting?.()} />
        }
      />

      <BottomTabBar activeTab={activeTab} onChangeTab={setActiveTab} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  bellButton: {
    position: 'relative',
  },
  bellDot: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E53935',
  },
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
});
