import { useEffect, useState } from 'react';
import { fetchAllTokyoWbgt, TokyoWbgtReading } from '../services/envWbgt';

export type TokyoWbgtGridStatus = 'loading' | 'success' | 'error';

// APIへの過剰な連打を避けるため、アプリ起動中は結果をキャッシュして使い回す
let cache: Promise<TokyoWbgtReading[]> | null = null;

/**
 * 都内の全WBGT実況値配信地点の直近値（位置情報つき）を取得するフック。
 * マップの広域ヒートマップ表示（`MapWbgtTileLayer`）の逆距離加重補間に使う。
 */
export const useTokyoWbgtGrid = () => {
  const [status, setStatus] = useState<TokyoWbgtGridStatus>('loading');
  const [readings, setReadings] = useState<TokyoWbgtReading[]>([]);

  useEffect(() => {
    let cancelled = false;
    setStatus('loading');

    if (!cache) {
      // 取得に失敗した場合は次回マウント時に再試行できるよう、キャッシュを空にしておく
      cache = fetchAllTokyoWbgt().catch((error) => {
        cache = null;
        throw error;
      });
    }

    cache
      .then((result) => {
        if (cancelled) return;
        setReadings(result);
        setStatus('success');
      })
      .catch(() => {
        if (cancelled) return;
        setStatus('error');
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return { readings, status };
};
