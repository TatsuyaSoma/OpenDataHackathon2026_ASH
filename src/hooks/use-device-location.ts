import { useCallback, useEffect, useState } from 'react';
import * as Location from 'expo-location';

export type DeviceLocationStatus = 'requesting' | 'granted' | 'denied' | 'error';

export interface DeviceLocationResult {
  status: DeviceLocationStatus;
  latitude?: number;
  longitude?: number;
  address?: string;
  errorMessage?: string;
}

const formatAddress = (geocoded: Location.LocationGeocodedAddress | undefined): string | undefined => {
  if (!geocoded) return undefined;
  // AndroidはformattedAddressで整形済みの住所が取れるが、iOSは各要素を手動で組み立てる必要がある
  if (geocoded.formattedAddress) return geocoded.formattedAddress;
  const parts = [geocoded.region, geocoded.city, geocoded.district, geocoded.street].filter(Boolean);
  return parts.length > 0 ? parts.join('') : undefined;
};

// expo-locationのreverseGeocodeAsyncはWebで未対応のため、その場合はOpenStreetMapの
// 無料の逆ジオコーディングAPI（Nominatim）にフォールバックする。
// 利用ポリシー上、検索結果を表示する際は出典（OpenStreetMapへの帰属表示）が必要（https://osmfoundation.org/wiki/Licence/Attribution_Guidelines）。
const NOMINATIM_REVERSE_GEOCODE_URL = 'https://nominatim.openstreetmap.org/reverse';

const reverseGeocodeViaNominatim = async (
  latitude: number,
  longitude: number
): Promise<string | undefined> => {
  try {
    const params = new URLSearchParams({
      format: 'jsonv2',
      lat: String(latitude),
      lon: String(longitude),
      zoom: '18',
      'accept-language': 'ja',
    });
    const response = await fetch(`${NOMINATIM_REVERSE_GEOCODE_URL}?${params.toString()}`);
    if (!response.ok) return undefined;
    const data: { display_name?: string } = await response.json();
    return typeof data.display_name === 'string' ? data.display_name : undefined;
  } catch {
    return undefined;
  }
};

/**
 * この端末の現在地をexpo-locationで取得するフック。
 * 起動時に権限を要求し、許可された場合のみ現在地の緯度経度と住所（逆ジオコーディング）を返す。
 * refresh()で再取得できる。
 */
export const useDeviceLocation = () => {
  const [result, setResult] = useState<DeviceLocationResult>({ status: 'requesting' });

  const fetchLocation = useCallback(async () => {
    setResult((prev) => ({ ...prev, status: 'requesting', errorMessage: undefined }));
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (!permission.granted) {
        setResult({ status: 'denied' });
        return;
      }

      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const { latitude, longitude } = position.coords;

      let address: string | undefined;
      try {
        const [geocoded] = await Location.reverseGeocodeAsync({ latitude, longitude });
        address = formatAddress(geocoded);
      } catch {
        address = undefined;
      }
      if (!address) {
        address = await reverseGeocodeViaNominatim(latitude, longitude);
      }
      // それでも取得できない場合（オフライン等）の最終フォールバック
      address ??= `緯度${latitude.toFixed(4)}, 経度${longitude.toFixed(4)}`;

      setResult({ status: 'granted', latitude, longitude, address });
    } catch (error) {
      setResult({
        status: 'error',
        errorMessage: error instanceof Error ? error.message : '現在地の取得に失敗しました。',
      });
    }
  }, []);

  useEffect(() => {
    fetchLocation();
  }, [fetchLocation]);

  return { ...result, refresh: fetchLocation };
};
