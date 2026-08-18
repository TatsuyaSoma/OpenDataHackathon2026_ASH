# 実地図（Google Maps / Apple Maps）連携について

iOS/Android版のマップ画面（`src/screens/MapScreen.tsx`）は`expo-maps`による実際のApple Maps/Google Mapsタイルを表示するようになった（2026-08-18時点）。Web版（`src/screens/MapScreen.web.tsx`）は`expo-maps`が非対応のため、従来通り`MapBackgroundLayer`によるプレースホルダー画像のままとなっている。本ドキュメントは、検討内容・実装上の制約・実装方法をまとめたメモ。

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

## 実装で判明した追加の制約（着手前は未把握だったもの）

検討時点（2026-08-11）では想定していなかった、`expo-maps`（SDK 57・アルファ版時点）特有の制約が実装時に判明した。

- **カスタムマーカーが使えない**：`GoogleMaps.View`/`AppleMaps.View`の`markers`プロパティは画像アイコン（`expo-image`の`useImage`が返す参照）のみに対応しており、このアプリの`MapMemberPin`（写真＋体力ゲージの円形リング＋バッジ類）のような複雑なReactコンポーネントをマーカーとして表示することはできない。
- **座標→画面座標の変換API（プロジェクション）が無い**：地図上の緯度経度が画面上のどのピクセルに当たるかを取得する公式手段が提供されていない。

このため、地図タイル自体は`expo-maps`のネイティブビューにまかせつつ、`MapMemberPin`・`MapSpotPin`は別レイヤーとして地図の上に絶対配置し、`onCameraMove`イベントで得られる表示範囲（中心座標＋緯度経度スパン）をもとに、自前の線形補間（`src/utils/mapProjection.ts`の`projectToRegion`）で画面位置を計算する、という非公式の力技構成で実装した。対象エリアが都心の数km四方と狭いため線形補間の誤差は無視できる想定だが、正確なWebメルカトル図法ではない点、地図を大きく傾ける操作には追従できない点は把握しておくこと。

## 実装内容（2026-08-18時点）

1. Google Cloudプロジェクトで「Maps SDK for Android」を有効化し、Androidアプリ（パッケージ名＋SHA-1証明書指紋）・該当APIのみに制限したAPIキーを発行済み
2. `npx expo install expo-maps`でインストール済み
3. `app.json`に`expo-maps`プラグインと`android.config.googleMaps.apiKey`を追加済み（キーの値自体はリポジトリに含めず、担当者が手元で`app.json`に直接記載する運用）
4. `src/screens/MapScreen.tsx`（iOS/Android用、実地図＋自前オーバーレイ）と`src/screens/MapScreen.web.tsx`（Web用、従来のプレースホルダーをそのまま維持）にファイルを分割。`src/app/(tabs)/map.tsx`からの`import '@/screens/MapScreen'`は変更不要で、Metroのプラットフォーム別拡張子解決により自動的に出し分けられる
5. `src/utils/mapProjection.ts`に`projectToRegion`（現在の表示範囲を基準にした線形補間）を追加。既存の`projectToMap`（固定の`MAP_BOUNDS`基準）はWeb版でそのまま使用
6. 初期カメラ位置は本人（`isSelf`）の位置を中心に設定（`cameraPosition`は初期値のみに使われ、以降のパン・ズームはネイティブ地図が自前で処理するため、再レンダーで位置が戻ることはない）
7. WBGTの色分けタイル表示（`MapWbgtTileLayer`、実測データ未連携のダミー値）はWeb・ネイティブ両方で表示する。ネイティブ版では`region`（`onCameraMove`から得る表示範囲）を渡すことで、`MAP_BOUNDS`（丸の内周辺の固定エリア）を実座標で地図に投影し、パン・ズームに追従させている（あくまでこの固定エリアのみを覆うダミー表示であり、都内全域のデータではない）。加えて環境省WBGT実況値の参考バッジ（`MapWbgtReferenceBadge`）もWeb・ネイティブ両方で表示する

## 動作確認について

`npx expo run:android`でdevelopment buildをビルドし、Androidエミュレータで実機確認済み（2026-08-18）。

- APIキーがプレースホルダーのままの状態では、クラッシュせず`GoogleMaps.View`自体は起動するものの（ズームボタン・Google帰属ロゴは表示される）、実際の地図タイルは読み込まれず、メンバーピン・スポットピンも表示されなかった
- Google Cloud Consoleで発行した実際のAPIキー（Androidアプリ・パッケージ名＋SHA-1指紋で制限、Maps SDK for Androidのみに限定）を`app.json`に設定し、`npx expo prebuild` → `npx expo run:android`で再ビルドしたところ、**実際の地図タイル（東京駅・丸の内・日本橋周辺の道路網・建物・地名ラベル）、メンバーピン（体力ゲージリング付き）、給水スポット・災害時給水・コンビニ・自販機・カフェの実データピン、WBGT参考バッジがすべて正しく表示されることを確認した**
- 途中、`onCameraMove`が発火しているように見えず（`region`が`null`のまま）ピンが表示されないケースがあったが、これは実際のバグではなく、画面遷移直後にスクリーンショットを撮るタイミングが早すぎただけだった（`console.log`でイベント発火を確認したところ、`onMapLoaded`から数十ミリ秒後に正しく`onCameraMove`が発火していた）。ピンの表示には地図読み込み後わずかなタイムラグがある点は把握しておくとよい

実機確認後に以下2点の不具合を修正済み（2026-08-19）。

- マップ画面のヘッダーに「戻る」ボタンがあったが、マップ画面はボトムタブのルート画面であり戻り先が無く機能していなかった。他のタブ画面（ホーム・通知履歴・設定）と同様、タイトルのみのヘッダーに統一し削除した
- WBGT参考バッジが表示されないことがあった。原因は`use-nearest-wbgt.ts`のキャッシュ実装で、初回取得が失敗すると以降ずっと再試行されないバグと、React Native標準の`SafeAreaView`（Androidでは正しく機能しない既知の問題）によりヘッダーがステータスバーと重なっていたことの2点。前者はキャッシュを失敗時にリセットするよう修正し、後者はアプリ全体を`SafeAreaProvider`で包み`react-native-safe-area-context`の`SafeAreaView`に切り替えて解決した
- 実機確認の結果、WBGTタイル（色分けグリッド）表示も期待されていることが分かったため、`MapWbgtTileLayer`に`region`propを追加し、`MAP_BOUNDS`を実座標で地図に投影してネイティブ版でも表示するようにした（`MapLegendCard`もあわせて表示）
- 上記のタイルはダミー値だったが、「オープンデータでもっと広い範囲を表示できないか」との要望を受け、環境省WBGT実況値（`fetchAllTokyoWbgt`、都内約10地点）を逆距離加重法（IDW）で補間する方式に変更した。タイルは地図の表示範囲全体（`region`の緯度経度スパン）を単純な割合グリッドで覆い、各セルの色だけを実データから逆算するため、広域表示・パン・ズームにそのまま追従する（詳細は`src/components/MapWbgtTileLayer.tsx`のコメント参照）

## 参考

- [Expo Maps (公式ドキュメント)](https://docs.expo.dev/versions/v57.0.0/sdk/maps/)
- [Development builds (公式ドキュメント)](https://docs.expo.dev/develop/development-builds/introduction/)
