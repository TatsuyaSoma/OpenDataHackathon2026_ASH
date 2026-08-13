# 実地図（Google Maps / Apple Maps）連携について

現在のマップ画面（`src/screens/MapScreen.tsx`）は実際の地図タイルではなく、`MapBackgroundLayer`によるベクター風のプレースホルダー（街区・道路・公園・河川を模した表示）を使用している。本ドキュメントは、これを実際の地図に置き換える場合の検討内容・制約・保留理由をまとめたメモ。

## 検討した選択肢

Expo SDK 57で地図を扱う代表的な方法は以下の2つ。

| | expo-maps（Expo公式） | react-native-maps |
|---|---|---|
| 提供元 | Expo | コミュニティ（旧Airbnb） |
| iOS | Apple Maps | Apple Maps |
| Android | Google Maps | Google Maps |
| Web対応 | ❌ 非対応 | ❌ 非対応（公式には） |
| Expo Goでの動作 | ❌ 不可（development build必須） | ❌ 不可（development build必須） |
| 成熟度 | アルファ版（頻繁な破壊的変更あり） | 安定版 |

いずれを選んでもWeb非対応・development build必須という制約は変わらないため、公式サポートで今後も更新が続く**expo-maps**を採用候補としている。

## 制約（保留理由）

1. **Webでは動作しない**
   現在の開発・確認は主に `npx expo start --web`（ブラウザ）で行っているが、expo-maps導入後はWeb版のマップ画面が動作しなくなる。Web版だけ従来のプレースホルダー表示を残す、といった`Platform.OS`分岐が別途必要になる。

2. **Expo Goでは確認できない**
   expo-maps/react-native-mapsはネイティブモジュールを含むため、`npx expo prebuild` でネイティブプロジェクトを生成し、development build（実機 or シミュレータ向けのカスタムビルド）を作成しないと動作確認できない。通常の「QRコードをExpo Goで読み取る」フローが使えなくなる。

3. **AndroidはGoogle Maps APIキーが必須**
   - Google Cloudプロジェクトの作成
   - 「Maps SDK for Android」の有効化
   - SHA-1証明書指紋の取得（development build用・本番用で別々に必要になる場合がある）
   - 上記を紐付けたAPIキーを発行し、`app.json`の`expo.android.config.googleMaps.apiKey`に設定

   このAPIキー取得・Google Cloud側の設定は開発環境の外側の作業のため、実装作業とは別に用意してもらう必要がある。

4. **iOS/Androidでコンポーネントが統一されていない**
   expo-mapsはプラットフォームごとに別コンポーネントを使う設計（`AppleMaps.View` / `GoogleMaps.View`）。ピンの表示・現在地表示などもプラットフォームごとにprop名が異なるため、共通ラッパーコンポーネントを自前で用意する必要がある。

## 現状の判断

上記の制約（特にWeb非対応・development build必須）を踏まえ、**いったん実地図への置き換えは保留**し、位置情報・オープンデータ連携・危険度算出ロジックなど他機能を優先する方針とした（2026-08-11時点）。

## 実装する場合に必要な準備・手順（着手時の参考）

1. Google Cloudプロジェクトを作成し、「Maps SDK for Android」を有効化してAPIキーを発行（担当者側の対応が必要）
2. `npx expo install expo-maps`
3. `app.json`に`expo-maps`プラグインとAndroid用APIキーを追加
   ```json
   {
     "expo": {
       "android": { "config": { "googleMaps": { "apiKey": "..." } } },
       "plugins": [
         ["expo-maps", { "requestLocationPermission": true }]
       ]
     }
   }
   ```
4. `npx expo prebuild` でネイティブプロジェクトを生成
5. `npx expo run:android` / `npx expo run:ios`（またはEAS Build）でdevelopment buildを作成し、実機/エミュレータで確認
6. `MapScreen.tsx`に`Platform.OS === 'web'`分岐を入れ、Web版は現行の`MapBackgroundLayer`（プレースホルダー）、iOS/Androidは`AppleMaps.View`/`GoogleMaps.View`を使うよう出し分け
7. 既存の`MapMemberPin`・`MapSpotPin`・`MapHeatmapLayer`が前提としている「0〜100の仮想座標系」（`src/utils/mapProjection.ts`）は不要になるため、実座標（緯度経度）をそのまま各コンポーネントのマーカーAPIに渡す形に置き換える

## 参考

- [Expo Maps (公式ドキュメント)](https://docs.expo.dev/versions/latest/sdk/maps/)
- [Development builds (公式ドキュメント)](https://docs.expo.dev/develop/development-builds/introduction/)
