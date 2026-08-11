/**
 * 家族の熱中症見守りアプリ - 共通型定義
 */

// 危険度6段階（水色→緑→黄色→橙→赤→紫）
export type RiskLevel =
  | 'safeLight' // 水色：ほぼ安全
  | 'safe'      // 緑　：安全
  | 'caution'   // 黄色：注意
  | 'warning'   // 橙　：やや危険
  | 'danger'    // 赤　：危険
  | 'severe';   // 紫　：非常に危険

export type Gender = '男性' | '女性' | 'その他';

export interface LocationInfo {
  address: string;
  latitude: number;
  longitude: number;
}

export interface EnvironmentInfo {
  temperature: number; // ℃
  humidity: number;    // %
  wbgt?: number;        // 暑さ指数（算出できる場合）
  windSpeed?: number;    // 風速 m/s
}

// 危険度の推移グラフ用の1データ点
export interface RiskHistoryPoint {
  time: string; // 表示用 "3:41" 形式
  riskLevel: RiskLevel;
}

export interface Member {
  id: string;
  name: string;
  age: number;
  gender: Gender;
  birthDate?: string;        // 生年月日（表示用 "1957年3月15日" 形式）
  homeAddress?: string;       // 自宅住所（現在地とは別。カード詳細の基本情報に表示）
  medicalNotes?: string;       // 持病・注意事項
  photoUrl?: string;
  location: LocationInfo;
  environment: EnvironmentInfo;
  riskLevel: RiskLevel;
  riskHistory?: RiskHistoryPoint[]; // 直近の危険度推移（カード詳細画面のグラフ用）
  lastUpdated: string; // 表示用 "9:41" 形式
  isResting: boolean;  // お休みモード中かどうか
  restStartedAt?: string; // お休みモードを開始した時刻（表示用 "9:15" 形式）
}
