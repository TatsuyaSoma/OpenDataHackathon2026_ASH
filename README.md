# 家族の熱中症見守り

都知事杯 OpenData Hackathon 2026 提出作品。家族それぞれの現在位置と気象庁アメダスの公開データ（気温・湿度）から熱中症の危険度を算出し、家族間で見守り合えるスマートフォンアプリです。

## 仕様概要

- 対応OS：iOS / Android / Web（React Native + TypeScript、Expo Router）
- 家族利用を想定。6人家族（本人=母親・父親・子供2人・祖父母）をモデルにしたモックレベル実装
- 本人（`isSelf`のメンバー）は`expo-location`で取得した実際の現在地と、気象庁アメダスの実測気温・湿度を使って危険度を算出する。本人以外のメンバーはまだ位置情報を共有する仕組み（バックエンド）がないため、`src/data/mockData.ts`の固定値を表示している
- 東京都が公開しているオープンデータへの連携は未着手。現状は代替として気象庁アメダスの非公式公開JSON（全国、APIキー不要）を利用している（詳細は「今後の実装予定」参照）

### 画面構成

```
(tabs) ボトムタブ
  ├─ ホーム画面
  ├─ マップ画面
  ├─ 通知履歴画面
  └─ 設定画面
       ├─ メンバ管理（一覧・追加・編集・一括削除）
       ├─ お休みモード（メンバー別ON/OFF・自動解除条件）
       ├─ 通知設定（準備中）
       ├─ アプリ設定（準備中）
       └─ データ・その他（準備中）

タブの上に重ねて表示するスタック画面
  ├─ カード詳細画面（メンバーカードタップで遷移）
  └─ メンバ登録／編集画面（新規登録・設定画面からの編集で共用）
```

### 主な機能

- 危険度は **水色→緑→黄色→橙→赤→紫** の6段階（`src/constants/riskConfig.ts`で一元管理）。気温・湿度・年齢から0〜100の連続スコアと6段階レベルを算出するロジックを`src/logic/riskCalculation.ts`に集約しており、算出式を差し替えても呼び出し側（`MembersContext`・`RiskGauge`・マップのヒートマップ等）は変更不要な作りにしている（性別による補正は根拠が乏しいため未実装。算出仕様が確定した際に差し替えやすい構成にしている）
- **ホーム画面**：メンバーごとのカード一覧（危険度リング＋スコア表示）、危険者数バナー、画面下部固定のお休みモード導線（本人のお休みON/OFFを画面遷移なしでその場に切り替え）
- **カード詳細画面**：登録情報・現在位置・現在の環境・最終更新時刻・危険度推移グラフ。「大丈夫？」は本人以外のメンバーにのみ、「元気！」は本人のメンバーにのみ表示するワンプッシュ返信。通知履歴から開いた場合は、通知発生時点の危険度・位置・時刻をスナップショットとして表示（現在の状況と異なる旨を明示するバナー付き）
- **マップ画面**：メンバーアイコン＋危険度リング、お休み中バッジ、コンビニ/自販機/給水スポット/カフェのピン、メンバー別ヒートマップ（年齢に応じて範囲が変化）、各レイヤーのON/OFF切り替え（表示設定パネルはヘッダータップで最小化可能）、ヒートマップ基準メンバーの選択。コンビニ・自販機のピンはOpenStreetMap（Overpass API）の実データ、ヒートマップは気象庁アメダスの実測気温・湿度を使用（いずれも取得中・失敗時はモックにフォールバック）。給水スポット・カフェは表示切替こそ用意したものの、位置データ自体は引き続きモック。地図タイル自体は簡易的なベクター風プレースホルダー（詳細は[google-maps-integration.md](./google-maps-integration.md)）
- **通知履歴画面**：危険度・メンバー・既読状態でのフィルタ、日付ごとのグループ表示、「大丈夫？」「元気」のワンプッシュ返信（カード詳細画面と同じ本人/非本人の出し分けに加え、危険度がやや危険以上の場合のみ「大丈夫？」を表示）。危険度が「注意」以上の通知には、水分補給や休憩などの行動提案（`riskConfig.ts`の`advice`）を表示
- **設定画面**：
  - メンバ管理：一覧表示、新規登録・編集画面への導線、メンバー個別の削除（編集画面から。本人は削除不可）、一括削除
  - お休みモード：メンバーごとのお休みON/OFF切り替え（実際に他画面にも反映されます）。本人がお休み中に開始地点から300m以上動くと自動で解除されます（実際の位置情報と連動）。通知しきい値30分単位・夜間通知OFF時間帯の設定はまだ表示のみのモックです
