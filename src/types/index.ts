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

// マップ画面に表示するスポット（コンビニ・自販機・給水スポット・災害時給水ステーション・カフェ）
export type MapSpotType = 'convenience' | 'vending' | 'water' | 'disasterWater' | 'cafe';

export interface MapSpot {
  id: string;
  type: MapSpotType;
  name: string;
  latitude: number;
  longitude: number;
}

// 通知履歴の1件分
export interface NotificationItem {
  id: string;
  memberId: string;
  riskLevel: RiskLevel;
  message?: string; // リアルタイム通知と同じ本文（旧形式の履歴では未設定）
  changed: boolean; // true: 危険度が変化した通知（〜になりました） / false: 現在の状態通知（〜です）
  location: string; // 表示用の住所
  time: string;     // 表示用 "9:41" 形式
  dateLabel: string; // セクション見出し用 "今日" "昨日" など
  isRead: boolean;
}

export interface Member {
  id: string;
  name: string;
  age: number;
  gender: Gender;
  isSelf?: boolean;          // trueの場合、この端末を使っている本人。locationは固定のモック位置（実際の現在地取得は停止中）
  birthDate?: string;        // 生年月日（表示用 "1957年3月15日" 形式）
  homeAddress?: string;       // 自宅住所（現在地とは別。カード詳細の基本情報に表示）
  medicalNotes?: string;       // 持病・注意事項
  notes?: string;             // 備考（その他メモ）
  photoUrl?: string;
  location: LocationInfo;
  environment: EnvironmentInfo;
  riskLevel: RiskLevel;
  riskScore?: number; // 危険度スコア（0〜100）。MembersContextがenvironmentから都度算出して埋める
  riskHistory?: RiskHistoryPoint[]; // 直近の危険度推移（カード詳細画面のグラフ用）
  lastUpdated: string; // 表示用 "9:41" 形式
  isResting: boolean;  // お休みモード中かどうか
  restStartedAt?: string; // お休みモードを開始した時刻（表示用 "9:15" 形式）
  vitality: number; // 体力ゲージ（0〜100）。危険な状態が続くと減り、休憩や安全な状態で回復する（ホーム・マップの円形ゲージに表示）
}
