import { Asset } from 'expo-asset';
import { MapSpot, Member, NotificationItem } from '../types';
import { unprojectFromMap } from '../utils/mapProjection';

// 実在の人物の顔写真（肖像権の懸念がある）は避け、いらすとや風のイラスト画像
// （assets/images/members/配下）をモック用の写真として使用する。
// require()したアセットモジュールをexpo-assetでURI文字列に変換し、既存のphotoUrl: string /
// <Image source={{ uri: ... }}>の形に合わせる（react-native-webのImage.resolveAssetSourceは
// 静的メソッドが未実装のため、ネイティブ／Web両対応のexpo-assetを使用する）。
const memberPhotoUri = (asset: number) => Asset.fromModule(asset).uri;

export const mockMembers: Member[] = [
  {
    // この端末を使っている本人（母親）。locationはアプリ起動時にexpo-locationで取得した
    // 実際の現在地に自動更新されます（許可されるまでは仮の値）。
    id: 'member-self',
    name: 'お母さん',
    age: 37,
    gender: '女性',
    isSelf: true,
    birthDate: '1989年6月14日',
    homeAddress: '東京都千代田区丸の内1-1-1',
    photoUrl: memberPhotoUri(require('@/assets/images/members/okaasan.png')),
    location: {
      address: '位置情報を取得中…',
      latitude: 35.681236,
      longitude: 139.767125,
    },
    environment: { temperature: 0, humidity: 0 },
    riskLevel: 'safeLight',
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
    location: {
      address: '東京都千代田区丸の内1丁目',
      latitude: 35.6812,
      longitude: 139.7671,
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
      { time: '9:41', riskLevel: 'severe' },
    ],
    lastUpdated: '9:41',
    // 実際の環境は「危険」レベルだが、本人は冷房の効いたオフィスで休んでいる想定
    isResting: true,
    restStartedAt: '9:15',
  },
  {
    id: 'member-2',
    name: 'おじいちゃん',
    age: 66,
    gender: '男性',
    birthDate: '1960年11月8日',
    homeAddress: '東京都千代田区丸の内1-1-1',
    medicalNotes: '高血圧（降圧剤服用中）',
    photoUrl: memberPhotoUri(require('@/assets/images/members/ojiichan.png')),
    location: {
      address: '東京都新宿区西新宿',
      latitude: 35.6896,
      longitude: 139.6917,
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
    isResting: false,
  },
  {
    id: 'member-3',
    name: 'お兄ちゃん',
    age: 11,
    gender: '男性',
    birthDate: '2015年9月20日',
    notes: '小学校5年生',
    homeAddress: '東京都千代田区丸の内1-1-1',
    photoUrl: memberPhotoUri(require('@/assets/images/members/oniichan.png')),
    location: {
      address: '東京都渋谷区渋谷',
      latitude: 35.658,
      longitude: 139.7016,
    },
    environment: { temperature: 29.8, humidity: 55, wbgt: 26.1, windSpeed: 2.8 },
    riskLevel: 'safe',
    riskHistory: [
      { time: '3:41', riskLevel: 'safeLight' },
      { time: '4:41', riskLevel: 'safeLight' },
      { time: '5:41', riskLevel: 'safe' },
      { time: '6:41', riskLevel: 'safe' },
      { time: '7:41', riskLevel: 'safe' },
      { time: '9:40', riskLevel: 'safe' },
    ],
    lastUpdated: '9:40',
    isResting: false,
  },
  {
    id: 'member-4',
    name: '妹',
    age: 7,
    gender: '女性',
    birthDate: '2019年4月5日',
    notes: '小学校2年生',
    homeAddress: '東京都千代田区丸の内1-1-1',
    photoUrl: memberPhotoUri(require('@/assets/images/members/imouto.png')),
    location: {
      address: '東京都目黒区中目黒',
      latitude: 35.6443,
      longitude: 139.6994,
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
    isResting: false,
  },
  {
    id: 'member-5',
    name: 'おばあちゃん',
    age: 63,
    gender: '女性',
    birthDate: '1962年1月30日',
    homeAddress: '東京都千代田区丸の内1-1-1',
    photoUrl: memberPhotoUri(require('@/assets/images/members/obaachan.png')),
    location: {
      address: '東京都港区六本木',
      latitude: 35.6627,
      longitude: 139.7314,
    },
    environment: { temperature: 28.5, humidity: 58, wbgt: 25.2, windSpeed: 2.3 },
    riskLevel: 'caution',
    riskHistory: [
      { time: '3:41', riskLevel: 'safe' },
      { time: '4:41', riskLevel: 'safe' },
      { time: '5:41', riskLevel: 'caution' },
      { time: '6:41', riskLevel: 'caution' },
      { time: '7:41', riskLevel: 'caution' },
      { time: '9:38', riskLevel: 'caution' },
    ],
    lastUpdated: '9:38',
    isResting: false,
  },
];

// マップ画面用スポットの仮レイアウト（0〜1の正規化座標で見た目のバランスを取って手配置したもの）。
// 緯度経度に変換してMapSpot化する。コンビニ・自販機は起動時にOpenStreetMap(Overpass API)の実データへ
// 差し替わるが、取得中・失敗時のフォールバックとしてもこの配列を使う。給水スポット・カフェは引き続きこのモックのみ。
const MOCK_SPOT_LAYOUT: { id: string; type: MapSpot['type']; name: string; x: number; y: number }[] = [
  { id: 'spot-1', type: 'convenience', name: 'コンビニ（新宿北口）', x: 0.28, y: 0.24 },
  { id: 'spot-2', type: 'convenience', name: 'コンビニ（飯田橋）', x: 0.33, y: 0.16 },
  { id: 'spot-3', type: 'convenience', name: 'コンビニ（丸の内）', x: 0.62, y: 0.36 },
  { id: 'spot-4', type: 'convenience', name: 'コンビニ（渋谷）', x: 0.14, y: 0.58 },
  { id: 'spot-5', type: 'convenience', name: 'コンビニ（品川）', x: 0.9, y: 0.62 },
  { id: 'spot-6', type: 'vending', name: '自販機（新宿東口）', x: 0.41, y: 0.19 },
  { id: 'spot-7', type: 'vending', name: '自販機（飯田橋駅前）', x: 0.87, y: 0.14 },
  { id: 'spot-8', type: 'vending', name: '自販機（丸の内）', x: 0.38, y: 0.42 },
  { id: 'spot-9', type: 'vending', name: '自販機（品川）', x: 0.66, y: 0.85 },
  { id: 'spot-10', type: 'water', name: '給水スポット（飯田橋）', x: 0.66, y: 0.15 },
  { id: 'spot-11', type: 'water', name: '給水スポット（新宿）', x: 0.2, y: 0.36 },
  { id: 'spot-12', type: 'water', name: '給水スポット（丸の内）', x: 0.62, y: 0.51 },
  { id: 'spot-13', type: 'water', name: '給水スポット（品川）', x: 0.29, y: 0.82 },
  { id: 'spot-14', type: 'cafe', name: 'カフェ（新宿）', x: 0.29, y: 0.47 },
  { id: 'spot-15', type: 'cafe', name: 'カフェ（飯田橋）', x: 0.89, y: 0.31 },
];

export const mockMapSpots: MapSpot[] = MOCK_SPOT_LAYOUT.map(({ x, y, ...spot }) => ({
  ...spot,
  ...unprojectFromMap(x, y),
}));

// 通知履歴のモックデータ
export const mockNotifications: NotificationItem[] = [
  {
    id: 'notif-1',
    memberId: 'member-1',
    riskLevel: 'danger',
    changed: true,
    location: '東京都千代田区丸の内1丁目',
    time: '9:41',
    dateLabel: '今日',
    isRead: false,
  },
  {
    id: 'notif-2',
    memberId: 'member-2',
    riskLevel: 'warning',
    changed: true,
    location: '東京都新宿区西新宿',
    time: '8:15',
    dateLabel: '今日',
    isRead: false,
  },
  {
    id: 'notif-3',
    memberId: 'member-3',
    riskLevel: 'safe',
    changed: false,
    location: '東京都渋谷区渋谷',
    time: '7:50',
    dateLabel: '今日',
    isRead: true,
  },
  {
    id: 'notif-4',
    memberId: 'member-4',
    riskLevel: 'safeLight',
    changed: false,
    location: '東京都目黒区中目黒',
    time: '7:20',
    dateLabel: '今日',
    isRead: true,
  },
  {
    id: 'notif-5',
    memberId: 'member-1',
    riskLevel: 'warning',
    changed: true,
    location: '東京都千代田区丸の内1丁目',
    time: '18:30',
    dateLabel: '昨日',
    isRead: true,
  },
  {
    id: 'notif-6',
    memberId: 'member-4',
    riskLevel: 'safeLight',
    changed: false,
    location: '東京都目黒区中目黒',
    time: '18:00',
    dateLabel: '昨日',
    isRead: true,
  },
];
