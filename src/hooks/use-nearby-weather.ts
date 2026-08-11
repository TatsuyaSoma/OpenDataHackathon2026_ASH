import { useEffect, useState } from 'react';
import { fetchNearestWeather, NearestWeatherResult } from '../services/amedasWeather';

export type NearbyWeatherStatus = 'idle' | 'loading' | 'success' | 'error';

interface NearbyWeatherResult {
  status: NearbyWeatherStatus;
  weather?: NearestWeatherResult;
}

/**
 * 指定した緯度経度に最も近いアメダス観測地点の気温・湿度を取得するフック。
 * latitude/longitudeがundefinedの間は取得しない。
 */
export const useNearbyWeather = (latitude?: number, longitude?: number): NearbyWeatherResult => {
  const [status, setStatus] = useState<NearbyWeatherStatus>('idle');
  const [weather, setWeather] = useState<NearestWeatherResult | undefined>(undefined);

  useEffect(() => {
    if (latitude === undefined || longitude === undefined) return;

    let cancelled = false;
    setStatus('loading');

    fetchNearestWeather(latitude, longitude)
      .then((result) => {
        if (cancelled) return;
        if (result) {
          setWeather(result);
          setStatus('success');
        } else {
          setStatus('error');
        }
      })
      .catch(() => {
        if (cancelled) return;
        setStatus('error');
      });

    return () => {
      cancelled = true;
    };
  }, [latitude, longitude]);

  return { status, weather };
};
