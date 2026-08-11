import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Thermometer, Droplet, Wind } from 'lucide-react-native';
import { EnvironmentInfo } from '../types';
import { colors, spacing, radius } from '../constants/theme';

interface Props {
  environment: EnvironmentInfo;
  observedAt: string; // "9:41時点" のような表示用テキスト
}

interface StatItem {
  key: string;
  label: string;
  value: string;
  icon: React.ReactNode;
}

export const EnvironmentStatsGrid: React.FC<Props> = ({ environment, observedAt }) => {
  const stats: StatItem[] = [
    {
      key: 'temperature',
      label: '気温',
      value: `${environment.temperature.toFixed(1)}℃`,
      icon: <Thermometer size={18} color="#E53935" />,
    },
    {
      key: 'humidity',
      label: '湿度',
      value: `${Math.round(environment.humidity)}%`,
      icon: <Droplet size={18} color="#F5A623" />,
    },
    {
      key: 'wbgt',
      label: 'WBGT',
      value: environment.wbgt != null ? `${environment.wbgt.toFixed(1)}℃` : '-',
      icon: <Droplet size={18} color="#2979FF" />,
    },
    {
      key: 'windSpeed',
      label: '風速',
      value: environment.windSpeed != null ? `${environment.windSpeed.toFixed(1)} m/s` : '-',
      icon: <Wind size={18} color="#2979FF" />,
    },
  ];

  return (
    <View style={styles.card}>
      <Text style={styles.title}>現在の環境（{observedAt}時点）</Text>
      <View style={styles.grid}>
        {stats.map((stat) => (
          <View key={stat.key} style={styles.statBox}>
            <View style={styles.statHeader}>
              {stat.icon}
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
            <Text style={styles.statValue}>{stat.value}</Text>
          </View>
        ))}
      </View>
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
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -spacing.xs,
  },
  statBox: {
    width: '50%',
    paddingHorizontal: spacing.xs,
    marginBottom: spacing.md,
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginLeft: spacing.xs,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: 4,
  },
});
