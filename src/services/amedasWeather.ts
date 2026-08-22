// 気象庁アメダスの非公式公開JSON（APIキー不要・CORS許可あり）を情報源とするが、
// 「未文書化のエンドポイントへ継続的にアクセスし続けるのはグレー」という判断から、
// 2026-08-21 14:50 JST 時点で一度だけ取得したスナップショット（`src/data/amedasStationTable.json`・
// `src/data/amedasLatestSnapshot.json`）をテストデータとして固定的に使い続ける方針に変更した。
// 以後、この2ファイルを更新しない限り実況値は変化しない（＝ネットワーク取得は行わない）。
// 参考: https://www.jma.go.jp/bosai/amedas/ （観測データの二次利用は自己責任・仕様は予告なく変わりうる）

import stationTableSnapshot from '../data/amedasStationTable.json';
import latestDataSnapshot from '../data/amedasLatestSnapshot.json';

const SNAPSHOT_OBSERVED_AT = '2026-08-21T14:50:00+09:00';

interface AmedasStationEntry {
  lat: [number, number]; // [度, 分]
  lon: [number, number];
  kjName: string;
}

type AmedasStationTable = Record<string, AmedasStationEntry>;

interface AmedasObservationEntry {
  temp?: [number | null, number];
  humidity?: [number | null, number];
}

type AmedasLatestData = Record<string, AmedasObservationEntry>;

export interface NearestWeatherResult {
  temperature: number;
  humidity: number;
  stationName: string;
  observedAt: string; // ISO文字列
}

export interface StationWeatherPoint {
  stationId: string;
  name: string;
  latitude: number;
  longitude: number;
  temperature: number;
  humidity: number;
}

interface Bounds {
  latMin: number;
  latMax: number;
  lngMin: number;
  lngMax: number;
}

// 観測地点の[度,分]表記を10進の緯度経度に変換する
const toDecimalDegrees = ([deg, min]: [number, number]) => deg + min / 60;

const haversineDistanceKm = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

// 観測地点一覧・最新観測値は、いずれもファイル先頭でimportした固定スナップショットをそのまま返す
// （fetchNearestWeather / fetchNearestWeatherBatch / fetchStationsInBounds で共有）。
// 関数名・戻り値の形（Promise）は変更前と揃えてあり、呼び出し側の実装は変更不要。
const fetchStationTableAndLatestData = async () => {
  return {
    stationTable: stationTableSnapshot as unknown as AmedasStationTable,
    latestData: latestDataSnapshot as unknown as AmedasLatestData,
    latestTimeText: SNAPSHOT_OBSERVED_AT,
  };
};

/**
 * 指定した緯度経度に最も近く、気温・湿度の両方を観測しているアメダス地点の現在値を取得する。
 * 取得できない場合はnullを返す。
 */
export const fetchNearestWeather = async (
  latitude: number,
  longitude: number
): Promise<NearestWeatherResult | null> => {
  const { stationTable, latestData, latestTimeText } = await fetchStationTableAndLatestData();

  const candidates = Object.entries(stationTable)
    .map(([stationId, station]) => ({
      stationId,
      station,
      distanceKm: haversineDistanceKm(
        latitude,
        longitude,
        toDecimalDegrees(station.lat),
        toDecimalDegrees(station.lon)
      ),
    }))
    .sort((a, b) => a.distanceKm - b.distanceKm);

  for (const { stationId, station } of candidates) {
    const observation = latestData[stationId];
    const temp = observation?.temp?.[0];
    const humidity = observation?.humidity?.[0];
    if (temp != null && humidity != null) {
      return {
        temperature: temp,
        humidity,
        stationName: station.kjName,
        observedAt: latestTimeText,
      };
    }
  }

  return null;
};

/**
 * 複数地点分の最寄りアメダス実況値を、観測地点一覧・最新観測データを1回だけ取得してまとめて求める。
 * メンバーごとに`fetchNearestWeather`を個別に呼ぶと、地点数ぶんだけ最新観測データ（数百KB）を
 * 重複して取得してしまうため、見守りメンバー全員分をまとめて更新する用途ではこちらを使う。
 * 該当地点が見つからないポイントは戻り値のMapに含まれない。
 */
export const fetchNearestWeatherBatch = async (
  points: { id: string; latitude: number; longitude: number }[]
): Promise<Map<string, NearestWeatherResult>> => {
  const { stationTable, latestData, latestTimeText } = await fetchStationTableAndLatestData();
  const stations = Object.entries(stationTable);
  const results = new Map<string, NearestWeatherResult>();

  for (const point of points) {
    const candidates = stations
      .map(([stationId, station]) => ({
        stationId,
        station,
        distanceKm: haversineDistanceKm(
          point.latitude,
          point.longitude,
          toDecimalDegrees(station.lat),
          toDecimalDegrees(station.lon)
        ),
      }))
      .sort((a, b) => a.distanceKm - b.distanceKm);

    for (const { stationId, station } of candidates) {
      const observation = latestData[stationId];
      const temp = observation?.temp?.[0];
      const humidity = observation?.humidity?.[0];
      if (temp != null && humidity != null) {
        results.set(point.id, { temperature: temp, humidity, stationName: station.kjName, observedAt: latestTimeText });
        break;
      }
    }
  }

  return results;
};

/**
 * 指定範囲内にある、気温・湿度の両方を観測しているアメダス地点をすべて取得する。
 * マップのヒートマップ表示に使う。
 */
export const fetchStationsInBounds = async (bounds: Bounds): Promise<StationWeatherPoint[]> => {
  const { stationTable, latestData } = await fetchStationTableAndLatestData();

  return Object.entries(stationTable)
    .map(([stationId, station]): StationWeatherPoint | null => {
      const latitude = toDecimalDegrees(station.lat);
      const longitude = toDecimalDegrees(station.lon);
      if (
        latitude < bounds.latMin ||
        latitude > bounds.latMax ||
        longitude < bounds.lngMin ||
        longitude > bounds.lngMax
      ) {
        return null;
      }

      const observation = latestData[stationId];
      const temperature = observation?.temp?.[0];
      const humidity = observation?.humidity?.[0];
      if (temperature == null || humidity == null) return null;

      return { stationId, name: station.kjName, latitude, longitude, temperature, humidity };
    })
    .filter((point): point is StationWeatherPoint => point !== null);
};
