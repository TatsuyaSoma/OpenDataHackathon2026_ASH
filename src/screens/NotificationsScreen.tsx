import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { Filter, MoreVertical, Calendar } from 'lucide-react-native';
import { Member, NotificationItem, RiskLevel } from '../types';
import { RISK_CONFIG } from '../constants/riskConfig';
import { colors, spacing, radius } from '../constants/theme';
import { showAlert } from '../utils/crossPlatformAlert';
import { useMembers } from '../context/MembersContext';
import { useNotifications } from '../context/NotificationsContext';
import { NotificationCard } from '../components/NotificationCard';
import {
  NotificationFilterDropdown,
  NotificationFilterList,
  FilterOption,
} from '../components/NotificationFilterDropdown';

interface Props {
  onOpenMemberDetail?: (member: Member, notification: NotificationItem) => void;
}

type ReadFilter = 'all' | 'unread' | 'read';
type FilterKey = 'read' | 'risk' | 'member';

const READ_OPTIONS: FilterOption[] = [
  { value: 'all', label: 'すべて' },
  { value: 'unread', label: '未読' },
  { value: 'read', label: '既読' },
];

const RISK_OPTIONS: FilterOption[] = [
  { value: 'all', label: 'すべて' },
  ...Object.entries(RISK_CONFIG)
    .sort((a, b) => a[1].order - b[1].order)
    .map(([level, config]) => ({ value: level, label: config.label })),
];

/**
 * 通知履歴画面。危険度・メンバー・既読状態で絞り込み、日付ごとにグループ表示する。
 * 表示対象は過去1か月分（現状はモックデータのため件数は固定）。
 */
export const NotificationsScreen: React.FC<Props> = ({ onOpenMemberDetail }) => {
  const { members } = useMembers();
  const { notifications } = useNotifications();
  const MEMBER_OPTIONS: FilterOption[] = useMemo(
    () => [
      { value: 'all', label: 'すべて' },
      ...members.map((member) => ({ value: member.id, label: member.name })),
    ],
    [members]
  );
  const [readFilter, setReadFilter] = useState<ReadFilter>('all');
  const [riskFilter, setRiskFilter] = useState<'all' | RiskLevel>('all');
  const [memberFilter, setMemberFilter] = useState('all');
  // 同時に複数の絞り込みリストが開かないよう、開いているものを1つだけ保持する
  const [openFilter, setOpenFilter] = useState<FilterKey | null>(null);

  const toggleFilter = (key: FilterKey) =>
    setOpenFilter((prev) => (prev === key ? null : key));

  const resetFilters = () => {
    setReadFilter('all');
    setRiskFilter('all');
    setMemberFilter('all');
    setOpenFilter(null);
  };

  const readLabel = readFilter === 'all' ? 'すべて' : READ_OPTIONS.find((o) => o.value === readFilter)?.label ?? 'すべて';
  const riskLabel = riskFilter === 'all' ? '危険度' : RISK_OPTIONS.find((o) => o.value === riskFilter)?.label ?? '危険度';
  const memberLabel = memberFilter === 'all' ? 'メンバー' : MEMBER_OPTIONS.find((o) => o.value === memberFilter)?.label ?? 'メンバー';

  const activeListOptions =
    openFilter === 'read' ? READ_OPTIONS : openFilter === 'risk' ? RISK_OPTIONS : openFilter === 'member' ? MEMBER_OPTIONS : null;
  const activeListSelectedValue =
    openFilter === 'read' ? readFilter : openFilter === 'risk' ? riskFilter : openFilter === 'member' ? memberFilter : null;

  const handleSelectFilter = (value: string) => {
    if (openFilter === 'read') setReadFilter(value as ReadFilter);
    else if (openFilter === 'risk') setRiskFilter(value as 'all' | RiskLevel);
    else if (openFilter === 'member') setMemberFilter(value);
    setOpenFilter(null);
  };

  const filtered = useMemo(() => {
    return notifications.filter((notification) => {
      if (readFilter === 'unread' && notification.isRead) return false;
      if (readFilter === 'read' && !notification.isRead) return false;
      if (riskFilter !== 'all' && notification.riskLevel !== riskFilter) return false;
      if (memberFilter !== 'all' && notification.memberId !== memberFilter) return false;
      return true;
    });
  }, [notifications, readFilter, riskFilter, memberFilter]);

  const groups = useMemo(() => {
    const result: { label: string; items: NotificationItem[] }[] = [];
    filtered.forEach((notification) => {
      const group = result.find((g) => g.label === notification.dateLabel);
      if (group) {
        group.items.push(notification);
      } else {
        result.push({ label: notification.dateLabel, items: [notification] });
      }
    });
    return result;
  }, [filtered]);

  const handleCheckIn = (member: Member) => {
    showAlert('送信しました', `${member.name}に「大丈夫？」を送りました。`);
  };
  const handleImFine = (member: Member) => {
    showAlert('送信しました', `${member.name}に「元気！」を送りました。`);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

      <View style={styles.header}>
        <TouchableOpacity onPress={resetFilters} hitSlop={8}>
          <Filter size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>通知履歴</Text>
        <TouchableOpacity
          onPress={() => showAlert('メニュー', 'メニューは準備中です。')}
          hitSlop={8}>
          <MoreVertical size={22} color={colors.textPrimary} />
        </TouchableOpacity>
      </View>

      <View style={styles.filterRow}>
        <NotificationFilterDropdown
          label={readLabel}
          active={openFilter === 'read'}
          onPress={() => toggleFilter('read')}
        />
        <NotificationFilterDropdown
          label={riskLabel}
          active={openFilter === 'risk'}
          onPress={() => toggleFilter('risk')}
        />
        <NotificationFilterDropdown
          label={memberLabel}
          active={openFilter === 'member'}
          onPress={() => toggleFilter('member')}
        />
        <TouchableOpacity
          style={styles.periodChip}
          activeOpacity={0.7}
          onPress={() => showAlert('表示期間', '通知履歴の表示期間は過去1か月間固定です。')}>
          <Calendar size={14} color={colors.textSecondary} />
          <Text style={styles.periodChipText}>期間：過去1か月</Text>
        </TouchableOpacity>
      </View>

      {activeListOptions && activeListSelectedValue !== null && (
        <NotificationFilterList
          options={activeListOptions}
          selectedValue={activeListSelectedValue}
          onSelect={handleSelectFilter}
        />
      )}

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.listContent}>
        {groups.length === 0 ? (
          <Text style={styles.emptyText}>該当する通知はありません</Text>
        ) : (
          groups.map((group) => (
            <View key={group.label}>
              <Text style={styles.dateHeading}>{group.label}</Text>
              {group.items.map((notification) => {
                const member = members.find((m) => m.id === notification.memberId);
                if (!member) return null;
                return (
                  <NotificationCard
                    key={notification.id}
                    notification={notification}
                    member={member}
                    onPress={onOpenMemberDetail}
                    onPressCheckIn={handleCheckIn}
                    onPressImFine={handleImFine}
                  />
                );
              })}
            </View>
          ))
        )}

        {groups.length > 0 && (
          <Text style={styles.footerNote}>※過去1か月間の通知を表示しています</Text>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  scrollView: {
    flex: 1,
  },
  periodChip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.cardBackground,
  },
  periodChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    marginLeft: 6,
  },
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
  dateHeading: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.sm,
    marginTop: spacing.sm,
  },
  emptyText: {
    textAlign: 'center',
    color: colors.textSecondary,
    fontSize: 13,
    marginTop: spacing.xl,
  },
  footerNote: {
    textAlign: 'center',
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: spacing.sm,
  },
});
