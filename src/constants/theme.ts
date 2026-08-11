/**
 * アプリ全体のテーマ定義（唯一の情報源）。
 *
 * 【重要】このファイルは2種類の命名規則を橋渡ししています。
 *  1. Expoテンプレート由来のコード（app-tabs.tsx / use-theme.ts / themed-text.tsx など）
 *     → Colors / Spacing / ThemeColor / Fonts を参照
 *  2. 本アプリ独自のホーム画面コンポーネント（HomeScreen / MemberCard など）
 *     → colors / spacing / radius を参照
 *
 * 過去に src/constants/theme.ts が (2) の内容だけで上書きされ、
 * (1) が参照する Colors / Spacing が undefined になったことが
 * 「Cannot read properties of undefined (reading 'three')」の直接の原因でした。
 * 今後は必ずこのファイル1つだけを更新し、src/cnstants/（スペルミスの重複フォルダ）は削除してください。
 */

// ─────────────────────────────────────────
// (1) Expoテンプレート系コードが参照する定義
// ─────────────────────────────────────────
export const Colors = {
  light: {
    text: '#1C1C1E',
    textSecondary: '#6B7280',
    background: '#F3F4F6',
    backgroundElement: '#FFFFFF',
    tint: '#2979FF',
    icon: '#6B7280',
    border: '#E5E7EB',
  },
  dark: {
    text: '#F3F4F6',
    textSecondary: '#9CA3AF',
    background: '#121212',
    backgroundElement: '#1E1E1E',
    tint: '#4FC3F7',
    icon: '#9CA3AF',
    border: '#2C2C2E',
  },
};

export type ThemeColor = keyof typeof Colors.light;

export const Fonts = {
  mono: 'monospace',
};

// one〜six の数値段階Spacing（Expoテンプレートのexplore.tsx等が使用）
export const Spacing = {
  one: 4,
  two: 8,
  three: 12,
  four: 16,
  five: 20,
  six: 24,
};

export const BottomTabInset = 49;
export const MaxContentWidth = 960;

// ─────────────────────────────────────────
// (2) 本アプリ独自コンポーネントが参照する定義
// ─────────────────────────────────────────
export const colors = {
  background: Colors.light.background,
  cardBackground: Colors.light.backgroundElement,
  textPrimary: Colors.light.text,
  textSecondary: Colors.light.textSecondary,
  border: Colors.light.border,
  primary: Colors.light.tint,
  bannerBackground: '#FFFFFF',
  bannerText: '#E53935',
  restBackground: '#EAF1FE',
  restBorder: '#C9DBFB',
  successText: '#2E7D32',
  successBackground: '#EAF7EC',
  successBorder: '#C8E6C9',
};

export const spacing = {
  xs: Spacing.one,
  sm: Spacing.two,
  md: Spacing.three,
  lg: Spacing.four,
  xl: Spacing.six,
};

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  full: 999,
};
