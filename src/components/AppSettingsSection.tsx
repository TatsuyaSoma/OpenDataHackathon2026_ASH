import React, { useState } from 'react';
import { View, Text, StyleSheet, Switch, TouchableOpacity } from 'react-native';
import { ArrowUpDown, Info, Palette, Thermometer, Type, Vibrate } from 'lucide-react-native';
import { colors, spacing, radius } from '../constants/theme';

type ThemeMode = 'light' | 'dark' | 'auto';
type TemperatureUnit = 'celsius' | 'fahrenheit';
type FontSize = 'standard' | 'large';
type SortOrder = 'risk' | 'registered';

interface SegmentOption<T extends string> {
  value: T;
  label: string;
}

const THEME_OPTIONS: SegmentOption<ThemeMode>[] = [
  { value: 'light', label: 'ライト' },
  { value: 'dark', label: 'ダーク' },
  { value: 'auto', label: '端末に合わせる' },
];

const TEMPERATURE_UNIT_OPTIONS: SegmentOption<TemperatureUnit>[] = [
  { value: 'celsius', label: '摂氏（℃）' },
  { value: 'fahrenheit', label: '華氏（°F）' },
];

const FONT_SIZE_OPTIONS: SegmentOption<FontSize>[] = [
  { value: 'standard', label: '標準' },
  { value: 'large', label: '大きめ' },
];

const SORT_ORDER_OPTIONS: SegmentOption<SortOrder>[] = [
  { value: 'risk', label: '危険度が高い順' },
  { value: 'registered', label: '登録順' },
];

interface SegmentedControlProps<T extends string> {
  options: SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
}

const SegmentedControl = <T extends string>({ options, value, onChange }: SegmentedControlProps<T>) => (
  <View style={styles.segmentGroup}>
    {options.map((option) => {
      const selected = option.value === value;
      return (
        <TouchableOpacity
          key={option.value}
          style={[styles.segmentOption, selected && styles.segmentOptionSelected]}
          activeOpacity={0.7}
          onPress={() => onChange(option.value)}>
          <Text style={[styles.segmentOptionText, selected && styles.segmentOptionTextSelected]}>
            {option.label}
          </Text>
        </TouchableOpacity>
      );
    })}
  </View>
);

const APP_VERSION = '1.0.0';

/**
 * 設定画面「アプリ設定」タブの内容。
 * 表示テーマ・気温単位・文字サイズ・ホーム画面の並び順・振動フィードバックを設定する（表示のみのモック）。
 */
export const AppSettingsSection: React.FC = () => {
  const [themeMode, setThemeMode] = useState<ThemeMode>('auto');
  const [temperatureUnit, setTemperatureUnit] = useState<TemperatureUnit>('celsius');
  const [fontSize, setFontSize] = useState<FontSize>('standard');
  const [sortOrder, setSortOrder] = useState<SortOrder>('risk');
  const [hapticsEnabled, setHapticsEnabled] = useState(true);

  return (
    <View>
      <Text style={styles.title}>アプリ設定</Text>
      <Text style={styles.subtitle}>表示に関する設定を変更できます。</Text>

      <View style={styles.card}>
        <View style={styles.rowHeader}>
          <Palette size={18} color={colors.textSecondary} style={styles.rowIcon} />
          <Text style={styles.cardTitle}>表示テーマ</Text>
        </View>
        <SegmentedControl options={THEME_OPTIONS} value={themeMode} onChange={setThemeMode} />
      </View>

      <View style={styles.card}>
        <View style={styles.rowHeader}>
          <Thermometer size={18} color={colors.textSecondary} style={styles.rowIcon} />
          <Text style={styles.cardTitle}>気温の表示単位</Text>
        </View>
        <SegmentedControl
          options={TEMPERATURE_UNIT_OPTIONS}
          value={temperatureUnit}
          onChange={setTemperatureUnit}
        />
      </View>

      <View style={styles.card}>
        <View style={styles.rowHeader}>
          <Type size={18} color={colors.textSecondary} style={styles.rowIcon} />
          <Text style={styles.cardTitle}>文字サイズ</Text>
        </View>
        <SegmentedControl options={FONT_SIZE_OPTIONS} value={fontSize} onChange={setFontSize} />
      </View>

      <View style={styles.card}>
        <View style={styles.rowHeader}>
          <ArrowUpDown size={18} color={colors.textSecondary} style={styles.rowIcon} />
          <Text style={styles.cardTitle}>ホーム画面のカード並び順</Text>
        </View>
        <SegmentedControl options={SORT_ORDER_OPTIONS} value={sortOrder} onChange={setSortOrder} />
      </View>

      <View style={styles.card}>
        <View style={styles.toggleRow}>
          <Vibrate size={18} color={colors.textSecondary} style={styles.rowIcon} />
          <View style={styles.toggleTextColumn}>
            <Text style={styles.cardTitle}>操作時に振動でフィードバックする</Text>
          </View>
          <Switch
            value={hapticsEnabled}
            onValueChange={setHapticsEnabled}
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor="#FFFFFF"
            ios_backgroundColor={colors.border}
          />
        </View>
      </View>

      <View style={styles.card}>
        <View style={styles.toggleRow}>
          <Info size={18} color={colors.textSecondary} style={styles.rowIcon} />
          <Text style={styles.cardTitle}>アプリバージョン</Text>
          <Text style={styles.versionText}>{APP_VERSION}</Text>
        </View>
      </View>

      <Text style={styles.mockNote}>
        ※この設定は表示のみのモックで、実際の表示には反映されません。
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  subtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
    marginBottom: spacing.lg,
  },
  card: {
    backgroundColor: colors.cardBackground,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  rowHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  rowIcon: {
    marginRight: spacing.sm,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  toggleTextColumn: {
    flex: 1,
  },
  versionText: {
    marginLeft: 'auto',
    fontSize: 13,
    color: colors.textSecondary,
  },
  segmentGroup: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  segmentOption: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
  },
  segmentOptionSelected: {
    backgroundColor: colors.restBackground,
    borderColor: colors.primary,
  },
  segmentOptionText: {
    fontSize: 12,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  segmentOptionTextSelected: {
    color: colors.primary,
    fontWeight: '700',
  },
  mockNote: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 4,
  },
});
