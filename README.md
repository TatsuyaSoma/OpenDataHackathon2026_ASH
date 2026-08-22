# 熱中症見守りアプリ「ひといき」

都知事杯 OpenData Hackathon 2026 提出作品。家族それぞれの現在位置と気象庁アメダスの公開データ（気温・湿度）から熱中症の危険度を算出し、家族間で見守り合えるスマートフォンアプリです。

## 仕様概要

- 対応OS：iOS / Android / Web（React Native + TypeScript、Expo Router）
- 家族利用を想定。6人家族（本人=母親・父親・子供2人・祖父母）をモデルにしたモックレベル実装。`src/data/mockData.ts`の登録位置は、祖父母（東京都調布市の自宅）・父親（東京都港区・品川近辺のオフィス街）・子供2人（東京都練馬区・練馬駅周辺の小学校）・母親（同じく練馬駅周辺、子供たちの学校近くの実家）と、あえて離れた場所に分散させてあり、位置ごとに危険度が変わる様子を確認できる
- 位置情報自体は固定のモック値（家族間で位置情報を共有するバックエンドが未実装のため、実際の現在地取得は行っていない）。気温・湿度も、全メンバーそれぞれの登録位置に最も近い気象庁アメダス観測地点の値を使うが、2026-08-21 14:50 JST時点で一度だけ取得したスナップショットをテストデータとして固定的に使い続ける方針に変更しており、現在はネットワークへの再取得は行っていない（理由は「今後の実装予定」参照）
- 東京都が公開しているオープンデータへの連携は未着手。現状は代替として気象庁アメダスの非公式公開JSON（全国、APIキー不要）由来の固定スナップショットを利用している（詳細は「今後の実装予定」参照）
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
- **カード詳細画面**：登録情報・現在位置・現在の環境・最終更新時刻・危険度推移グラフ。「大丈夫？」は本人以外のメンバーにのみ、「元気！」は本人のメンバーにのみ表示するワンプッシュ返信。通知履歴から開いた場合は、通知発生時点の危険度・位置・時刻をスナップショットとして表示（現在の状況と異なる旨を明示するバナー付き）。「現在地」カードはiOS/Androidではそのメンバーの位置を中心にした実地図（`expo-maps`）を小さく表示し（Webはプレースホルダー）、タップまたは「マップで確認」ボタンでそのメンバーを中心にマップ画面を開く
- **マップ画面**：iOS/Androidは`expo-maps`による実際のApple Maps/Google Mapsを表示し、ネイティブの地図の上にこのアプリ独自のメンバーピン（体力ゲージリング等）・スポットピンを別レイヤーとして重ねて描画する（`expo-maps`はカスタムReactコンポーネントのマーカーや座標→画面座標の変換APIを提供しないため、`onCameraMove`で得られる表示範囲をもとに自前の線形補間で位置を計算する非公式構成。詳細は[google-maps-integration.md](./google-maps-integration.md)）。Web版は`expo-maps`非対応のため、従来通りGoogleマップのスクリーンショット画像（東京駅・丸の内周辺、`assets/images/map/`）をモックとして敷き、ドラッグして周辺を見回せる仕組み（`react-native-gesture-handler`によるパン操作）のままとなっている。表示範囲外に出たメンバー・スポットは画面端に寄せて方向バッジ付きで表示し（両版共通）、ネイティブ版はこの矢印バッジをタップすると、そのメンバーの位置へワンタップでカメラがジャンプする。ホーム画面の各メンバーカードの位置情報部分（テキストリンク）をタップした場合も、同様にそのメンバーを中心にマップ画面が開く。現在地（本人）に決まったズーム値で戻すボタンもマップ右上に用意（ネイティブ版）。メンバーアイコン＋体力ゲージリング、お休み中バッジ、コンビニ/自販機/給水スポット/災害時給水/カフェのピン、各レイヤーのON/OFF切り替え（表示設定パネルはヘッダータップで開閉、初期状態は最小化）。スポットのピンはタップすると種別・名称のふきだしを表示する。コンビニ・自販機・カフェのピンはOpenStreetMap（Overpass API）、給水スポット・災害時給水のピンは東京都水道局のオープンデータ（それぞれ「Tokyowater Drinking Station一覧」「給水拠点一覧データ」、CC BY 4.0のCSV）の実データを使用（いずれも取得中・失敗時はモックにフォールバック）。WBGT危険度の簡易タイル表示（水色→緑→黄色→橙→赤→紫の色分け・凡例付き）は、環境省「熱中症予防情報サイト」の都内実況値（約10地点）を逆距離加重法（IDW）で補間した実データ由来の表示で、地図の表示範囲全体を覆うため、広域表示・パン・ズームにも追従する（地点数が少ないため低解像度ではあるが、ダミー値ではなく実測値が反映され、10分間隔で自動更新される。両版共通の表示。詳細は「今後の実装予定」参照）。加えてマップ左下に同じ実況値のうち地図に最も近い地点の値をバッジ表示する（両版共通）
- **通知履歴画面**：危険度・メンバー・既読状態でのフィルタ、日付ごとのグループ表示、「大丈夫？」「元気」のワンプッシュ返信（カード詳細画面と同じ本人/非本人の出し分けに加え、危険度がやや危険以上の場合のみ「大丈夫？」を表示）。危険度が「注意」以上の通知には、水分補給や休憩などの行動提案（`riskConfig.ts`の`advice`）を表示。通知履歴は端末に永続化され（`NotificationsContext`）、体力ゲージのしきい値超過イベントも自動で記録される
- **設定画面**：
  - メンバ管理：一覧表示、新規登録・編集画面への導線、メンバー個別の削除（編集画面から。本人は削除不可）、一括削除
  - お休みモード：メンバーごとのお休みON/OFF切り替え（実際に他画面にも反映され、体力ゲージの回復ペースにも反映されます）。通知しきい値30分単位・夜間通知OFF時間帯の設定はまだ表示のみのモックです
