// 気象庁アメダスの非公式公開JSON（APIキー不要・CORS許可あり）から、
// 指定した緯度経度に最も近い観測地点の現在気温・湿度を取得する。
// 参考: https://www.jma.go.jp/bosai/amedas/ （観測データの二次利用は自己責任・仕様は予告なく変わりうる）

const STATION_TABLE_URL = 'https://www.jma.go.jp/bosai/amedas/const/amedastable.json';
const LATEST_TIME_URL = 'https://www.jma.go.jp/bosai/amedas/data/latest_time.txt';

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

// 観測地点一覧は頻繁には変わらないため、アプリ起動中はモジュールレベルでキャッシュして使い回す
let stationTableCache: Promise<AmedasStationTable> | undefined;
const fetchStationTable = (): Promise<AmedasStationTable> => {
  if (!stationTableCache) {
    stationTableCache = fetch(STATION_TABLE_URL).then((res) => {
      if (!res.ok) throw new Error(`観測地点一覧の取得に失敗しました（${res.status}）`);
      return res.json();
    });
  }
  return stationTableCache;
};

// 端末のタイムゾーンに関わらず日本時間（UTC+9）でURL用のタイムスタンプを組み立てる
const formatTimestampForUrl = (isoString: string) => {
  const jst = new Date(new Date(isoString).getTime() + 9 * 60 * 60 * 1000);
  const pad = (n: number) => String(n).padStart(2, '0');
  return (
    `${jst.getUTCFullYear()}${pad(jst.getUTCMonth() + 1)}${pad(jst.getUTCDate())}` +
    `${pad(jst.getUTCHours())}${pad(jst.getUTCMinutes())}00`
  );
};

// 観測地点一覧・最新観測値をまとめて取得する（fetchNearestWeather / fetchStationsInBounds で共有）
const fetchStationTableAndLatestData = async () => {
  const stationTable = await fetchStationTable();

  const latestTimeRes = await fetch(LATEST_TIME_URL);
  if (!latestTimeRes.ok) throw new Error(`観測時刻の取得に失敗しました（${latestTimeRes.status}）`);
  const latestTimeText = (await latestTimeRes.text()).trim();

  const latestDataRes = await fetch(
    `https://www.jma.go.jp/bosai/amedas/data/map/${formatTimestampForUrl(latestTimeText)}.json`
  );
  if (!latestDataRes.ok) throw new Error(`観測データの取得に失敗しました（${latestDataRes.status}）`);
  const latestData: AmedasLatestData = await latestDataRes.json();

  return { stationTable, latestData, latestTimeText };
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
