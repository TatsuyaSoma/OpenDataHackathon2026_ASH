import { EnvironmentInfo, RiskLevel } from '../types';

/**
 * 熱中症危険度（RiskLevel・スコア）の算出ロジック。
 *
 * 【重要】算出仕様はチーム内でまだ完全には確定していないため、気温・湿度・年齢を使った
 * 簡易的な計算に留めている。将来的に暑さ指数(WBGT)・活動量・お休みモード等を
 * 反映した正式な仕様に差し替える想定。
 *
 * 呼び出し側（MembersContext・MapHeatmapLayer・RiskGauge等）はこのファイルの公開関数の
 * シグネチャ（環境情報を渡すとスコア/RiskLevelが返る）にのみ依存しているため、
 * 中身の計算式を差し替えても呼び出し側の変更は不要。
 */

type RiskCalculationInput = Pick<EnvironmentInfo, 'temperature' | 'humidity'> & {
  age?: number; // 未指定の場合は成人相当（補正なし）として扱う
};

// 環境省・総務省消防庁の熱中症予防情報で「高齢者」「乳幼児・小児」は体温調節機能が
// 未発達／低下しておりリスクが高いとされているため、体感温度に年齢による加算補正をかける。
// 境界年齢で数値が飛ばないよう、区間ごとに線形補間する。
const estimateAgeAdjustment = (age?: number): number => {
  if (age === undefined) return 0;
  if (age <= 6) return 2.5;
  if (age < 12) return (2.5 * (12 - age)) / 6; // 6歳:+2.5℃ → 12歳:+0℃
  if (age < 65) return 0;
  if (age < 75) return (2.0 * (age - 65)) / 10; // 65歳:+0℃ → 75歳:+2.0℃（前期高齢者）
  if (age < 85) return 2.0 + (1.0 * (age - 75)) / 10; // 75歳:+2.0℃ → 85歳:+3.0℃（後期高齢者）
  return 3.0;
};

// 湿度が高いほど体感の暑さが増すことと、年齢による感受性の違いを簡易的に織り込んだ
// 「体感温度もどき」。正式なWBGT（暑さ指数）の計算式ではない。
const estimateFeelsLikeTemperature = ({ temperature, humidity, age }: RiskCalculationInput) =>
  temperature + Math.max(0, humidity - 60) * 0.05 + estimateAgeAdjustment(age);

// 体感温度もどきをスコア0〜100に線形変換する際の基準値
const MIN_FEELS_LIKE = 18; // このとき0点
const MAX_FEELS_LIKE = 40; // このとき100点

/**
 * 気温・湿度から熱中症危険度スコア（0〜100の整数、大きいほど危険）を算出する。
 */
export const estimateRiskScore = (input: RiskCalculationInput): number => {
  const feelsLike = estimateFeelsLikeTemperature(input);
  const ratio = (feelsLike - MIN_FEELS_LIKE) / (MAX_FEELS_LIKE - MIN_FEELS_LIKE);
  return Math.round(Math.min(1, Math.max(0, ratio)) * 100);
};

// スコア(0〜100)を、アプリ共通の危険度6段階（RISK_CONFIG）のしきい値に対応づける
const SCORE_THRESHOLDS: { level: RiskLevel; max: number }[] = [
  { level: 'safeLight', max: 20 },
  { level: 'safe', max: 40 },
  { level: 'caution', max: 55 },
  { level: 'warning', max: 70 },
  { level: 'danger', max: 82 },
  { level: 'severe', max: Infinity },
];

/**
 * 気温・湿度から熱中症危険度（6段階）を算出する。スコアと同じ計算結果から導出するため、
 * 常にestimateRiskScoreの値と矛盾しない。
 */
export const estimateRiskLevel = (input: RiskCalculationInput): RiskLevel => {
  const score = estimateRiskScore(input);
  return (SCORE_THRESHOLDS.find((t) => score < t.max) ?? SCORE_THRESHOLDS.at(-1)!).level;
};
