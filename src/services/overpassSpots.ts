import { MapSpot } from '../types';

// OpenStreetMapの公開Overpass API（APIキー不要・CORS許可あり）から、
// 指定範囲内のコンビニ・自販機・カフェの位置データを取得する。
// 利用ポリシー上、頻繁な連打は避ける想定（呼び出し側でキャッシュすること）。
// 参考: https://wiki.openstreetmap.org/wiki/Overpass_API
const OVERPASS_ENDPOINT = 'https://overpass-api.de/api/interpreter';

interface OverpassBounds {
  latMin: number;
  latMax: number;
  lngMin: number;
  lngMax: number;
}

interface OverpassElement {
  id: number;
  lat: number;
  lon: number;
  tags?: {
    shop?: string;
    amenity?: string;
    name?: string;
    brand?: string;
  };
}

interface OverpassResponse {
  elements: OverpassElement[];
}

const buildQuery = ({ latMin, lngMin, latMax, lngMax }: OverpassBounds) => `
[out:json][timeout:25];
(
  node["shop"="convenience"](${latMin},${lngMin},${latMax},${lngMax});
  node["amenity"="vending_machine"](${latMin},${lngMin},${latMax},${lngMax});
  node["amenity"="cafe"](${latMin},${lngMin},${latMax},${lngMax});
);
out;
`;

// 都心部はコンビニ・自販機・カフェの密度が非常に高く、全件描画すると地図が埋め尽くされ描画も重くなるため、
// 種別ごとに件数の上限を設ける
const MAX_SPOTS_PER_TYPE = 40;

/**
 * 指定範囲内のコンビニ・自販機・カフェをOverpass APIから取得し、MapSpot形式に変換する。
 */
export const fetchOsmSpots = async (bounds: OverpassBounds): Promise<MapSpot[]> => {
  const response = await fetch(OVERPASS_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `data=${encodeURIComponent(buildQuery(bounds))}`,
  });

  if (!response.ok) {
    throw new Error(`周辺スポットの取得に失敗しました（${response.status}）`);
  }

  const data: OverpassResponse = await response.json();

  const spots = data.elements
    .map((element): MapSpot | null => {
      const isConvenience = element.tags?.shop === 'convenience';
      const isVending = element.tags?.amenity === 'vending_machine';
      const isCafe = element.tags?.amenity === 'cafe';
      if (!isConvenience && !isVending && !isCafe) return null;

      const type = isConvenience ? 'convenience' : isVending ? 'vending' : 'cafe';
      const fallbackName = isConvenience ? 'コンビニ' : isVending ? '自販機' : 'カフェ';

      return {
        id: `osm-${element.id}`,
        type,
        name: element.tags?.name ?? element.tags?.brand ?? fallbackName,
        latitude: element.lat,
        longitude: element.lon,
      };
    })
    .filter((spot): spot is MapSpot => spot !== null);

  const convenience = spots.filter((s) => s.type === 'convenience').slice(0, MAX_SPOTS_PER_TYPE);
  const vending = spots.filter((s) => s.type === 'vending').slice(0, MAX_SPOTS_PER_TYPE);
  const cafe = spots.filter((s) => s.type === 'cafe').slice(0, MAX_SPOTS_PER_TYPE);
  return [...convenience, ...vending, ...cafe];
};
