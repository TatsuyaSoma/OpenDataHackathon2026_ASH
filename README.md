# 家族の熱中症見守り

都知事杯 OpenData Hackathon 2026 提出作品。家族それぞれの現在位置と気象庁アメダスの公開データ（気温・湿度）から熱中症の危険度を算出し、家族間で見守り合えるスマートフォンアプリです。

## 仕様概要

- 対応OS：iOS / Android / Web（React Native + TypeScript、Expo Router）
- 家族利用を想定。6人家族（本人=母親・父親・子供2人・祖父母）をモデルにしたモックレベル実装
- 全メンバーの位置情報は東京駅・丸の内〜日本橋・京橋周辺エリアを想定した`src/data/mockData.ts`の固定値（家族間で位置情報を共有するバックエンドが未実装のため、実際の現在地取得は行っていない）。本人（`isSelf`のメンバー）のみ、その固定位置に対応する気象庁アメダスの実測気温・湿度を使って危険度・体力ゲージを算出する
- 東京都が公開しているオープンデータへの連携は未着手。現状は代替として気象庁アメダスの非公式公開JSON（全国、APIキー不要）を利用している（詳細は「今後の実装予定」参照）
- メンバー情報・通知履歴は端末内（AsyncStorage）に永続化され、アプリを再起動しても保持される（データソース自体はモックのまま）

### 画面構成

```
(tabs) ボトムタブ
  ├─ ホーム画面
  ├─ マップ画面
  ├─ 通知履歴画面
  └─ 設定画面
       ├─ メンバ管理（一覧・追加・編集・一括削除）
       ├─ お休みモード（メンバー別ON/OFF）
       ├─ 通知設定（準備中）
       ├─ アプリ設定（準備中）
       └─ データ・その他（準備中）

タブの上に重ねて表示するスタック画面
  ├─ カード詳細画面（メンバーカードタップで遷移）
  └─ メンバ登録／編集画面（新規登録・設定画面からの編集で共用）
```

### 主な機能

- 危険度は **水色→緑→黄色→橙→赤→紫** の6段階（`src/constants/riskConfig.ts`で一元管理）。気温・湿度・年齢から0〜100の連続スコアと6段階レベルを算出するロジックを`src/logic/riskCalculation.ts`に集約しており、算出式を差し替えても呼び出し側（`MembersContext`・`RiskGauge`・マップのピン等）は変更不要な作りにしている（性別による補正は根拠が乏しいため未実装。算出仕様が確定した際に差し替えやすい構成にしている）
- **体力ゲージ**：危険度とは別に、その危険な環境にどれだけ耐えているかを表す0〜100のHPバー（`src/logic/vitalityGauge.ts`）。危険度が高い状態が続くと減り、お休み中は回復する。ホーム・カード詳細・マップのピンでは危険度カラーの円形ゲージをこの体力ゲージで塗りつぶし、中央には危険度スコアを危険度カラーの数値で重ねて表示する（ゲージ＝耐久力、中央の数値＝今の環境の危険度、という役割分担）。ゲージが70/40を下回るたびに水分補給・休憩を促すローカル通知と通知履歴への記録が発生する（デモで動きが見える速さになるよう増減ペースを調整済み）
- **ホーム画面**：メンバーごとのカード一覧（体力ゲージリング＋危険度スコア表示）、危険者数バナー、画面下部固定のお休みモード導線（本人のお休みON/OFFを画面遷移なしでその場に切り替え）
- **カード詳細画面**：登録情報・現在位置・現在の環境・最終更新時刻・危険度推移グラフ。「大丈夫？」は本人以外のメンバーにのみ、「元気！」は本人のメンバーにのみ表示するワンプッシュ返信。通知履歴から開いた場合は、通知発生時点の危険度・位置・時刻をスナップショットとして表示（現在の状況と異なる旨を明示するバナー付き）
- **マップ画面**：背景は実際のGoogleマップのスクリーンショット画像（東京駅・丸の内周辺、`assets/images/map/`）をモックとして敷いており、ドラッグして周辺を見回せる（`react-native-gesture-handler`によるパン操作。表示範囲外に出たメンバー・スポットは画面端に寄せて方向バッジ付きで表示）。メンバーアイコン＋体力ゲージリング、お休み中バッジ、コンビニ/自販機/給水スポット/カフェのピン、WBGT危険度の簡易タイル表示、各レイヤーのON/OFF切り替え（表示設定パネルはヘッダータップで開閉、初期状態は最小化）。コンビニ・自販機のピンはOpenStreetMap（Overpass API）の実データを使用（取得中・失敗時はモックにフォールバック）。給水スポット・カフェとWBGTタイルは表示切替こそ用意したものの、位置・数値データ自体は引き続きモック（詳細は[google-maps-integration.md](./google-maps-integration.md)）
- **通知履歴画面**：危険度・メンバー・既読状態でのフィルタ、日付ごとのグループ表示、「大丈夫？」「元気」のワンプッシュ返信（カード詳細画面と同じ本人/非本人の出し分けに加え、危険度がやや危険以上の場合のみ「大丈夫？」を表示）。危険度が「注意」以上の通知には、水分補給や休憩などの行動提案（`riskConfig.ts`の`advice`）を表示。通知履歴は端末に永続化され（`NotificationsContext`）、体力ゲージのしきい値超過イベントも自動で記録される
- **設定画面**：
  - メンバ管理：一覧表示、新規登録・編集画面への導線、メンバー個別の削除（編集画面から。本人は削除不可）、一括削除
  - お休みモード：メンバーごとのお休みON/OFF切り替え（実際に他画面にも反映され、体力ゲージの回復ペースにも反映されます）。通知しきい値30分単位・夜間通知OFF時間帯の設定はまだ表示のみのモックです