- **メンバ登録／編集画面**：名前・生年月日（必須）、性別、写真（カメラ撮影／アルバム選択に対応。アルバムから選択した場合は拡大縮小・位置調整できる切り抜きモーダルを経由）、自宅住所（テキスト入力または地図上でピン指定）、備考を登録・編集。保存すると一覧に反映されます
- **危険度アラート通知**：本人の危険度が「危険」以上になった瞬間、端末のローカル通知（`expo-notifications`）でお知らせします。サーバーを介さないため、他の家族の端末には届きません（Webは非対応。Expo Go環境で通知モジュールの読み込みに失敗した場合も、アプリ本体はクラッシュせず通知機能のみ無効化される作りにしています）

### 実装状況

見た目・画面遷移・アプリ内で完結する操作（メンバーの追加/編集/削除、お休みモードの切り替え、通知履歴のフィルタ、写真登録等）は一通り動作します。一方で、以下は未実装のモック/プレースホルダーです。

- 熱中症危険度の算出ロジックは気温・湿度・年齢のみの簡易版（WBGT・活動量・お休みモードを反映した正式仕様は未確定。性別は根拠不十分のため未反映）
- 全メンバーの位置情報は`src/data/mockData.ts`の固定値（祖父母＝福島市、父親＝品川近辺のオフィス街、子供2人＝横浜市の小学校、母親＝同じく横浜市の実家、と分散配置）。以前は本人（`isSelf`のメンバー）のみ`expo-location`で実際の現在地に自動更新していたが、モックデータとの整合性を保つため現在は停止しており固定位置のまま。気温・湿度は、全メンバーそれぞれの固定位置に最も近い気象庁アメダス観測地点の値を使うが、`src/services/amedasWeather.ts`は2026-08-21 14:50 JST時点の固定スナップショット（`src/data/amedasStationTable.json`・`src/data/amedasLatestSnapshot.json`）をテストデータとして返す実装になっており、ネットワークへの再取得は行わない（理由は「今後の実装予定」参照）。家族間で位置情報を共有するバックエンド／リアルタイム通信も未実装
- 気温・湿度は気象庁アメダスの全国データ（テストデータとして固定化済み）を使用（東京都のオープンデータではない）。一方、給水スポット・災害時給水（東京都水道局）、コンビニ・自販機・カフェ（OpenStreetMap）は東京都・実データ連携済み（詳細は「今後の実装予定」参照）
- 実際の地図タイル表示は`expo-maps`導入によりiOS/Androidで実現済み（Web非対応のため、Web版のみ従来通りGoogleマップのスクリーンショット画像をモックとして敷いている。詳細・実装上の制約は[google-maps-integration.md](./google-maps-integration.md)参照）。Android用Google Maps APIキーはリポジトリに含めず`app.json`へ担当者が個別に設定する運用で、実際のキーを設定した上でAndroidエミュレータで実機確認済み（実際の地図タイル・メンバーピン・スポットピンが正しく表示されることを確認）。WBGTタイルの空間分布は環境省の実況値をIDW補間した実データ由来の表示（Web・ネイティブ両方。ネイティブ版は地図の実座標に投影しパン・ズームに追従し、広域表示にも対応。詳細は「今後の実装予定」参照）
- お休みモードの自動解除（位置情報の移動をトリガーにした自動解除）は、実際の位置情報取得を停止したのに伴い未実装に戻っている。通知しきい値・夜間通知OFFの条件設定は表示のみのモック
- 危険度アラート・体力ゲージのリマインダー通知は本人端末へのローカル通知のみ実装済み。「危険度超過を他の家族にも知らせる」には、各メンバーの端末から情報を集約するバックエンドとプッシュ通知配信の仕組みが別途必要
- 通知設定／アプリ設定／データ・その他タブの中身
- メンバー情報・通知履歴はAsyncStorageで端末に永続化されるようになったが、データソース自体はモックのまま（API連携は未着手）

