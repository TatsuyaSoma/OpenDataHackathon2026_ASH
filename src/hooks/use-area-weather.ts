import { useEffect, useState } from 'react';
import { fetchStationsInBounds, StationWeatherPoint } from '../services/amedasWeather';

export type AreaWeatherStatus = 'loading' | 'success' | 'error';

interface Bounds {
  latMin: number;
  latMax: number;
  lngMin: number;
  lngMax: number;
}

// 同じ範囲への連続リクエストを避けるため、アプリ起動中は結果をキャッシュして使い回す
// （アメダスは10分間隔更新のため、セッション内では都度取り直さなくても実用上問題ない）
const stationsCache = new Map<string, Promise<StationWeatherPoint[]>>();

const getCachedStations = (bounds: Bounds): Promise<StationWeatherPoint[]> => {
  const key = JSON.stringify(bounds);
  if (!stationsCache.has(key)) {
    stationsCache.set(key, fetchStationsInBounds(bounds));
  }
  return stationsCache.get(key)!;
};

/**
 * 指定範囲内のアメダス観測地点（気温・湿度）を取得するフック。
 * マップのヒートマップ表示に使う。
 */
export const useAreaWeather = (bounds: Bounds) => {
  const [status, setStatus] = useState<AreaWeatherStatus>('loading');
  const [stations, setStations] = useState<StationWeatherPoint[]>([]);
  const boundsKey = JSON.stringify(bounds);

  useEffect(() => {
    let cancelled = false;
    setStatus('loading');

    getCachedStations(bounds)
      .then((result) => {
        if (cancelled) return;
        setStations(result);
        setStatus('success');
      })
      .catch(() => {
        if (cancelled) return;
        setStatus('error');
      });

    return () => {
      cancelled = true;
    };
  }, [boundsKey]);

  return { stations, status };
};
