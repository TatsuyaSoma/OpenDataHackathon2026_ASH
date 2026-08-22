import { Asset } from 'expo-asset';
import { MapSpot, Member, NotificationItem } from '../types';

// 実在の人物の顔写真（肖像権の懸念がある）は避け、いらすとや風のイラスト画像
// （assets/images/members/配下）をモック用の写真として使用する。
// require()したアセットモジュールをexpo-assetでURI文字列に変換し、既存のphotoUrl: string /
// <Image source={{ uri: ... }}>の形に合わせる（react-native-webのImage.resolveAssetSourceは
// 静的メソッドが未実装のため、ネイティブ／Web両対応のexpo-assetを使用する）。
const memberPhotoUri = (asset: number) => Asset.fromModule(asset).uri;

export const mockMembers: Member[] = [
  {
    // この端末を使っている本人（母親）。子供たちの通う小学校の近くにある実家にいる。
    // モックの整合性を保つため、実際の現在地取得は行わず固定位置のまま
    // （気温・湿度はこの位置に対応する気象庁アメダスの実データで自動更新されます）。
    id: 'member-self',
    name: 'お母さん',
    age: 37,
    gender: '女性',
    isSelf: true,
    birthDate: '1989年6月14日',
    homeAddress: '東京都練馬区豊玉北1-1-1',
    photoUrl: memberPhotoUri(require('@/assets/images/members/okaasan.png')),
    location: {
      address: '東京都練馬区豊玉北（実家）',
      latitude: 35.735,
      longitude: 139.652,
    },
    // 実測データ取得前・失敗時も体力ゲージが動作するよう、危険度が高めに出る値を初期値としておく
    // （取得できた場合はアメダスの実測値＋補正で上書きされる）
    environment: { temperature: 33, humidity: 65 },
    riskLevel: 'warning',
    vitality: 100,
    lastUpdated: '—',
    isResting: false,
  },
  {
    id: 'member-1',
    name: 'お父さん',
    age: 41,
    gender: '男性',
    birthDate: '1985年2月3日',
    homeAddress: '東京都千代田区丸の内1-1-1',
    photoUrl: memberPhotoUri(require('@/assets/images/members/otousan.png')),
    // 品川駅近辺のオフィス街（港南）に勤務先があり、平日はそこで過ごしている。
    location: {
      address: '東京都港区港南二丁目（オフィス街）',
      latitude: 35.6258,
      longitude: 139.7386,
    },
    environment: { temperature: 34.6, humidity: 68, wbgt: 31.2, windSpeed: 2.1 },
    riskLevel: 'danger',
    // 直近6時間の危険度推移（カード詳細画面のグラフ用）
    riskHistory: [
      { time: '3:41', riskLevel: 'caution' },
      { time: '4:41', riskLevel: 'warning' },
      { time: '5:41', riskLevel: 'warning' },
      { time: '6:41', riskLevel: 'danger' },
      { time: '7:41', riskLevel: 'danger' },
      { time: '9:41', riskLevel: 'danger' },
    ],
    lastUpdated: '9:41',
    vitality: 100,
    isResting: false,
  },
  {
    id: 'member-2',
    name: 'おじいちゃん',
    age: 66,
    gender: '男性',
    birthDate: '1960年11月8日',
    homeAddress: '東京都調布市布田',
    medicalNotes: '高血圧（降圧剤服用中）',
    photoUrl: memberPhotoUri(require('@/assets/images/members/ojiichan.png')),
    // おばあちゃんと一緒に、調布市内の住宅地にある自宅で暮らしている。
    location: {
      address: '東京都調布市布田（自宅）',
      latitude: 35.6505,
      longitude: 139.5455,
    },
    environment: { temperature: 32.1, humidity: 60, wbgt: 28.4, windSpeed: 1.6 },
    riskLevel: 'warning',
    riskHistory: [
      { time: '3:41', riskLevel: 'safe' },
      { time: '4:41', riskLevel: 'safe' },
      { time: '5:41', riskLevel: 'caution' },
      { time: '6:41', riskLevel: 'caution' },
      { time: '7:41', riskLevel: 'warning' },
      { time: '9:40', riskLevel: 'warning' },
    ],
    lastUpdated: '9:40',
    vitality: 100,
    isResting: false,
  },
  {
    id: 'member-3',
    name: 'お兄ちゃん',
    age: 11,
    gender: '男性',
    birthDate: '2015年9月20日',
    notes: '小学校5年生',
    homeAddress: '東京都練馬区豊玉北1-1-1',
    photoUrl: memberPhotoUri(require('@/assets/images/members/oniichan.png')),
    // 妹と同じ、練馬駅周辺の小学校に通っている。
    location: {
      address: '東京都練馬区練馬（小学校）',
      latitude: 35.7385,
      longitude: 139.6535,
    },
    environment: { temperature: 34.6, humidity: 68, wbgt: 31.2, windSpeed: 2.1 },
    riskLevel: 'danger',
    riskHistory: [
      { time: '3:41', riskLevel: 'caution' },
      { time: '4:41', riskLevel: 'warning' },
      { time: '5:41', riskLevel: 'warning' },
      { time: '6:41', riskLevel: 'danger' },
      { time: '7:41', riskLevel: 'danger' },
      { time: '9:40', riskLevel: 'danger' },
    ],
    lastUpdated: '9:40',
    vitality: 100,
    isResting: false,
  },
  {
    id: 'member-4',
    name: '妹',
    age: 7,
    gender: '女性',
    birthDate: '2019年4月5日',
    notes: '小学校2年生',
    homeAddress: '東京都練馬区豊玉北1-1-1',
    photoUrl: memberPhotoUri(require('@/assets/images/members/imouto.png')),
    // お兄ちゃんと同じ、練馬駅周辺の小学校に通っている。
    location: {
      address: '東京都練馬区練馬（小学校）',
      latitude: 35.7383,
      longitude: 139.6533,
    },
    environment: { temperature: 27.4, humidity: 50, wbgt: 23.9, windSpeed: 3.2 },
    riskLevel: 'safeLight',
    riskHistory: [
      { time: '3:41', riskLevel: 'safeLight' },
      { time: '4:41', riskLevel: 'safeLight' },
      { time: '5:41', riskLevel: 'safeLight' },
      { time: '6:41', riskLevel: 'safeLight' },
      { time: '7:41', riskLevel: 'safeLight' },
      { time: '9:39', riskLevel: 'safeLight' },
    ],
    lastUpdated: '9:39',
    vitality: 100,
    isResting: false,
  },
  {
    id: 'member-5',
    name: 'おばあちゃん',
    age: 63,
    gender: '女性',
    birthDate: '1962年1月30日',
    homeAddress: '東京都調布市布田',
    photoUrl: memberPhotoUri(require('@/assets/images/members/obaachan.png')),
    // おじいちゃんと一緒に、調布市内の住宅地にある自宅で暮らしている。
    location: {
      address: '東京都調布市布田（自宅）',
      latitude: 35.6503,
      longitude: 139.5453,
    },
    environment: { temperature: 32.1, humidity: 60, wbgt: 28.4, windSpeed: 1.6 },
    riskLevel: 'warning',
    riskHistory: [
      { time: '3:41', riskLevel: 'safe' },
      { time: '4:41', riskLevel: 'safe' },
      { time: '5:41', riskLevel: 'caution' },
      { time: '6:41', riskLevel: 'caution' },
      { time: '7:41', riskLevel: 'warning' },
      { time: '9:38', riskLevel: 'warning' },
    ],
    lastUpdated: '9:38',
    vitality: 100,
    isResting: false,
  },
];

