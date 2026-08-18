import Encoding from 'encoding-japanese';
import { MapSpot } from '../types';
import { parseCsv } from '../utils/csv';

// 東京都水道局が公開しているオープンデータ（東京都オープンデータカタログサイト経由、CC BY 4.0）。
// いずれもAPIキー不要・Shift_JISエンコードのCSV。
// 参考: https://catalog.data.metro.tokyo.lg.jp/dataset/t000019d0000000003 （Tokyowater Drinking Station一覧）
//       https://catalog.data.metro.tokyo.lg.jp/dataset/t000019d0000000001 （給水拠点一覧データ）
const DRINKING_STATION_CSV_URL =
  'https://www.opendata.metro.tokyo.lg.jp/suidou/R8/tokyowaterdrinkingstation_260227.csv';
const DISASTER_STATION_CSV_URL = 'https://www.opendata.metro.tokyo.lg.jp/suidou/R7/kyoten_20251211.csv';

interface Bounds {
  latMin: number;
  latMax: number;
  lngMin: number;
  lngMax: number;
}

// 都内全域のCSVを毎回全件表示すると地図が埋め尽くされるため、指定範囲内のみに絞り込む
const isWithinBounds = (latitude: number, longitude: number, bounds: Bounds) =>
  latitude >= bounds.latMin &&
  latitude <= bounds.latMax &&
  longitude >= bounds.lngMin &&
  longitude <= bounds.lngMax;

// CSV本体はShift_JISで配信されているため、バイト列からUnicode文字列へ変換する
// （React Native/HermesのTextDecoderはutf-8以外に対応していないため、encoding-japaneseで変換する）
const decodeShiftJisCsv = (buffer: ArrayBuffer): string => {
  const unicodeArray = Encoding.convert(new Uint8Array(buffer), { to: 'UNICODE', from: 'SJIS' });
  return Encoding.codeToString(unicodeArray);
};

const fetchCsvRows = async (url: string): Promise<string[][]> => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`給水スポットデータの取得に失敗しました（${response.status}）`);
  }
  const buffer = await response.arrayBuffer();
  const text = decodeShiftJisCsv(buffer);
  const rows = parseCsv(text);
  return rows.slice(1); // ヘッダ行を除く
};

/**
 * 東京都水道局「Tokyowater Drinking Station」（都内の給水スポット）を取得する。
 * CSV列: 緯度,経度,施設名,所在地,水飲み栓設置場所,営業時間,入場料等,タイプ,稼働停止,備考
 */
export const fetchDrinkingStations = async (bounds: Bounds): Promise<MapSpot[]> => {
  const rows = await fetchCsvRows(DRINKING_STATION_CSV_URL);

  return rows
    .filter((row) => (row[8] ?? '').trim() === '') // 稼働停止列に記載がある(=稼働停止中)ものは除外
    .map((row): MapSpot | null => {
      const latitude = Number(row[0]);
      const longitude = Number(row[1]);
      if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
      if (!isWithinBounds(latitude, longitude, bounds)) return null;
      return {
        id: `tokyowater-ds-${latitude}-${longitude}`,
        type: 'water',
        name: row[2] || '給水スポット',
        latitude,
        longitude,
      };
    })
    .filter((spot): spot is MapSpot => spot !== null);
};

/**
 * 東京都水道局「災害時給水ステーション（給水拠点）一覧」を取得する。
 * CSV列: 番号,緯度,経度,施設名,種別,確保水量（立方メートル）,所在地,詳細画像,情報更新日,備考
 */
export const fetchDisasterWaterStations = async (bounds: Bounds): Promise<MapSpot[]> => {
  const rows = await fetchCsvRows(DISASTER_STATION_CSV_URL);

  return rows
    .map((row): MapSpot | null => {
      const latitude = Number(row[1]);
      const longitude = Number(row[2]);
      if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
      if (!isWithinBounds(latitude, longitude, bounds)) return null;
      return {
        id: `tokyowater-kyoten-${row[0]}`,
        type: 'disasterWater',
        name: row[3] || '災害時給水ステーション',
        latitude,
        longitude,
      };
    })
    .filter((spot): spot is MapSpot => spot !== null);
};