- **メンバ登録／編集画面**：名前・生年月日（必須）、性別、写真（カメラ撮影／アルバム選択に対応。アルバムから選択した場合は拡大縮小・位置調整できる切り抜きモーダルを経由）、自宅住所（テキスト入力または地図上でピン指定）、備考を登録・編集。保存すると一覧に反映されます
- **危険度アラート通知**：本人の危険度が「危険」以上になった瞬間、端末のローカル通知（`expo-notifications`）でお知らせします。サーバーを介さないため、他の家族の端末には届きません（Webは非対応）

### 実装状況

見た目・画面遷移・アプリ内で完結する操作（メンバーの追加/編集/削除、お休みモードの切り替え、通知履歴のフィルタ、写真登録等）は一通り動作します。一方で、以下は未実装のモック/プレースホルダーです。

- 熱中症危険度の算出ロジックは気温・湿度・年齢のみの簡易版（WBGT・活動量・お休みモードを反映した正式仕様は未確定。性別は根拠不十分のため未反映）
- 実際の位置情報・気温湿度は本人（`isSelf`のメンバー）にのみ反映される。家族間で位置情報を共有するバックエンド／リアルタイム通信が未実装のため、本人以外のメンバーは`src/data/mockData.ts`の固定値のまま
- 東京都オープンデータとの連携（現状は代替として気象庁アメダスの全国データを使用。東京都のデータカタログサイト等への差し替えは未着手）
- 実際の地図タイル表示（[google-maps-integration.md](./google-maps-integration.md)にexpo-maps導入時の制約・手順をまとめ済み。Web非対応・development build必須のため保留中）。給水スポット・カフェのピンも実データ未連携（モックのみ）
- お休みモードの自動解除は「本人が開始地点から動いたら解除」のみ実装済み。通知しきい値・夜間通知OFFの条件設定は表示のみのモック
- 危険度アラートは本人端末へのローカル通知のみ実装済み。「危険度超過を他の家族にも知らせる」には、各メンバーの端末から情報を集約するバックエンドとプッシュ通知配信の仕組みが別途必要
- 通知設定／アプリ設定／データ・その他タブの中身、メンバーの並び替え機能
- データの永続化（メンバー情報は`MembersContext`のメモリ上のstateのみで、アプリを再読み込みすると初期モックデータに戻ります）

## 技術スタック

