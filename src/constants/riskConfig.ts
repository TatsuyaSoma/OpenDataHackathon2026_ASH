import { RiskLevel } from '../types';

export interface RiskConfigItem {
  label: string;      // 画面表示用ラベル
  color: string;       // メインカラー
  bgColor: string;      // バッジ・カード背景色
  order: number;        // 1(安全) 〜 6(非常に危険)
}

// 水色 → 緑 → 黄色 → 橙 → 赤 → 紫 の6段階
export const RISK_CONFIG: Record<RiskLevel, RiskConfigItem> = {
  safeLight: { label: 'ほぼ安全', color: '#4FC3F7', bgColor: '#E8F7FD', order: 1 },
  safe: { label: '安全', color: '#4CAF50', bgColor: '#EAF7EC', order: 2 },
  caution: { label: '注意', color: '#FBC02D', bgColor: '#FFF8E1', order: 3 },
  warning: { label: 'やや危険', color: '#F5A623', bgColor: '#FFF3E0', order: 4 },
  danger: { label: '危険', color: '#E53935', bgColor: '#FDECEC', order: 5 },
  severe: { label: '非常に危険', color: '#8E24AA', bgColor: '#F3E5F5', order: 6 },
};

export const RISK_LEVEL_COUNT = 6;

// カードの外枠を強調表示すべき危険度（danger, severe）
export const isHighRisk = (level: RiskLevel): boolean =>
  RISK_CONFIG[level].order >= RISK_CONFIG.danger.order;
