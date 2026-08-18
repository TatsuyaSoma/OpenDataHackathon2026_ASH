import { RiskLevel } from '../types';

// 環境省「熱中症予防情報サイト」の暑さ指数(WBGT)電子情報提供サービス。
// APIキー不要・CORS許可あり（Access-Control-Allow-Origin: *）の公開API。
// 参考: https://www.wbgt.env.go.jp/data_service.php
//       https://www.wbgt.env.go.jp/man15NH/wbgt_data_api_service_manual.pdf
//
// 【重要】都内の情報提供地点は数が少なく（練馬・八王子・府中・江戸川臨海・大島など10地点程度）、
// このアプリの地図が表示する丸の内・日本橋周辺エリアの中や近傍には1つも存在しない
// （最寄りでも数km〜10km程度離れている）。そのため「高解像度メッシュ」のような面的な表示は
// 再現できないが、地図を広域表示した際は、都内に点在するこれらの実測地点から
// 逆距離加重法（IDW）で補間した「実データに基づく粗いヒートマップ」を`MapWbgtTileLayer`で
// 表示している（詳細は同ファイルのコメント参照）。
const WBGT_API_BASE = 'https://www.wbgt.env.go.jp/api/v1';

// 都の地点マスタ（東京都水道局データ等とは異なり、この地点コード体系は環境省WBGTサービス独自のもの。
// 参考: https://www.wbgt.env.go.jp/man15NH/wbgt_point_master-20260515.csv のうち東京都(振興局コード44)分を抜粋）
interface TokyoWbgtPoint {
  no: number;
  name: string;
  latitude: number;
  longitude: number;
}

const TOKYO_WBGT_POINTS: TokyoWbgtPoint[] = [
  { no: 44046, name: '小河内', latitude: 35.7917, longitude: 139.05 },
  { no: 44056, name: '青梅', latitude: 35.7883, longitude: 139.3117 },
  { no: 44071, name: '練馬', latitude: 35.7383, longitude: 139.5917 },
  { no: 44112, name: '八王子', latitude: 35.6667, longitude: 139.3167 },
  { no: 44116, name: '府中', latitude: 35.6833, longitude: 139.4833 },
  { no: 44132, name: '東京（文京区）', latitude: 35.6917, longitude: 139.75 },
  { no: 44136, name: '江戸川臨海', latitude: 35.6383, longitude: 139.8633 },
  { no: 44172, name: '大島', latitude: 34.7483, longitude: 139.3617 },
  { no: 44226, name: '三宅島', latitude: 34.1233, longitude: 139.52 },
  { no: 44263, name: '八丈島', latitude: 33.1217, longitude: 139.7783 },
  { no: 44301, name: '父島', latitude: 27.0917, longitude: 142.19 },
];

interface SurveyRecord {
  wbgt_no: number;
  wbgt_date: string; // "2026/08/18 13:00:00"
  wbgt_WO: string; // 暑さ指数（屋外推定値）
}

interface SurveyResponse {
  status: 'success' | 'error';
  data: SurveyRecord[];
}

export interface NearestTokyoWbgt {
  pointName: string;
  distanceKm: number;
  wbgt: number;
  observedAt: string; // "2026/08/18 13:00:00"
}

// 都内1地点分のWBGT実況値（地点の位置つき）。広域ヒートマップの補間に使う。
export interface TokyoWbgtReading {
  pointNo: number;
  pointName: string;
  latitude: number;
  longitude: number;
  wbgt: number;
  observedAt: string;
}

const JST_OFFSET_MS = 9 * 60 * 60 * 1000;

const formatJstDateTime = (date: Date): string => {
  const jst = new Date(date.getTime() + JST_OFFSET_MS);
  const y = jst.getUTCFullYear();
  const m = String(jst.getUTCMonth() + 1).padStart(2, '0');
  const d = String(jst.getUTCDate()).padStart(2, '0');
  const h = String(jst.getUTCHours()).padStart(2, '0');
  return `${y}${m}${d}${h}0000`;
};

