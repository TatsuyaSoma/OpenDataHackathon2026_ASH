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
