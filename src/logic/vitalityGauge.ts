import { RiskLevel } from '../types';

/**
 * マップ・ホーム画面に表示する「体力ゲージ」（0〜100）のロジック。
 *
 * riskCalculation.tsが算出する「今どれだけ危険な環境にいるか」とは別に、
 * こちらは「その危険な環境にどれだけ耐えているか」を表すゲージ体力。
 * 危険な状態が続くと減っていき、お休み中や安全な状態では自然回復する、ゲーム感覚のHPバー。
 *
 * 【重要】減少・回復のペースは実時間ではなく「デモで動きが見えること」を優先した速さに
 * 調整している（MembersContext.tsのVITALITY_TICK_INTERVAL_MS参照）。実運用に合わせて
 * 調整する場合はDECAY_RATE_PER_MINUTE / RESTING_RECOVERY_RATE_PER_MINUTEの値のみ変更すればよい。
 */

// 現在の危険度レベルごとの、1分あたりの体力増減量（マイナスが減少、プラスが回復）
const DECAY_RATE_PER_MINUTE: Record<RiskLevel, number> = {
  safeLight: 10,
  safe: 5,
  caution: 0,
  warning: -10,
  danger: -20,
  severe: -30,
};

// お休みモード中は、現在の環境に関わらずこのペースで回復する
const RESTING_RECOVERY_RATE_PER_MINUTE = 15;

/**
 * 経過時間（分）に応じて体力ゲージを増減させる。0〜100の範囲にクランプする。
 */
export const applyVitalityTick = (
  vitality: number,
  riskLevel: RiskLevel,
  isResting: boolean,
  elapsedMinutes: number
): number => {
  const ratePerMinute = isResting ? RESTING_RECOVERY_RATE_PER_MINUTE : DECAY_RATE_PER_MINUTE[riskLevel];
  const next = vitality + ratePerMinute * elapsedMinutes;
  return Math.min(100, Math.max(0, Math.round(next)));
};

// 体力ゲージ(0〜100、高いほど良好)を、既存の危険度6色（RISK_CONFIG）で表現するための対応表。
// 危険度レベルと逆向き（体力が高いほど安全カラー）に対応づけることで、新しい配色を増やさずに
// 「HPバーが赤くなっていく」ような見た目を実現する。
const VITALITY_LEVEL_THRESHOLDS: { level: RiskLevel; min: number }[] = [
  { level: 'safeLight', min: 85 },
  { level: 'safe', min: 70 },
  { level: 'caution', min: 55 },
  { level: 'warning', min: 40 },
  { level: 'danger', min: 20 },
  { level: 'severe', min: 0 },
];

export const estimateVitalityLevel = (vitality: number): RiskLevel =>
  (VITALITY_LEVEL_THRESHOLDS.find((t) => vitality >= t.min) ?? VITALITY_LEVEL_THRESHOLDS.at(-1)!).level;
