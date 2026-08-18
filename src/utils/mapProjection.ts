// マップ表示範囲の緯度経度境界。背景に敷いているモック画像
// （assets/images/map/tokyo-marunouchi-mock.png、東京駅〜日本橋〜京橋〜銀座付近のスクリーンショット）の
// 表示範囲に合わせたおおよその値（ランドマークの位置から逆算した概算であり、厳密な測量値ではない）。
export const MAP_BOUNDS = { latMin: 35.67, latMax: 35.691, lngMin: 139.758, lngMax: 139.789 };

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

// 緯度経度を0〜1の正規化座標（マップ表示エリア内の位置）に変換する
export const projectToMap = (latitude: number, longitude: number) => ({
  x: clamp01((longitude - MAP_BOUNDS.lngMin) / (MAP_BOUNDS.lngMax - MAP_BOUNDS.lngMin)),
  y: clamp01(1 - (latitude - MAP_BOUNDS.latMin) / (MAP_BOUNDS.latMax - MAP_BOUNDS.latMin)),
});

// 0〜1の正規化座標から緯度経度を逆算する（モックデータの座標指定に使用）
export const unprojectFromMap = (x: number, y: number) => ({
  latitude: MAP_BOUNDS.latMin + (1 - y) * (MAP_BOUNDS.latMax - MAP_BOUNDS.latMin),
  longitude: MAP_BOUNDS.lngMin + x * (MAP_BOUNDS.lngMax - MAP_BOUNDS.lngMin),
});

// expo-mapsのGoogleMaps.View/AppleMaps.Viewが返す現在の表示範囲（中心座標＋緯度経度スパン）
export interface MapRegion {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
}

// 緯度経度を、現在の表示範囲(region)内での0〜1正規化座標に変換する。
// projectToMapと異なり0〜1にクランプしない（表示範囲外＝負の値や1超の値になり、
// ネイティブ地図画面での「画面外インジケーター」表示の判定に使う）。
// 実際の地図SDK（Google Maps/Apple Maps）は正確にはWebメルカトル図法だが、
// このアプリが対象とする都心の数km四方という狭い範囲では線形補間の誤差は無視できるため、
// 既存のモック地図と同じ線形補間方式を採用し、実装をシンプルに保っている。
export const projectToRegion = (latitude: number, longitude: number, region: MapRegion) => {
  const latMin = region.latitude - region.latitudeDelta / 2;
  const latMax = region.latitude + region.latitudeDelta / 2;
  const lngMin = region.longitude - region.longitudeDelta / 2;
  const lngMax = region.longitude + region.longitudeDelta / 2;
  return {
    x: (longitude - lngMin) / (lngMax - lngMin),
    y: 1 - (latitude - latMin) / (latMax - latMin),
  };
};
