import { useEffect, useState } from 'react';
import { CoolingFeature, fetchCoolingFeatures } from '../services/tokyoLandCover';

export type TokyoLandCoverStatus = 'loading' | 'success' | 'error';

// 河川・公園の位置は季節や時間帯で変わらない静的データのため、WBGT実況値と違って
// 定期的な再取得は不要。アプリ起動中は一度取得した結果を使い回す。
let cache: Promise<CoolingFeature[]> | null = null;

const getFeatures = (): Promise<CoolingFeature[]> => {
  if (!cache) {
    cache = fetchCoolingFeatures().catch((error) => {
      cache = null;
      throw error;
    });
  }
  return cache;
};

/**
 * ヒートマップに「水辺・緑地に近いほど涼しい」補正をかけるための実データ
 * （河川監視カメラの位置、港区の公園位置）を取得するフック。
 * 取得中・失敗時は呼び出し側（`MapWbgtTileLayer`）が補正なしの従来表示にフォールバックする想定。
 */
export const useTokyoLandCover = () => {
  const [status, setStatus] = useState<TokyoLandCoverStatus>('loading');
  const [features, setFeatures] = useState<CoolingFeature[]>([]);

  useEffect(() => {
    let cancelled = false;

    getFeatures()
      .then((result) => {
        if (cancelled) return;
        setFeatures(result);
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

  return { features, status };
};