// マップ画面用スポットの仮レイアウト（東京駅・日本橋・京橋・銀座付近に手配置したもの、緯度経度で直接指定）。
// コンビニ・自販機・カフェは起動時にOpenStreetMap(Overpass API)、給水スポット・災害時給水は
// 東京都水道局のオープンデータの実データへ差し替わるが、取得中・失敗時のフォールバックとしてもこの配列を使う。
export const mockMapSpots: MapSpot[] = [
  { id: 'spot-1', type: 'convenience', name: 'コンビニ（東京駅八重洲口）', latitude: 35.6798, longitude: 139.7693 },
  { id: 'spot-2', type: 'convenience', name: 'コンビニ（日本橋室町）', latitude: 35.6858, longitude: 139.7735 },
  { id: 'spot-3', type: 'vending', name: '自販機（丸の内仲通り）', latitude: 35.682, longitude: 139.766 },
  { id: 'spot-4', type: 'vending', name: '自販機（京橋）', latitude: 35.6772, longitude: 139.7735 },
  { id: 'spot-5', type: 'water', name: '給水スポット（東京駅前）', latitude: 35.6815, longitude: 139.7675 },
  { id: 'spot-6', type: 'water', name: '給水スポット（日本橋）', latitude: 35.684, longitude: 139.7748 },
  { id: 'spot-9', type: 'disasterWater', name: '災害時給水ステーション（区立堀留児童公園）', latitude: 35.6871, longitude: 139.7792 },
  { id: 'spot-7', type: 'cafe', name: 'カフェ（丸の内）', latitude: 35.6825, longitude: 139.7685 },
  { id: 'spot-8', type: 'cafe', name: 'カフェ（銀座一丁目）', latitude: 35.6722, longitude: 139.766 },
];

// 通知履歴のモックデータ
export const mockNotifications: NotificationItem[] = [
  {
    id: 'notif-1',
    memberId: 'member-1',
    riskLevel: 'danger',
    changed: true,
    location: '東京都港区港南二丁目',
    time: '9:41',
    dateLabel: '今日',
    isRead: false,
  },
  {
    id: 'notif-2',
    memberId: 'member-2',
    riskLevel: 'warning',
    changed: true,
    location: '福島県福島市渡利',
    time: '8:15',
    dateLabel: '今日',
    isRead: false,
  },
  {
    id: 'notif-3',
    memberId: 'member-3',
    riskLevel: 'safe',
    changed: false,
    location: '神奈川県横浜市港北区日吉本町',
    time: '7:50',
    dateLabel: '今日',
    isRead: true,
  },
  {
    id: 'notif-4',
    memberId: 'member-4',
    riskLevel: 'safeLight',
    changed: false,
    location: '神奈川県横浜市港北区日吉本町',
    time: '7:20',
    dateLabel: '今日',
    isRead: true,
  },
  {
    id: 'notif-5',
    memberId: 'member-1',
    riskLevel: 'warning',
    changed: true,
    location: '東京都港区港南二丁目',
    time: '18:30',
    dateLabel: '昨日',
    isRead: true,
  },
  {
    id: 'notif-6',
    memberId: 'member-4',
    riskLevel: 'safeLight',
    changed: false,
    location: '神奈川県横浜市港北区日吉本町',
    time: '18:00',
    dateLabel: '昨日',
    isRead: true,
  },
];
