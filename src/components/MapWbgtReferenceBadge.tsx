import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Thermometer } from 'lucide-react-native';
import { NearestTokyoWbgt } from '../services/envWbgt';
import { colors, spacing, radius } from '../constants/theme';

interface Props {
  data: NearestTokyoWbgt;
}

/**
 * 環境省「熱中症予防情報サイト」の実況値のうち、地図の表示範囲に最も近い地点の値を
 * 参考として表示するバッジ。都内の情報提供地点は少なく、この地図が表示するエリア（丸の内周辺）の
 * 近傍には地点が無いため、あくまで「参考値」であることと最寄り地点名・距離を明示する
 * （面的なメッシュ表示ではなく、単一の実測値であることを誤解させないため）。
 */
export const MapWbgtReferenceBadge: React.FC<Props> = ({ data }) => {
  return (
    <View style={styles.container}>
      <Thermometer size={14} color={colors.primary} />
      <Text style={styles.text} numberOfLines={2}>
        参考WBGT {data.wbgt.toFixed(1)}（{data.pointName}・約{Math.round(data.distanceKm)}km先の実況）
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cardBackground,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    maxWidth: 220,
  },
  text: {
    fontSize: 11,
    color: colors.textPrimary,
    marginLeft: 6,
    flexShrink: 1,
  },
});
