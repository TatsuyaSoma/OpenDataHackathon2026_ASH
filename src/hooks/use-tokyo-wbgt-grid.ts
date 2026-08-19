import { useEffect, useState } from 'react';
import { fetchAllTokyoWbgt, TokyoWbgtReading } from '../services/envWbgt';

export type TokyoWbgtGridStatus = 'loading' | 'success' | 'error';

// 環境省WBGT実況値は1時間おきに更新される。この間隔でキャッシュを破棄して再取得することで、
// APIへの過剰な連打を避けつつ、地図を開いたままにしていても実況値が古いまま固定されないようにする。
const CACHE_TTL_MS = 10 * 60 * 1000;
const REFRESH_INTERVAL_MS = 10 * 60 * 1000;

let cache: Promise<TokyoWbgtReading[]> | null = null;
let cachedAt = 0;

const getReadings = (): Promise<TokyoWbgtReading[]> => {
  const isStale = !cache || Date.now() - cachedAt > CACHE_TTL_MS;
  if (isStale) {
    cachedAt = Date.now();
    // 取得に失敗した場合は次回の再試行で拾えるよう、キャッシュを空にしておく
    cache = fetchAllTokyoWbgt().catch((error) => {
      cache = null;
      throw error;
    });
  }
  return cache!;
};

/**
 * 都内の全WBGT実況値配信地点の直近値（位置情報つき）を取得するフック。
 * マップの広域ヒートマップ表示（`MapWbgtTileLayer`）の逆距離加重補間に使う。
 * マウント中は`REFRESH_INTERVAL_MS`おきに自動で再取得し、実況値の更新に追従する。
 */
export const useTokyoWbgtGrid = () => {
  const [status, setStatus] = useState<TokyoWbgtGridStatus>('loading');
  const [readings, setReadings] = useState<TokyoWbgtReading[]>([]);

  useEffect(() => {
    let cancelled = false;

    const load = () => {
      getReadings()
        .then((result) => {
          if (cancelled) return;
          setReadings(result);
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
  }, []);

  return { readings, status };
};