- [Expo](https://expo.dev) + [Expo Router](https://docs.expo.dev/router/introduction/)（`src/app` 配下のファイルベースルーティング。`(tabs)`グループ＋ルートStackの構成）
  - ネイティブは`expo-router/unstable-native-tabs`、Webは下部固定タブバーを持たないため`expo-router/ui`のheadless tabsで代替実装（`src/app/(tabs)/_layout.web.tsx`）
- React Native + TypeScript
- [react-native-svg](https://github.com/software-mansion/react-native-svg)（危険度ゲージの円形プログレス、マップのヒートマップ表現）
- [lucide-react-native](https://lucide.dev/)（アイコン）
- [expo-location](https://docs.expo.dev/versions/latest/sdk/location/)（本人の現在地取得。逆ジオコーディングはネイティブ標準APIを優先し、Web等で失敗した場合はOpenStreetMap Nominatimにフォールバック）
- [expo-image-picker](https://docs.expo.dev/versions/latest/sdk/imagepicker/)（メンバー写真のカメラ撮影／アルバム選択。Webは`allowsEditing`が未対応のため、`ImageCropModal.web.tsx`でCanvasベースの独自切り抜きUIを実装）
- [expo-asset](https://docs.expo.dev/versions/latest/sdk/asset/)（モック写真として同梱しているイラスト画像を`require()`からURI文字列に変換。react-native-webは`Image.resolveAssetSource`が未実装のため、ネイティブ／Web両対応のこちらを使用）
- [expo-notifications](https://docs.expo.dev/versions/latest/sdk/notifications/)（本人の危険度が「危険」以上になった際の端末ローカル通知。Web未対応のため`src/services/localNotifications.web.ts`でダミー実装に差し替え）
- 気象庁アメダス非公式公開JSON（`src/services/amedasWeather.ts`）と OpenStreetMap Overpass API（`src/services/overpassSpots.ts`）— いずれもAPIキー不要の公開エンドポイントで、本人の環境データ・マップのヒートマップ・コンビニ/自販機ピンに使用
- React Context（`src/context/MembersContext.tsx`）によるメンバー一覧の画面間共有state（位置情報・気温湿度・危険度の自動反映、お休みモードの自動解除判定、危険度アラート通知の発火を含む）
- react-native-reanimated / react-native-worklets（スプラッシュアニメーション）

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
    Map*.tsx                        # マップ画面のピン・凡例・表示設定パネル・ヒートマップ層
    Notification*.tsx                # 通知履歴の絞り込み・カード（本人/非本人でのボタン出し分け含む）
    QuickReplyBar.tsx                 # カード詳細画面下部の「大丈夫？」「元気！」ワンプッシュ返信
    MemberManagementSection.tsx / RestModeSection.tsx / SettingsSubTabBar.tsx
    AddressMapPickerModal.tsx         # 自宅住所を地図ピンで指定するモーダル
    PhotoSourceModal.tsx               # 写真登録時のカメラ／アルバム選択モーダル
    ImageCropModal.tsx（ネイティブ用no-op） / ImageCropModal.web.tsx（Web用Canvas切り抜きUI）
    app-tabs.tsx                       # NativeTabsの中身（ネイティブ用）
  context/
    MembersContext.tsx                 # メンバー一覧の共有state（追加・更新・個別/一括削除・お休み切替・自動解除判定・危険度の都度算出・本人の位置/環境自動更新・危険度アラート通知の発火）
  logic/
    riskCalculation.ts                  # 熱中症危険度（スコア・6段階レベル）算出の唯一のロジック
  services/
    amedasWeather.ts                     # 気象庁アメダス公開JSONから最寄り観測地点の気温・湿度を取得
    overpassSpots.ts                      # OpenStreetMap Overpass APIからコンビニ・自販機の位置を取得
    localNotifications.ts（ネイティブ用） / localNotifications.web.ts（Web用ダミー） # 危険度アラートのローカル通知
  hooks/
    use-device-location.ts                # 本人端末の現在地取得（expo-location、Web逆ジオコーディングのフォールバック含む）
    use-nearby-weather.ts / use-area-weather.ts   # 最寄り／範囲内のアメダス観測値取得フック
    use-nearby-spots.ts                    # 範囲内のコンビニ・自販機取得フック
  utils/
    crossPlatformAlert.ts                  # react-native-webでAlert.alertが無効なための代替（Web版はwindow.alert/confirm）
    mapProjection.ts                        # 緯度経度とマップ画面の仮想0〜100座標系の相互変換
    geo.ts                                   # 2地点間の距離算出（お休みモードの自動解除判定に使用）
  constants/
    theme.ts                            # 色・余白・Spacing等（唯一の情報源）
    riskConfig.ts                        # 危険度6段階の色・ラベル定義
    mapSpotConfig.ts                      # マップのスポット種別（コンビニ/自販機等）の色・アイコン
  data/
    mockData.ts                           # 開発用モックデータ（メンバー・通知・マップスポット）。メンバー写真はassets/images/members/配下のイラスト画像
  types/
    index.ts                               # Member / RiskLevel / NotificationItem 等の型定義
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

> ⚠️ `app.json` の `plugins` に `expo-image-picker`・`expo-location`・`expo-notifications` のカメラ／写真ライブラリ／位置情報／通知用の権限メッセージ（日本語文言）を設定していますが、これは[Config Plugin](https://docs.expo.dev/workflow/continuous-native-generation/)によるネイティブ設定の変更のため、**Expo Goには反映されません**（Expo Goは事前ビルド済みアプリのため、標準の権限メッセージのまま動作します）。この文言を実機で確認したい場合は、[development build](https://docs.expo.dev/develop/development-builds/introduction/)（`npx expo prebuild` または EAS Build）を作成してください。写真選択・撮影・現在地取得・ローカル通知の機能自体はExpo Go上でも動作します。

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
- 実際の位置情報・気温湿度は本人（`isSelf`のメンバー）にのみ反映されます。家族全員分をリアルタイムに共有するには、各メンバーの端末から位置情報を送るバックエンド（API・DB）が別途必要です
- 気温・湿度は気象庁アメダスの全国データを使用しています。「東京都のオープンデータ」を明示的に使う要件がある場合、東京都のデータカタログサイト等が公開するAPI／データセットへの差し替えが必要です
- お休みモードは、ON/OFF切り替えと「本人が開始地点から300m以上動いたら自動解除」までは実装済みです。通知しきい値・夜間通知OFFの条件設定は表示のみのモックで、実際の通知と連動していません
- 実際の地図タイル表示（expo-maps等）は未導入です。検討内容・制約・導入手順は[google-maps-integration.md](./google-maps-integration.md)にまとめています（Web非対応・development build必須のため保留中）
- 危険度アラートは、本人端末へのローカル通知（`expo-notifications`）のみ実装済みです。「危険度超過を他の家族にも知らせる」プッシュ通知には、各メンバーの位置・環境情報を集約するバックエンドが別途必要です
- メンバー情報は`MembersContext`のメモリ上stateのみで永続化されません。API連携・端末保存の導入が今後の課題です
- 設定画面の「通知設定」「アプリ設定」「データ・その他」タブ、および「メンバーの並び替え」機能は未着手です
- コンビニ・自販機のピンはOpenStreetMap（Overpass API）の実データですが、給水スポット・カフェのピンは表示切替こそあるものの引き続きモックのみです（「給水スポット」の厳密な定義もまだ未確定です）
- Web版では`react-native-web`の制約に対する回避策をいくつか実装しています（`Alert.alert`が未実装のため`src/utils/crossPlatformAlert.ts`で代替、`Modal`の`animationType`指定がタップ不能なオーバーレイを残すため未指定にする、`router.back()`がリロード後に失敗するため主要な戻る導線は`router.replace()`を使用）。詳細は各ファイルのコメントを参照してください
- `react-native-worklets` の `scheduleOnRN` は Expo SDK 57 まわりの動作検証中のため、`src/components/animated-icon.tsx` では一時的に `setVisible` の直接呼び出しに置き換えています

## その他

- ESLintの設定：`npx expo lint`（詳細は[「Using ESLint and Prettier」](https://docs.expo.dev/guides/using-eslint/)）
- ユニットテスト：[「Unit Testing with Jest」](https://docs.expo.dev/develop/unit-testing/)
- TypeScript設定：[「Using TypeScript」](https://docs.expo.dev/guides/typescript/)
- [Expo ドキュメント](https://docs.expo.dev/) / [Learn Expo チュートリアル](https://docs.expo.dev/tutorial/introduction/)
