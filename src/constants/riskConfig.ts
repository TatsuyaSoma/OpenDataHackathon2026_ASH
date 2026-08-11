import { RiskLevel } from '../types';

export interface RiskConfigItem {
  label: string;      // 画面表示用ラベル
  color: string;       // メインカラー
  bgColor: string;      // バッジ・カード背景色
  colorName: string;     // 色の日本語名（レベル表示用：例「赤」）
  order: number;          // 1(安全) 〜 6(非常に危険)
  advice: string;          // カード詳細画面に表示する注意喚起文
}

// 水色 → 緑 → 黄色 → 橙 → 赤 → 紫 の6段階
export const RISK_CONFIG: Record<RiskLevel, RiskConfigItem> = {
  safeLight: {
    label: 'ほぼ安全',
    color: '#4FC3F7',
    bgColor: '#E8F7FD',
    colorName: '水色',
    order: 1,
    advice: '現時点で特別な対策は不要です。水分補給は忘れずに行いましょう。',
  },
  safe: {
    label: '安全',
    color: '#4CAF50',
    bgColor: '#EAF7EC',
    colorName: '緑',
    order: 2,
    advice: '通常どおり過ごして問題ありません。こまめな水分補給を心がけましょう。',
  },
  caution: {
    label: '注意',
    color: '#FBC02D',
    bgColor: '#FFF8E1',
    colorName: '黄色',
    order: 3,
    advice: '積極的に水分・塩分を補給しましょう。長時間の屋外活動は控えめに。',
  },
  warning: {
    label: 'やや危険',
    color: '#F5A623',
    bgColor: '#FFF3E0',
    colorName: '橙',
    order: 4,
    advice: '運動や屋外作業はこまめに休憩を取り、無理をしないようにしましょう。',
  },
  danger: {
    label: '危険',
    color: '#E53935',
    bgColor: '#FDECEC',
    colorName: '赤',
    order: 5,
    advice: '高齢者は特に注意が必要です。こまめな水分補給と涼しい場所での休憩をおすすめします。',
  },
  severe: {
    label: '非常に危険',
    color: '#8E24AA',
    bgColor: '#F3E5F5',
    colorName: '紫',
    order: 6,
    advice: '外出は極力控え、涼しい室内で過ごしてください。体調に異変があれば早めに連絡を。',
  },
};

export const RISK_LEVEL_COUNT = 6;

// カードの外枠を強調表示すべき危険度（danger, severe）
export const isHighRisk = (level: RiskLevel): boolean =>
  RISK_CONFIG[level].order >= RISK_CONFIG.danger.order;
