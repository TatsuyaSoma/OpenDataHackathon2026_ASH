import { parseCsv } from '../utils/csv';

// 河川監視カメラ位置情報データ（東京都建設局、東京都オープンデータカタログサイト経由、CC BY 4.0）。
// APIキー不要・UTF-8（BOM付き）エンコードのCSV。都内の主要河川沿いに設置されたカメラの位置情報を、
// ヒートマップ補正における「河川の位置」の実データとして使う。
// 参考: https://catalog.data.metro.tokyo.lg.jp/dataset/t000014d0000000028
const RIVER_CAMERA_CSV_URL =
  'https://www.opendata.metro.tokyo.lg.jp/kensetsu/R4/130001_river-monitoring-cameras.csv';

// 港区「公共施設情報（公園・児童遊園・緑地）」GeoJSON（港区、東京都オープンデータカタログサイト経由）。
// 都内の公園位置は区ごとにオープンデータの整備状況が異なり、緯度経度つきで配信しているのは
// 港区・品川区など一部区に限られる（多くの区は住所のみで座標が空欄のため、地図補正には使えない）。
// 参考: https://catalog.data.metro.tokyo.lg.jp/dataset/t131032d0000000014
const MINATO_PARKS_GEOJSON_URL =
  'https://opendata.city.minato.tokyo.jp/dataset/dc609dcf-892a-4a20-8f74-f62ce9fc806d/resource/00cc9ff3-ae2a-4df8-b581-fe452335fa52/download/minatokushisetsujoho_kouen.json';

// 練馬区「公園トイレ一覧」CSV（練馬区、東京都オープンデータカタログサイト経由）。
// 練馬区自体の「都市公園・都立公園一覧」は住所のみで座標が空欄のため使えないが、
// 公園に設置されたトイレの位置情報（バリアフリー対応状況等のためのデータ）には
// 緯度経度が入っており、公園の位置の実データとして流用できる。
// 参考: https://catalog.data.metro.tokyo.lg.jp/dataset/t131202d0000000132
const NERIMA_PARK_TOILETS_CSV_URL =
  'https://www.city.nerima.tokyo.jp/kusei/tokei/opendata/opendatasite/matidukuri/public_toilet.files/131202_public_toilet.csv';

// 調布市「公衆トイレ一覧」CSV（調布市、東京都オープンデータカタログサイト経由）。
// 駅前等の一般トイレと公園内トイレが混在しているため、名称に「公園」「緑地」等を含むものだけを
// 公園・緑地の位置として使う。
// 参考: https://catalog.data.metro.tokyo.lg.jp/dataset/t132080d3100001967
const CHOFU_PUBLIC_TOILETS_CSV_URL = 'https://www.city.chofu.lg.jp/documents/13850/132080_public_toilet.csv';

// 練馬区・調布市のトイレ一覧CSVで共通の列位置（全国共通の「公共施設等データ整備の手引き」準拠）
const FACILITY_NAME_COLUMN = 3;
const FACILITY_LAT_COLUMN = 15;
const FACILITY_LNG_COLUMN = 16;
const GREEN_SPACE_NAME_PATTERN = /公園|緑地|児童遊園|遊び場|緑道|庭園/;

export type CoolingFeatureKind = 'water' | 'green';

// ヒートマップの色分けを補正する際の基準になる「涼しさの根拠地点」1件分。
export interface CoolingFeature {
  kind: CoolingFeatureKind;
  name: string;
  latitude: number;
  longitude: number;
}

// 都立公園・大規模河川は、区市が公開するオープンデータ（座標つき）の対象外のため、
// 位置が変わらない著名なランドマークに限り、座標を直接指定する（`envWbgt.ts`の
// TOKYO_WBGT_POINTSと同様の扱い）。座標はOpenStreetMap（Nominatim）で確認済み。
const KNOWN_LANDMARK_FEATURES: CoolingFeature[] = [
  { kind: 'green', name: '光が丘公園', latitude: 35.7663, longitude: 139.6297 },
  { kind: 'green', name: '石神井公園', latitude: 35.7382, longitude: 139.5962 },
  { kind: 'water', name: '石神井川（富士見台）', latitude: 35.7452, longitude: 139.6208 },
];

