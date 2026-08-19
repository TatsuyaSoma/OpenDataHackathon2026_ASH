import { useEffect, useState } from 'react';
import { fetchNearestTokyoWbgt, NearestTokyoWbgt } from '../services/envWbgt';

export type NearestWbgtStatus = 'loading' | 'success' | 'error';

// 環境省WBGT実況値は1時間おきに更新される。この間隔でキャッシュを破棄して再取得することで、
// APIへの過剰な連打を避けつつ、地図を開いたままにしていても実況値が古いまま固定されないようにする。
const CACHE_TTL_MS = 10 * 60 * 1000;
const REFRESH_INTERVAL_MS = 10 * 60 * 1000;

let cache: Promise<NearestTokyoWbgt | null> | null = null;
let cachedAt = 0;
let cachedLat: number | null = null;
let cachedLng: number | null = null;

const getNearest = (targetLat: number, targetLng: number): Promise<NearestTokyoWbgt | null> => {
  const isStale =
    !cache || Date.now() - cachedAt > CACHE_TTL_MS || cachedLat !== targetLat || cachedLng !== targetLng;
  if (isStale) {
    cachedAt = Date.now();
    cachedLat = targetLat;
    cachedLng = targetLng;
    // 取得に失敗した場合は次回の再試行で拾えるよう、キャッシュを空にしておく
    cache = fetchNearestTokyoWbgt(targetLat, targetLng).catch((error) => {
      cache = null;
      throw error;
    });
  }
  return cache!;
};

/**
 * 地図の表示範囲中心に最も近い、環境省WBGT実況値配信地点の直近値を取得するフック。
 * マウント中は`REFRESH_INTERVAL_MS`おきに自動で再取得し、実況値の更新に追従する。
 */
export const useNearestWbgt = (targetLat: number, targetLng: number) => {
  const [status, setStatus] = useState<NearestWbgtStatus>('loading');
  const [data, setData] = useState<NearestTokyoWbgt | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = () => {
      getNearest(targetLat, targetLng)
        .then((result) => {
          if (cancelled) return;
          setData(result);
          setStatus('success');
        })
        .catch(() => {
          if (cancelled) return;
          setStatus('error');
        });
    };

    load();
    const intervalId = setInterval(load, REFRESH_INTERVAL_MS);

    return () => {
      cancelled = true;
      clearInterval(intervalId);
    };
  }, [targetLat, targetLng]);

  return { data, status };
};
