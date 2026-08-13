import React, { useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, SafeAreaView, StatusBar } from 'react-native';
import { Member } from '../types';
import { isHighRisk } from '../constants/riskConfig';
import { colors, spacing } from '../constants/theme';
import { useMembers } from '../context/MembersContext';
import { AlertBanner } from '../components/AlertBanner';
import { MemberCard } from '../components/MemberCard';
import { RestModeBar } from '../components/RestModeBar';
import { RestStatusBanner } from '../components/RestStatusBanner';

interface Props {
  // カード詳細画面への遷移をここで受け取る（react-navigation導入後は navigation.navigate に置き換え）
  onOpenMemberDetail?: (member: Member) => void;
  onOpenNotifications?: () => void;
}

export const HomeScreen: React.FC<Props> = ({ onOpenMemberDetail, onOpenNotifications }) => {
  const { members, toggleResting } = useMembers();
  const selfMember = members.find((m) => m.isSelf);

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
        <Text style={styles.headerTitle}>家族の熱中症見守り</Text>
      </View>

      <FlatList
        style={styles.list}
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
      />

      {selfMember && (
        <View style={styles.restModeBarWrapper}>
          {selfMember.isResting ? (
            <RestStatusBanner
              restStartedAt={selfMember.restStartedAt}
              onPressRelease={() => toggleResting(selfMember.id)}
            />
          ) : (
            <RestModeBar onPressStart={() => toggleResting(selfMember.id)} />
          )}
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
  restModeBarWrapper: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    backgroundColor: colors.background,
  },
});