const fetchRiverCoolingFeatures = async (): Promise<CoolingFeature[]> => {
  const response = await fetch(RIVER_CAMERA_CSV_URL);
  if (!response.ok) {
    throw new Error(`河川位置データの取得に失敗しました（${response.status}）`);
  }
  const text = await response.text();
  // CSV列: 番号,観測所名（映像監視局）,河川名,URL（動画）,緯度,経度
  const rows = parseCsv(text).slice(1); // ヘッダ行を除く

  return rows
    .map((row): CoolingFeature | null => {
      const latitude = Number(row[4]);
      const longitude = Number(row[5]);
      if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
      return { kind: 'water', name: row[2] || '河川', latitude, longitude };
    })
    .filter((feature): feature is CoolingFeature => feature !== null);
};

interface MinatoParkFeature {
  geometry?: { coordinates?: [string, string, number] };
  properties?: { タイトル?: string };
}

const fetchMinatoGreenFeatures = async (): Promise<CoolingFeature[]> => {
  const response = await fetch(MINATO_PARKS_GEOJSON_URL);
  if (!response.ok) {
    throw new Error(`公園位置データの取得に失敗しました（${response.status}）`);
  }
  const body: { features?: MinatoParkFeature[] } = await response.json();

  return (body.features ?? [])
    .map((feature): CoolingFeature | null => {
      const [lngStr, latStr] = feature.geometry?.coordinates ?? [];
      const latitude = Number(latStr);
      const longitude = Number(lngStr);
      if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
      return { kind: 'green', name: feature.properties?.タイトル || '公園', latitude, longitude };
    })
    .filter((feature): feature is CoolingFeature => feature !== null);
};

// トイレ一覧CSV（練馬区・調布市）から公園・緑地の位置を抽出する共通処理。
// nameFilterがtrueの場合、名称に公園・緑地系のキーワードを含む行だけを採用する
// （調布市の一覧は駅前トイレ等、公園以外の設置場所も混在しているため）。
const fetchGreenFeaturesFromToiletCsv = async (
  url: string,
  { nameFilter = false }: { nameFilter?: boolean } = {}
): Promise<CoolingFeature[]> => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`公園位置データの取得に失敗しました（${response.status}）`);
  }
  const text = await response.text();
  const rows = parseCsv(text).slice(1); // ヘッダ行を除く

  return rows
    .map((row): CoolingFeature | null => {
      const name = row[FACILITY_NAME_COLUMN] ?? '';
      if (nameFilter && !GREEN_SPACE_NAME_PATTERN.test(name)) return null;
      const latitude = Number(row[FACILITY_LAT_COLUMN]);
      const longitude = Number(row[FACILITY_LNG_COLUMN]);
      if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
      return { kind: 'green', name: name || '公園', latitude, longitude };
    })
    .filter((feature): feature is CoolingFeature => feature !== null);
};

const fetchNerimaGreenFeatures = () => fetchGreenFeaturesFromToiletCsv(NERIMA_PARK_TOILETS_CSV_URL);
const fetchChofuGreenFeatures = () =>
  fetchGreenFeaturesFromToiletCsv(CHOFU_PUBLIC_TOILETS_CSV_URL, { nameFilter: true });

/**
 * ヒートマップの色分けを補正するための実データ（河川・公園緑地の位置）を取得する。
 * 「水辺・緑地に近いほど涼しい」という補正の根拠地点として`MapWbgtTileLayer`が使う。
 * いずれかの取得に失敗しても、残りのデータだけで補正を続けられるよう個別にcatchする
 * （Web版はCORSの都合でどれも取得に失敗しうるが、その場合は補正なし＝従来表示にフォールバックする）。
 */
export const fetchCoolingFeatures = async (): Promise<CoolingFeature[]> => {
  const sources: [string, () => Promise<CoolingFeature[]>][] = [
    ['河川監視カメラ', fetchRiverCoolingFeatures],
    ['港区公園', fetchMinatoGreenFeatures],
    ['練馬区公園', fetchNerimaGreenFeatures],
    ['調布市公園', fetchChofuGreenFeatures],
  ];

  const results = await Promise.all(
    sources.map(([label, fetcher]) =>
      fetcher().catch((error) => {
        console.warn(`ヒートマップ補正用の${label}データの取得に失敗しました:`, error);
        return [];
      })
    )
  );
  return [...results.flat(), ...KNOWN_LANDMARK_FEATURES];
};
