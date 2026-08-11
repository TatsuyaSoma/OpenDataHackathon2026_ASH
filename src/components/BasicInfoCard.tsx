import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, radius } from '../constants/theme';

interface Props {
  birthDate?: string;
  homeAddress?: string;
  medicalNotes?: string;
}

interface Row {
  label: string;
  value: string;
}

export const BasicInfoCard: React.FC<Props> = ({ birthDate, homeAddress, medicalNotes }) => {
  const rows: Row[] = [
    { label: '生年月日', value: birthDate ?? '未登録' },
    { label: '自宅住所', value: homeAddress ?? '未登録' },
    { label: '持病・注意事項', value: medicalNotes ?? '登録なし' },
  ];

  return (
    <View style={styles.card}>
      <Text style={styles.title}>基本情報</Text>
      {rows.map((row) => (
        <View key={row.label} style={styles.row}>
          <Text style={styles.label}>{row.label}</Text>
          <Text style={styles.value}>{row.value}</Text>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.cardBackground,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  row: {
    flexDirection: 'row',
    paddingVertical: spacing.xs,
  },
  label: {
    width: 120,
    fontSize: 13,
    color: colors.textSecondary,
  },
  value: {
    flex: 1,
    fontSize: 13,
    color: colors.textPrimary,
  },
});
