import { useEffect, useState } from 'react';
import { fetchNearestTokyoWbgt, NearestTokyoWbgt } from '../services/envWbgt';

export type NearestWbgtStatus = 'loading' | 'success' | 'error';

// APIへの過剰な連打を避けるため、アプリ起動中は結果をキャッシュして使い回す
// （1時間おきの更新データのため、頻繁な再取得は不要）
let cache: Promise<NearestTokyoWbgt | null> | null = null;

/**
 * 地図の表示範囲中心に最も近い、環境省WBGT実況値配信地点の直近値を取得するフック。
 */
export const useNearestWbgt = (targetLat: number, targetLng: number) => {
  const [status, setStatus] = useState<NearestWbgtStatus>('loading');
  const [data, setData] = useState<NearestTokyoWbgt | null>(null);

  useEffect(() => {
    let cancelled = false;
    setStatus('loading');

    if (!cache) {
      // 取得に失敗した場合は次回マウント時に再試行できるよう、キャッシュを空にしておく
      // （失敗したPromiseをキャッシュし続けると、以降ずっとエラー状態のままになってしまうため）
      cache = fetchNearestTokyoWbgt(targetLat, targetLng).catch((error) => {
        cache = null;
        throw error;
      });
    }

    cache
      .then((result) => {
        if (cancelled) return;
        setData(result);
        setStatus('success');
      })
      .catch(() => {
        if (cancelled) return;
        setStatus('error');
      });

    return () => {
      cancelled = true;
    };
  }, [targetLat, targetLng]);

  return { data, status };
};