// 2地点間の距離（km）をHaversine公式で算出する
export const haversineDistanceKm = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

// WBGT値（暑さ指数）を、このアプリの危険度6段階に変換する。
// 環境省・日本生気象学会が示す「日常生活における熱中症予防指針」のWBGT基準
// （21未満:ほぼ安全 / 21〜25:注意 / 25〜28:警戒 / 28〜31:厳重警戒 / 31〜:危険）を、
// このアプリの6段階（危険をdanger/severeの2段階に分割）へ近似的に対応づけている。
export const wbgtToRiskLevel = (wbgt: number): RiskLevel => {
  if (wbgt >= 33) return 'severe';
  if (wbgt >= 31) return 'danger';
  if (wbgt >= 28) return 'warning';
  if (wbgt >= 25) return 'caution';
  if (wbgt >= 21) return 'safe';
  return 'safeLight';
};

const fetchLatestByPoint = async (): Promise<Map<number, SurveyRecord>> => {
  const now = new Date();
  const dateFrom = formatJstDateTime(new Date(now.getTime() - 3 * 60 * 60 * 1000));
  const dateTo = formatJstDateTime(now);

  const url = `${WBGT_API_BASE}/getSurveyData?data_type=0&location_type=2&pref_cds=44&date_from=${dateFrom}&date_to=${dateTo}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`WBGT実況値の取得に失敗しました（${response.status}）`);
  }
  const body: SurveyResponse = await response.json();
  if (body.status !== 'success') return new Map();

  // 地点ごとに最新の1件だけを残す
  const latestByPoint = new Map<number, SurveyRecord>();
  for (const record of body.data) {
    const current = latestByPoint.get(record.wbgt_no);
    if (!current || record.wbgt_date > current.wbgt_date) {
      latestByPoint.set(record.wbgt_no, record);
    }
  }
  return latestByPoint;
};

/**
 * 都内の全WBGT実況値配信地点の直近値を、位置情報つきで取得する。
 * 広域ヒートマップ（`MapWbgtTileLayer`）の逆距離加重補間に使う。
 * 欠測・センサー不調とみなせる地点（0以下の値）は除外する。
 */
export const fetchAllTokyoWbgt = async (): Promise<TokyoWbgtReading[]> => {
  const latestByPoint = await fetchLatestByPoint();
  const readings: TokyoWbgtReading[] = [];

  for (const point of TOKYO_WBGT_POINTS) {
    const record = latestByPoint.get(point.no);
    const wbgt = record ? Number(record.wbgt_WO) : NaN;
    // wbgt_WOが0以下の場合、実際の気象条件としてはほぼあり得ないため、
    // センサー不調・欠測時のプレースホルダー値とみなして候補から除外する
    if (!record || Number.isNaN(wbgt) || wbgt <= 0) continue;

    readings.push({
      pointNo: point.no,
      pointName: point.name,
      latitude: point.latitude,
      longitude: point.longitude,
      wbgt,
      observedAt: record.wbgt_date,
    });
  }

  return readings;
};

/**
 * 指定座標（このアプリでは地図表示範囲の中心＝丸の内周辺）に最も近い、
 * 都内でWBGT実況値を配信中の地点の直近値を取得する。
 * 該当地点が1件も実況値を返さない場合（欠測・地点そのものの配信休止等）はnullを返す。
 */
export const fetchNearestTokyoWbgt = async (
  targetLat: number,
  targetLng: number
): Promise<NearestTokyoWbgt | null> => {
  const readings = await fetchAllTokyoWbgt();

  let nearest: NearestTokyoWbgt | null = null;
  let nearestDistance = Infinity;

  for (const reading of readings) {
    const distance = haversineDistanceKm(targetLat, targetLng, reading.latitude, reading.longitude);
    if (distance < nearestDistance) {
      nearestDistance = distance;
      nearest = {
        pointName: reading.pointName,
        distanceKm: distance,
        wbgt: reading.wbgt,
        observedAt: reading.observedAt,
      };
    }
  }

  return nearest;
};
