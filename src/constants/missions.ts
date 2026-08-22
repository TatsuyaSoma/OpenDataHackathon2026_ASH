export interface MissionDef {
  id: string;
  label: string;
  points: number; // 達成時に回復する体力ゲージの量
}

// カード詳細画面のミッション一覧（体力ゲージ回復のための行動チェックリスト）
export const MISSIONS: MissionDef[] = [
  { id: 'drink-cold-water', label: '冷たい水を飲もう', points: 10 },
  { id: 'cool-place', label: '涼しい場所にいよう', points: 20 },
  { id: 'cold-towel', label: '冷たいタオルを首に当てよう', points: 10 },
];

// 3つ全部を同時に達成中の状態にした際の追加ボーナス
export const MISSION_ALL_CLEAR_BONUS = 5;

// 各ミッションは達成後この時間が経つと再挑戦可能になる
export const MISSION_COOLDOWN_MS = 60 * 60 * 1000; // 1時間

// 全ミッション＋全クリアボーナスをすべて達成した場合に回復する体力の合計（プレビュー表示用）
export const MISSION_MAX_RECOVERY =
  MISSIONS.reduce((sum, mission) => sum + mission.points, 0) + MISSION_ALL_CLEAR_BONUS;