- **メンバ登録／編集画面**：名前・生年月日（必須）、性別、写真（カメラ撮影／アルバム選択に対応。アルバムから選択した場合は拡大縮小・位置調整できる切り抜きモーダルを経由）、自宅住所（テキスト入力または地図上でピン指定）、備考を登録・編集。保存すると一覧に反映されます
- **危険度アラート通知**：本人の危険度が「危険」以上になった瞬間、端末のローカル通知（`expo-notifications`）でお知らせします。サーバーを介さないため、他の家族の端末には届きません（Webは非対応。Expo Go環境で通知モジュールの読み込みに失敗した場合も、アプリ本体はクラッシュせず通知機能のみ無効化される作りにしています）

### 実装状況

見た目・画面遷移・アプリ内で完結する操作（メンバーの追加/編集/削除、お休みモードの切り替え、通知履歴のフィルタ、写真登録等）は一通り動作します。一方で、以下は未実装のモック/プレースホルダーです。

- 熱中症危険度の算出ロジックは気温・湿度・年齢のみの簡易版（WBGT・活動量・お休みモードを反映した正式仕様は未確定。性別は根拠不十分のため未反映）
- 全メンバーの位置情報は`src/data/mockData.ts`の固定値（東京駅・丸の内〜日本橋・京橋周辺）。以前は本人（`isSelf`のメンバー）のみ`expo-location`で実際の現在地に自動更新していたが、モックデータとの整合性を保つため現在は停止しており固定位置のまま。気温・湿度のみ、本人の固定位置に対応する気象庁アメダスの実データで更新される。家族間で位置情報を共有するバックエンド／リアルタイム通信も未実装
- 東京都オープンデータとの連携（現状は代替として気象庁アメダスの全国データを使用。東京都のデータカタログサイト等への差し替えは未着手）
- 実際の地図タイル表示（[google-maps-integration.md](./google-maps-integration.md)にexpo-maps導入時の制約・手順をまとめ済み。Web非対応・development build必須のため保留中。現状はGoogleマップのスクリーンショット画像をモックとして敷いている）。WBGTタイル表示は実測データ未連携のダミー値、給水スポット・カフェのピンも実データ未連携（いずれもモックのみ）
- お休みモードの自動解除（位置情報の移動をトリガーにした自動解除）は、実際の位置情報取得を停止したのに伴い未実装に戻っている。通知しきい値・夜間通知OFFの条件設定は表示のみのモック
- 危険度アラート・体力ゲージのリマインダー通知は本人端末へのローカル通知のみ実装済み。「危険度超過を他の家族にも知らせる」には、各メンバーの端末から情報を集約するバックエンドとプッシュ通知配信の仕組みが別途必要
- 通知設定／アプリ設定／データ・その他タブの中身、メンバーの並び替え機能
- メンバー情報・通知履歴はAsyncStorageで端末に永続化されるようになったが、データソース自体はモックのまま（API連携は未着手）

## 技術スタック