## 技術スタック

- [Expo](https://expo.dev) + [Expo Router](https://docs.expo.dev/router/introduction/)（`src/app` 配下のファイルベースルーティング。`(tabs)`グループ＋ルートStackの構成）
  - ネイティブは`expo-router/unstable-native-tabs`、Webは下部固定タブバーを持たないため`expo-router/ui`のheadless tabsで代替実装（`src/app/(tabs)/_layout.web.tsx`）
- React Native + TypeScript
- [react-native-svg](https://github.com/software-mansion/react-native-svg)（危険度・体力ゲージの円形プログレス表現）
- [lucide-react-native](https://lucide.dev/)（アイコン）
- [expo-maps](https://docs.expo.dev/versions/v57.0.0/sdk/maps/)（iOS/Android版マップ画面の実地図表示。Apple Maps/Google Mapsをネイティブ表示し、その上に自前のピンレイヤーを重ねる構成。アルファ版でWeb非対応・development build必須。Android用Google Maps APIキーは`app.json`の`android.config.googleMaps.apiKey`に別途設定が必要）
- [react-native-gesture-handler](https://docs.swmansion.com/react-native-gesture-handler/) + [react-native-reanimated](https://docs.swmansion.com/react-native-reanimated/)（Web版マップ画面のドラッグ操作、スプラッシュアニメーション。ルート直下を`GestureHandlerRootView`で包む必要があるため`src/app/_layout.tsx`に設置）
- [@react-native-async-storage/async-storage](https://react-native-async-storage.github.io/async-storage/)（メンバー情報・通知履歴を端末に永続化。データソース自体はモックのまま）
- [expo-image-picker](https://docs.expo.dev/versions/latest/sdk/imagepicker/)（メンバー写真のカメラ撮影／アルバム選択。Webは`allowsEditing`が未対応のため、`ImageCropModal.web.tsx`でCanvasベースの独自切り抜きUIを実装）
- [expo-asset](https://docs.expo.dev/versions/latest/sdk/asset/)（モック写真として同梱しているイラスト画像を`require()`からURI文字列に変換。react-native-webは`Image.resolveAssetSource`が未実装のため、ネイティブ／Web両対応のこちらを使用）
- [expo-notifications](https://docs.expo.dev/versions/latest/sdk/notifications/)（本人の危険度アラート・体力ゲージリマインダーの端末ローカル通知。Web未対応のため`src/services/localNotifications.web.ts`でダミー実装に差し替え。Expo Go環境でモジュール読み込みに失敗してもアプリ本体は継続動作するようtry/catchで防御）
- 気象庁アメダス非公式公開JSON（`src/services/amedasWeather.ts`。継続的な直接アクセスは避け、2026-08-21 14:50 JST時点の固定スナップショットをテストデータとして使用）、OpenStreetMap Overpass API（`src/services/overpassSpots.ts`、コンビニ/自販機/カフェ）、東京都水道局のオープンデータCSV（`src/services/tokyoWaterSpots.ts`、給水スポット/災害時給水。東京都オープンデータカタログサイト経由、CC BY 4.0）、環境省熱中症予防情報サイトのWBGT電子情報提供API（`src/services/envWbgt.ts`、都内約10地点の実況値をマップ最寄り地点の参考値・広域ヒートマップ補間の両方に使用）— いずれもAPIキー不要の公開エンドポイント
- [encoding-japanese](https://github.com/polygonplanet/encoding-japanese)（東京都水道局のCSVがShift_JISエンコードのため、バイト列からUnicode文字列への変換に使用。React Native/HermesのTextDecoderはutf-8以外に対応していないため導入）
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
    HomeScreen.tsx / NotificationsScreen.tsx
    SettingsScreen.tsx / MemberFormScreen.tsx / CardDetailScreen.tsx
    MapScreen.tsx（iOS/Android用、expo-mapsの実地図＋自前ピンレイヤー） / MapScreen.web.tsx（Web用、モック地図画像＋独自パン操作）
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
    MembersContext.tsx                 # メンバー一覧の共有state（追加・更新・個別/一括削除・お休み切替・体力ゲージの定期更新・危険度の都度算出・全メンバー分の気温湿度の自動更新（10分間隔）・危険度アラート/体力ゲージ通知の発火・AsyncStorageへの永続化）
    NotificationsContext.tsx            # 通知履歴の共有state（追加・AsyncStorageへの永続化）
  logic/
    riskCalculation.ts                  # 熱中症危険度（スコア・6段階レベル）算出の唯一のロジック
    vitalityGauge.ts                     # 体力ゲージ（0〜100）の増減・危険度カラーへの変換ロジック
  services/
    amedasWeather.ts                     # 気象庁アメダスの固定スナップショット（`src/data/`配下のJSON）から最寄り観測地点の気温・湿度を取得（ネットワーク再取得はしない。関数インターフェースは変更前と同じ）
    overpassSpots.ts                      # OpenStreetMap Overpass APIからコンビニ・自販機・カフェの位置を取得
    tokyoWaterSpots.ts                     # 東京都水道局の給水スポット/災害時給水ステーションCSVを取得
    envWbgt.ts                              # 環境省WBGT実況値APIから都内全地点の実況値取得・最寄り地点検索・IDW補間用のRiskLevel変換
    localNotifications.ts（ネイティブ用） / localNotifications.web.ts（Web用ダミー） # 危険度アラート・体力ゲージリマインダーのローカル通知
  hooks/
    use-area-weather.ts                    # 範囲内のアメダス観測値取得フック
    use-nearby-spots.ts                    # 範囲内のコンビニ・自販機・カフェ取得フック
    use-tokyo-water-spots.ts                # 範囲内の給水スポット・災害時給水ステーション取得フック
    use-nearest-wbgt.ts                      # 地図に最も近いWBGT実況値取得フック（10分間隔で自動再取得）
    use-tokyo-wbgt-grid.ts                    # 都内全地点のWBGT実況値取得フック（広域ヒートマップ用、10分間隔で自動再取得）
  utils/
    crossPlatformAlert.ts                  # react-native-webでAlert.alertが無効なための代替（Web版はwindow.alert/confirm）
    mapProjection.ts                        # 緯度経度の座標変換（Web版：固定MAP_BOUNDS基準の仮想0〜100座標系／ネイティブ版：expo-mapsの現在の表示範囲を基準にした線形補間）
    csv.ts                                   # RFC4180準拠のシンプルなCSVパーサ（オープンデータCSVの解析に使用）
  constants/
    theme.ts                            # 色・余白・Spacing等（唯一の情報源）
    riskConfig.ts                        # 危険度6段階の色・ラベル定義
    mapSpotConfig.ts                      # マップのスポット種別（コンビニ/自販機等）の色・アイコン
  data/
    mockData.ts                           # 開発用モックデータ（メンバー・通知・マップスポット）。メンバー写真はassets/images/members/配下のイラスト画像
    amedasStationTable.json / amedasLatestSnapshot.json  # 気象庁アメダスの固定スナップショット（2026-08-21 14:50 JST時点、テストデータ）。`src/services/amedasWeather.ts`が参照
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
- 全メンバーの位置情報は`src/data/mockData.ts`の固定値です（あえて福島・東京・横浜など離れた場所に分散配置し、位置による危険度の違いを確認できるようにしています）。以前は本人（`isSelf`のメンバー）のみ`expo-location`で実際の現在地を取得していましたが、モックデータとの整合性を優先し現在は停止しています。気温・湿度は全メンバーそれぞれの固定位置に最も近い気象庁アメダス観測地点の値を使いますが、位置情報自体はリアルタイムには動きません。家族全員分の位置をリアルタイムに共有するには、各メンバーの端末から位置情報を送るバックエンド（API・DB）が別途必要です
- 気温・湿度は気象庁アメダスの全国データを使用しています。ただし`www.jma.go.jp/bosai/amedas/...`は気象庁が外部利用向けに仕様公開・保証しているAPIではなく（気象庁自身のサイト描画用の内部JSONを直接叩く「疑似API」的な使い方）、継続的にアクセスし続けるのは望ましくないと判断し、2026-08-21 14:50 JST時点で一度だけ取得したデータをテストデータ（`src/data/amedasStationTable.json`・`src/data/amedasLatestSnapshot.json`）として固定的に使い続ける方針に変更しました（`src/services/amedasWeather.ts`は以後ネットワーク取得を行いません）。「東京都のオープンデータ」を明示的に使う要件がある場合、東京都のデータカタログサイト等が公開するAPI／データセットへの差し替えが必要です
- お休みモードはON/OFF切り替えのみ実装済みです。以前あった「本人が開始地点から300m以上動いたら自動解除」は、実際の位置情報取得の停止に伴い未実装に戻っています。通知しきい値・夜間通知OFFの条件設定も表示のみのモックで、実際の通知と連動していません
- 実際の地図タイル表示は`expo-maps`によりiOS/Android版で導入済みです（`src/screens/MapScreen.tsx`）。検討内容・実装時に判明した制約は[google-maps-integration.md](./google-maps-integration.md)にまとめています。`expo-maps`はカスタムマーカーや座標→画面座標の変換APIを提供しないため、`MapMemberPin`・`MapSpotPin`は地図の上に別レイヤーとして重ね、`onCameraMove`から得る表示範囲をもとに自前の線形補間で位置を計算する非公式構成になっています（地図の傾き操作には追従できません）。Web版は`expo-maps`が非対応のため、従来通りGoogleマップのスクリーンショット画像（`assets/images/map/`）をモックとして敷き、ドラッグで見回せるようにしたままです。またAndroid用のGoogle Maps APIキーはリポジトリに含めていないため、`app.json`に担当者が個別に設定する必要があります（Androidアプリ・パッケージ名＋SHA-1指紋で制限し、Maps SDK for Androidのみに絞ったキーを使用）。実際のキーを設定した上でAndroidエミュレータで実機確認済みで、地図タイル・メンバーピン（体力ゲージリング付き）・給水スポット等の実データピン・WBGT参考バッジがすべて正しく表示されることを確認しています
- マップのWBGTタイル表示（`src/components/MapWbgtTileLayer.tsx`）は、都・日本気象協会が公開している「東京暑さマップ」（1kmメッシュの高解像度WBGT）を使う案を検討しましたが、公式のオープンデータ／公開APIが存在せず、Webアプリ内部の非公開ベクトルタイル配信（gzip圧縮のMapbox Vector Tile、独自のタイル分割方式）を解析しないと使えないため、利用規約上のリスクと仕様変更で壊れるリスクを踏まえ採用を見送りました。代わりに環境省「熱中症予防情報サイト」の公式API（`src/services/envWbgt.ts`、APIキー不要・CORS許可あり）から取得できる都内の実況値（約10地点）を逆距離加重法（IDW、`fetchAllTokyoWbgt`）で補間し、地図の表示範囲全体（ネイティブ版は`onCameraMove`から得る実際のカメラ範囲、Web版は固定の`MAP_BOUNDS`）を覆うタイルとして表示しています。地点数が少ないため都内全域を対象にした高解像度メッシュにはなりませんが、ダミー値ではなく実測値に基づく推定であり、広域表示（都県境をまたぐレベル）にもそのまま追従します。同じ実況値のうち地図に最も近い地点の値は、参考バッジ（`MapWbgtReferenceBadge`）として地点名・距離とともに個別表示しています。ただし都内の提供地点は少なく（練馬・八王子・府中・江戸川臨海など）、この地図が表示する丸の内周辺の近傍には地点が無いため、最寄りでも数km〜10km程度離れた地点の値である旨を明示しています。実況値は`use-tokyo-wbgt-grid.ts`・`use-nearest-wbgt.ts`により10分間隔で自動再取得され、アプリを開いたままでも実際の気象の変化に追従します
- 危険度アラート・体力ゲージのリマインダー通知は、本人端末へのローカル通知（`expo-notifications`）のみ実装済みです。「他の家族にも知らせる」プッシュ通知には、各メンバーの位置・環境情報を集約するバックエンドが別途必要です
- メンバー情報・通知履歴はAsyncStorageで端末に保存されるようになりましたが、データソース自体は依然としてモックです。サーバーAPIとの連携が今後の課題です
- 設定画面の「通知設定」「アプリ設定」「データ・その他」タブは未着手です
- コンビニ・自販機・カフェのピンはOpenStreetMap（Overpass API）、給水スポット・災害時給水のピンは東京都水道局のオープンデータCSV（それぞれShift_JISエンコード、`encoding-japanese`で変換）による実データです。いずれも都内全域が対象のデータを地図の表示範囲でクライアント側に絞り込んで表示しており、CORSの都合でWeb版は取得に失敗しモックへフォールバックすることがあります（ネイティブ版は問題なく取得できます）
- Web版では`react-native-web`の制約に対する回避策をいくつか実装しています（`Alert.alert`が未実装のため`src/utils/crossPlatformAlert.ts`で代替、`Modal`の`animationType`指定がタップ不能なオーバーレイを残すため未指定にする、`router.back()`がリロード後に失敗するため主要な戻る導線は`router.replace()`を使用）。詳細は各ファイルのコメントを参照してください

## その他

- ESLintの設定：`npx expo lint`（詳細は[「Using ESLint and Prettier」](https://docs.expo.dev/guides/using-eslint/)）
- ユニットテスト：[「Unit Testing with Jest」](https://docs.expo.dev/develop/unit-testing/)
- TypeScript設定：[「Using TypeScript」](https://docs.expo.dev/guides/typescript/)
- [Expo ドキュメント](https://docs.expo.dev/) / [Learn Expo チュートリアル](https://docs.expo.dev/tutorial/introduction/)
