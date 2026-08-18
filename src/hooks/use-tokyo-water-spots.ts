import { useEffect, useState } from 'react';
import { MapSpot } from '../types';
import { fetchDisasterWaterStations, fetchDrinkingStations } from '../services/tokyoWaterSpots';

export type TokyoWaterSpotsStatus = 'loading' | 'success' | 'error';

interface Bounds {
  latMin: number;
  latMax: number;
  lngMin: number;
  lngMax: number;
}

// CSVは都内全域が対象で毎回ダウンロードすると重いため、アプリ起動中は範囲ごとに結果をキャッシュして使い回す
const drinkingCache = new Map<string, Promise<MapSpot[]>>();
const disasterCache = new Map<string, Promise<MapSpot[]>>();

const getCached = (cache: Map<string, Promise<MapSpot[]>>, bounds: Bounds, fetcher: (b: Bounds) => Promise<MapSpot[]>) => {
  const key = JSON.stringify(bounds);
  if (!cache.has(key)) {
    cache.set(key, fetcher(bounds));
  }
  return cache.get(key)!;
};

/**
 * 指定範囲内の給水スポット（東京都水道局「Tokyowater Drinking Station」）と
 * 災害時給水ステーション（同「給水拠点一覧データ」）の実データを取得するフック。
 * 取得中・失敗時は呼び出し側でモックデータへのフォールバックを行う想定。
 */
export const useTokyoWaterSpots = (bounds: Bounds) => {
  const [status, setStatus] = useState<TokyoWaterSpotsStatus>('loading');
  const [drinkingSpots, setDrinkingSpots] = useState<MapSpot[]>([]);
  const [disasterSpots, setDisasterSpots] = useState<MapSpot[]>([]);
  const boundsKey = JSON.stringify(bounds);

  useEffect(() => {
    let cancelled = false;
    setStatus('loading');

    Promise.all([
      getCached(drinkingCache, bounds, fetchDrinkingStations),
      getCached(disasterCache, bounds, fetchDisasterWaterStations),
    ])
      .then(([drinking, disaster]) => {
        if (cancelled) return;
        setDrinkingSpots(drinking);
        setDisasterSpots(disaster);
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

  return { drinkingSpots, disasterSpots, status };
};