- [Expo](https://expo.dev) + [Expo Router](https://docs.expo.dev/router/introduction/)（`src/app` 配下のファイルベースルーティング。`(tabs)`グループ＋ルートStackの構成）
  - ネイティブは`expo-router/unstable-native-tabs`、Webは下部固定タブバーを持たないため`expo-router/ui`のheadless tabsで代替実装（`src/app/(tabs)/_layout.web.tsx`）
- React Native + TypeScript
- [react-native-svg](https://github.com/software-mansion/react-native-svg)（危険度・体力ゲージの円形プログレス表現）
- [lucide-react-native](https://lucide.dev/)（アイコン）
- [react-native-gesture-handler](https://docs.swmansion.com/react-native-gesture-handler/) + [react-native-reanimated](https://docs.swmansion.com/react-native-reanimated/)（マップ画面のドラッグ操作、スプラッシュアニメーション。ルート直下を`GestureHandlerRootView`で包む必要があるため`src/app/_layout.tsx`に設置）
- [@react-native-async-storage/async-storage](https://react-native-async-storage.github.io/async-storage/)（メンバー情報・通知履歴を端末に永続化。データソース自体はモックのまま）
- [expo-image-picker](https://docs.expo.dev/versions/latest/sdk/imagepicker/)（メンバー写真のカメラ撮影／アルバム選択。Webは`allowsEditing`が未対応のため、`ImageCropModal.web.tsx`でCanvasベースの独自切り抜きUIを実装）
- [expo-asset](https://docs.expo.dev/versions/latest/sdk/asset/)（モック写真として同梱しているイラスト画像を`require()`からURI文字列に変換。react-native-webは`Image.resolveAssetSource`が未実装のため、ネイティブ／Web両対応のこちらを使用）
- [expo-notifications](https://docs.expo.dev/versions/latest/sdk/notifications/)（本人の危険度アラート・体力ゲージリマインダーの端末ローカル通知。Web未対応のため`src/services/localNotifications.web.ts`でダミー実装に差し替え。Expo Go環境でモジュール読み込みに失敗してもアプリ本体は継続動作するようtry/catchで防御）
- 気象庁アメダス非公式公開JSON（`src/services/amedasWeather.ts`）と OpenStreetMap Overpass API（`src/services/overpassSpots.ts`）— いずれもAPIキー不要の公開エンドポイントで、本人の環境データ・コンビニ/自販機ピンに使用
- React Context（`src/context/MembersContext.tsx`でメンバー一覧、`src/context/NotificationsContext.tsx`で通知履歴）による画面間共有state（気温湿度・危険度・体力ゲージの自動反映、危険度アラート／体力ゲージリマインダー通知の発火、AsyncStorageへの永続化を含む）
- `expo-location`は依存関係としては残っているが、実際の現在地取得機能は現在未使用（モック位置に統一したため）

## ディレクトリ構成（抜粋）

```
src/
  app/                        # Expo Routerのルーティング（画面遷移）
    _layout.tsx                 # ルートStack（(tabs) と member/[id], member/new を束ねる）
    (tabs)/
      _layout.tsx                 # ネイティブ用タブ（NativeTabs）
      _layout.web.tsx              # Web用タブ（headless tabsで下部固定バーを自作）
      index.tsx                     # ホーム
      map.tsx
      notifications.tsx
      settings.tsx
    member/
      [id].tsx                    # カード詳細（通知履歴からのスナップショット表示に対応）
      new.tsx                      # メンバ登録／編集（idパラメータの有無で切り替え）
  screens/
    HomeScreen.tsx / MapScreen.tsx / NotificationsScreen.tsx
    SettingsScreen.tsx / MemberFormScreen.tsx / CardDetailScreen.tsx
  components/
    MemberCard.tsx / RiskGauge.tsx / RiskBadge.tsx / RiskTrendChart.tsx
    Map*.tsx                        # マップ画面のピン・凡例・表示設定パネル・背景画像・WBGTタイル層
    Notification*.tsx                # 通知履歴の絞り込み・カード（本人/非本人でのボタン出し分け含む）
    QuickReplyBar.tsx                 # カード詳細画面下部の「大丈夫？」「元気！」ワンプッシュ返信
    MemberManagementSection.tsx / RestModeSection.tsx / SettingsSubTabBar.tsx
    AddressMapPickerModal.tsx         # 自宅住所を地図ピンで指定するモーダル
    PhotoSourceModal.tsx               # 写真登録時のカメラ／アルバム選択モーダル
    ImageCropModal.tsx（ネイティブ用no-op） / ImageCropModal.web.tsx（Web用Canvas切り抜きUI）
    app-tabs.tsx                       # NativeTabsの中身（ネイティブ用）
  context/
    MembersContext.tsx                 # メンバー一覧の共有state（追加・更新・個別/一括削除・お休み切替・体力ゲージの定期更新・危険度の都度算出・本人環境の自動更新・危険度アラート/体力ゲージ通知の発火・AsyncStorageへの永続化）
    NotificationsContext.tsx            # 通知履歴の共有state（追加・AsyncStorageへの永続化）
  logic/
    riskCalculation.ts                  # 熱中症危険度（スコア・6段階レベル）算出の唯一のロジック
    vitalityGauge.ts                     # 体力ゲージ（0〜100）の増減・危険度カラーへの変換ロジック
  services/
    amedasWeather.ts                     # 気象庁アメダス公開JSONから最寄り観測地点の気温・湿度を取得
    overpassSpots.ts                      # OpenStreetMap Overpass APIからコンビニ・自販機の位置を取得
    localNotifications.ts（ネイティブ用） / localNotifications.web.ts（Web用ダミー） # 危険度アラート・体力ゲージリマインダーのローカル通知
  hooks/
    use-nearby-weather.ts / use-area-weather.ts   # 最寄り／範囲内のアメダス観測値取得フック
    use-nearby-spots.ts                    # 範囲内のコンビニ・自販機取得フック
  utils/
    crossPlatformAlert.ts                  # react-native-webでAlert.alertが無効なための代替（Web版はwindow.alert/confirm）
    mapProjection.ts                        # 緯度経度とマップ画面の仮想0〜100座標系の相互変換
  constants/
    theme.ts                            # 色・余白・Spacing等（唯一の情報源）
    riskConfig.ts                        # 危険度6段階の色・ラベル定義
    mapSpotConfig.ts                      # マップのスポット種別（コンビニ/自販機等）の色・アイコン
  data/
    mockData.ts                           # 開発用モックデータ（メンバー・通知・マップスポット）。メンバー写真はassets/images/members/配下のイラスト画像
  types/
    index.ts                               # Member / RiskLevel / NotificationItem 等の型定義
assets/
  images/
    members/                              # メンバー写真のモックイラスト
    map/                                    # マップ背景として敷いているGoogleマップのスクリーンショット画像（モック）
```

## セットアップ

### 前提条件

- **Node.js 22.13.x 以上**（Expo SDK 57の必須要件。`node -v` で確認してください）
- 実機やシミュレータで確認する場合は、以下のいずれかを用意してください
  - **Expo Go**：[Expo Go](https://expo.dev/go) アプリを実機にインストールするだけで動作確認可能（一番手軽な方法）
  - **Android実機／エミュレータ**：エミュレータを使う場合は [Android Studio](https://docs.expo.dev/workflow/android-studio-emulator/) のインストールが必要
  - **iOSシミュレータ**：Mac限定。[Xcode](https://docs.expo.dev/workflow/ios-simulator/)（Xcode 26.4+）のインストールが必要
- Webで確認する場合は追加インストール不要（ブラウザのみでOK）

### インストール

```bash
npm install
```

> ⚠️ `app.json` の `plugins` に `expo-image-picker`・`expo-location`・`expo-notifications` のカメラ／写真ライブラリ／位置情報／通知用の権限メッセージ（日本語文言）を設定していますが、これは[Config Plugin](https://docs.expo.dev/workflow/continuous-native-generation/)によるネイティブ設定の変更のため、**Expo Goには反映されません**（Expo Goは事前ビルド済みアプリのため、標準の権限メッセージのまま動作します）。この文言を実機で確認したい場合は、[development build](https://docs.expo.dev/develop/development-builds/introduction/)（`npx expo prebuild` または EAS Build）を作成してください。写真選択・撮影・ローカル通知の機能自体はExpo Go上でも動作します（`expo-location`の位置情報権限は設定のみで、現在アプリ内では実際の現在地取得を行っていません）。
>
> `npm run android` / `npm run ios` は`expo-dev-client`導入に伴い`expo run:android` / `expo run:ios`（ローカルでのネイティブビルド）に変更されています。Expo Goで手軽に確認したい場合は、上記の代わりに`npx expo start`から起動してください。

## 実行方法

```bash
npx expo start
```

出力されたオプションから、以下のいずれかでアプリを開けます。

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android エミュレータ](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS シミュレータ](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go)
- Web（`npx expo start --web`）。ただしカメラ撮影・アルバム選択などネイティブAPIに依存する機能は制限されるため、実機／シミュレータでの確認を推奨します

テーマ関連の修正を反映した直後など、キャッシュが影響していそうな場合は `-c` オプションでキャッシュをクリアして起動してください。

```bash
npx expo start -c
```

`src/app` 配下がファイルベースルーティングのルートです。タブ画面を追加する場合は `src/app/(tabs)/` にファイルを追加し、`src/components/app-tabs.tsx`（ネイティブ）と `src/app/(tabs)/_layout.web.tsx`（Web）の両方にタブを追加してください。

## 既知の注意点・今後の実装予定

- 危険度算出ロジック（`src/logic/riskCalculation.ts`）は気温・湿度・年齢を使った簡易計算です。チーム内で正式仕様（WBGT・活動量等の反映）が決まり次第、このファイルの中身のみを差し替える想定です
- 全メンバーの位置情報は`src/data/mockData.ts`の固定値です。以前は本人（`isSelf`のメンバー）のみ`expo-location`で実際の現在地を取得していましたが、モックデータとの整合性を優先し現在は停止しています。家族全員分の位置をリアルタイムに共有するには、各メンバーの端末から位置情報を送るバックエンド（API・DB）が別途必要です
- 気温・湿度は気象庁アメダスの全国データを使用しています。「東京都のオープンデータ」を明示的に使う要件がある場合、東京都のデータカタログサイト等が公開するAPI／データセットへの差し替えが必要です
- お休みモードはON/OFF切り替えのみ実装済みです。以前あった「本人が開始地点から300m以上動いたら自動解除」は、実際の位置情報取得の停止に伴い未実装に戻っています。通知しきい値・夜間通知OFFの条件設定も表示のみのモックで、実際の通知と連動していません
- 実際の地図タイル表示（expo-maps等）は未導入です。検討内容・制約・導入手順は[google-maps-integration.md](./google-maps-integration.md)にまとめています（Web非対応・development build必須のため保留中）。現状はGoogleマップのスクリーンショット画像（`assets/images/map/`）をモックとして敷き、ドラッグで見回せるようにしています
- マップのWBGTタイル表示（`src/components/MapWbgtTileLayer.tsx`）は実測データ未連携のダミー値です。実測WBGTデータへの差し替えが今後の課題です
- 危険度アラート・体力ゲージのリマインダー通知は、本人端末へのローカル通知（`expo-notifications`）のみ実装済みです。「他の家族にも知らせる」プッシュ通知には、各メンバーの位置・環境情報を集約するバックエンドが別途必要です
- メンバー情報・通知履歴はAsyncStorageで端末に保存されるようになりましたが、データソース自体は依然としてモックです。サーバーAPIとの連携が今後の課題です
- 設定画面の「通知設定」「アプリ設定」「データ・その他」タブ、および「メンバーの並び替え」機能は未着手です
- コンビニ・自販機のピンはOpenStreetMap（Overpass API）の実データですが、給水スポット・カフェのピンは表示切替こそあるものの引き続きモックのみです（「給水スポット」の厳密な定義もまだ未確定です）
- Web版では`react-native-web`の制約に対する回避策をいくつか実装しています（`Alert.alert`が未実装のため`src/utils/crossPlatformAlert.ts`で代替、`Modal`の`animationType`指定がタップ不能なオーバーレイを残すため未指定にする、`router.back()`がリロード後に失敗するため主要な戻る導線は`router.replace()`を使用）。詳細は各ファイルのコメントを参照してください

## その他

- ESLintの設定：`npx expo lint`（詳細は[「Using ESLint and Prettier」](https://docs.expo.dev/guides/using-eslint/)）
- ユニットテスト：[「Unit Testing with Jest」](https://docs.expo.dev/develop/unit-testing/)
- TypeScript設定：[「Using TypeScript」](https://docs.expo.dev/guides/typescript/)
- [Expo ドキュメント](https://docs.expo.dev/) / [Learn Expo チュートリアル](https://docs.expo.dev/tutorial/introduction/)
