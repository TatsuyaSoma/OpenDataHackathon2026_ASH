import { useEffect, useState } from 'react';
import { MapSpot } from '../types';
import { fetchOsmSpots } from '../services/overpassSpots';

export type NearbySpotsStatus = 'loading' | 'success' | 'error';

interface Bounds {
  latMin: number;
  latMax: number;
  lngMin: number;
  lngMax: number;
}

// Overpass APIへの過剰な連打を避けるため、同じ範囲の結果はアプリ起動中キャッシュして使い回す
const spotsCache = new Map<string, Promise<MapSpot[]>>();

const getCachedSpots = (bounds: Bounds): Promise<MapSpot[]> => {
  const key = JSON.stringify(bounds);
  if (!spotsCache.has(key)) {
    spotsCache.set(key, fetchOsmSpots(bounds));
  }
  return spotsCache.get(key)!;
};

/**
 * 指定範囲内のコンビニ・自販機・カフェの実データ（OpenStreetMap）を取得するフック。
 * 取得中・失敗時は呼び出し側でモックデータへのフォールバックを行う想定。
 */
export const useNearbySpots = (bounds: Bounds) => {
  const [status, setStatus] = useState<NearbySpotsStatus>('loading');
  const [spots, setSpots] = useState<MapSpot[]>([]);
  const boundsKey = JSON.stringify(bounds);

  useEffect(() => {
    let cancelled = false;
    setStatus('loading');

    getCachedSpots(bounds)
      .then((result) => {
        if (cancelled) return;
        setSpots(result);
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

  return { spots, status };
};
