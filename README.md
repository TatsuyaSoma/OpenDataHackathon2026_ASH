# 熱中症見守りアプリ「ひといき」

都知事杯 OpenData Hackathon 2026 提出作品。家族それぞれの現在位置と気象庁アメダスの観測データ（気温・湿度）から熱中症の危険度を算出し、家族間で見守り合えるスマートフォンアプリです。

## 仕様概要

- 対応OS：iOS / Android / Web（React Native + TypeScript、Expo Router）
- 家族利用を想定。6人家族（本人=母親・父親・子供2人・祖父母）をサンプルデータとして用意しており、`src/data/mockData.ts`にあえて離れた登録位置（祖父母＝東京都調布市の自宅、父親＝東京都港区のオフィス街、子供2人＝東京都練馬区の小学校、母親＝同じく練馬区の実家）を設定することで、位置ごとに危険度が変わる様子を確認できます
- 気温・湿度は、各メンバーの登録位置に最も近い気象庁アメダス観測地点の値を使用します
- メンバー情報・通知履歴は端末内に保存され、アプリを再起動しても保持されます

### 画面構成

```
(tabs) ボトムタブ
  ├─ ホーム画面
  ├─ マップ画面
  ├─ ミッション（ポップアップ表示）
  ├─ 通知履歴画面
  └─ 設定画面
       ├─ メンバ管理（一覧・追加・編集・並び替え・一括削除）
       ├─ お休みモード（メンバー別ON/OFF）
       ├─ 通知設定
       └─ アプリ設定

タブの上に重ねて表示する画面
  ├─ カード詳細画面（メンバーカードタップで遷移）
  ├─ ミッションポップアップ（ミッションタブから開く、自分の体力回復ミッション一覧）
  └─ メンバ登録／編集画面（新規登録・設定画面からの編集で共用）
```

### 主な機能

- 危険度は **水色→緑→黄色→橙→赤→紫** の6段階（`src/constants/riskConfig.ts`で一元管理）。気温・湿度・年齢から0〜100の連続スコアと6段階レベルを算出します
- **体力ゲージ**：危険度とは別に、その危険な環境にどれだけ耐えているかを表す0〜100のHPバー（`src/logic/vitalityGauge.ts`）。危険度が高い状態が続くと減り、お休み中は回復します。ホーム・カード詳細・マップのピンでは、危険度カラーの円形ゲージをこの体力ゲージで塗りつぶし、中央に危険度スコアを重ねて表示します。ゲージが一定値を下回るたびに水分補給・休憩を促す通知が届き、通知履歴にも記録されます
- **ミッション**：冷たい水を飲む・涼しい場所にいる・冷たいタオルを首に当てる、といった簡単な行動を報告すると体力ゲージが回復するチェックリストです。タブの「ミッション」ボタンからポップアップで開き、画面を切り替えずにその場で報告できます。3つ全部を同時に達成すると追加ボーナスが入り、各ミッションは達成後1時間クールダウンします
- **ホーム画面**：メンバーごとのカード一覧（体力ゲージリング＋危険度スコア表示）、危険者数バナー、画面下部固定のお休みモード導線（本人のお休みON/OFFを画面遷移なしでその場に切り替え）
- **カード詳細画面**：登録情報・現在位置・現在の環境・最終更新時刻・危険度推移グラフを表示します。お休み中のメンバーは危険度バッジが「お休み中」表示に切り替わります。「大丈夫？」は本人以外のメンバーにのみ、「元気！」は本人のメンバーにのみ表示するワンプッシュ返信。通知履歴から開いた場合は、通知発生時点の危険度・位置・時刻をスナップショットとして表示します（現在の状況と異なる旨を明示するバナー付き）。「現在地」カードはiOS/Androidではそのメンバーの位置を中心にした実地図（`expo-maps`）を小さく表示し、タップまたは「マップで確認」ボタンでそのメンバーを中心にマップ画面を開きます
- **マップ画面**：iOS/Androidは`expo-maps`による実際のApple Maps/Google Mapsを表示し、その上にこのアプリ独自のメンバーピン（体力ゲージリング等）・スポットピンを重ねて描画します（詳細は[google-maps-integration.md](./google-maps-integration.md)）。Web版はGoogleマップのスクリーンショット画像（東京駅・丸の内周辺）をベースに、ドラッグして周辺を見回せる仕組みです。表示範囲外に出たメンバー・スポットは画面端に方向バッジ付きで表示され（両版共通）、ネイティブ版はこの矢印バッジをタップすると、そのメンバーの位置へワンタップでカメラがジャンプします。ホーム画面の各メンバーカードの位置情報部分をタップした場合も、同様にそのメンバーを中心にマップ画面が開きます。メンバーアイコン＋体力ゲージリング、お休み中バッジ、コンビニ/自販機/給水スポット/災害時給水/カフェのピン、各レイヤーのON/OFF切り替えに対応。コンビニ・自販機・カフェのピンはOpenStreetMap（Overpass API）、給水スポット・災害時給水のピンは東京都水道局のオープンデータ（「Tokyowater Drinking Station一覧」「給水拠点一覧データ」、CC BY 4.0）の実データを使用しています。WBGT危険度の簡易タイル表示（水色→緑→黄色→橙→赤→紫の色分け・凡例付き）は、環境省「熱中症予防情報サイト」の都内実況値（約10地点）を逆距離加重法（IDW）で補間した実データ由来の表示で、地図の表示範囲全体を覆い、パン・ズームにも追従しながら10分間隔で自動更新されます。マップ左下には同じ実況値のうち地図に最も近い地点の値もバッジ表示します
- **通知履歴画面**：危険度・メンバー・既読状態でのフィルタ、日付ごとのグループ表示、「大丈夫？」「元気」のワンプッシュ返信（カード詳細画面と同じ本人/非本人の出し分けに加え、危険度がやや危険以上の場合のみ「大丈夫？」を表示）。危険度が「注意」以上の通知には、水分補給や休憩などの行動提案を表示します。他メンバーの体力ゲージ低下通知をタップすると、そのメンバーのカード詳細画面が開きます
- **設定画面**：
  - メンバ管理：一覧表示、新規登録・編集画面への導線、並び替え、メンバー個別の削除（編集画面から。本人は削除不可）、一括削除
  - お休みモード：メンバーごとのお休みON/OFF切り替え（実際に他画面にも反映され、体力ゲージの回復ペースにも反映されます）
  - 通知設定：通知を送る危険度のしきい値・通知タイミング・メンバー別の通知有無を設定できます
  - アプリ設定：表示テーマ・気温の表示単位・文字サイズ・ホーム画面のカード並び順・振動フィードバックを設定できます
- **メンバ登録／編集画面**：名前・生年月日（必須）、性別、写真（カメラ撮影／アルバム選択に対応。アルバムから選択した場合は拡大縮小・位置調整できる切り抜きモーダルを経由）、自宅住所（テキスト入力または地図上でピン指定）、備考を登録・編集できます。保存すると一覧に反映されます
- **危険度アラート通知**：本人の危険度が「危険」以上になった瞬間や体力ゲージが一定値を下回った瞬間に、端末のローカル通知（`expo-notifications`）でお知らせします。通知をタップすると、本人向けの通知はミッションのポップアップが、他メンバー向けの通知はそのメンバーのカード詳細画面が開きます

## ディレクトリ構成（抜粋）

```
src/
  app/                        # Expo Routerのルーティング（画面遷移）
    _layout.tsx                 # ルートStack（(tabs) と member/[id], member/new, member/reorder を束ねる）
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
      reorder.tsx                   # メンバの並び替え
  screens/
    HomeScreen.tsx / NotificationsScreen.tsx
    SettingsScreen.tsx / MemberFormScreen.tsx / CardDetailScreen.tsx / MemberReorderScreen.tsx
    MapScreen.tsx（iOS/Android用、expo-mapsの実地図＋自前ピンレイヤー） / MapScreen.web.tsx（Web用、地図スクリーンショット画像＋独自パン操作）
    MissionListScreen.tsx           # ミッションのポップアップ画面
  components/
    MemberCard.tsx / RiskGauge.tsx / RiskBadge.tsx / RiskTrendChart.tsx
    Map*.tsx                        # マップ画面のピン・凡例・表示設定パネル・背景画像・WBGTタイル層
    Notification*.tsx                # 通知履歴の絞り込み・カード（本人/非本人でのボタン出し分け含む）
    QuickReplyBar.tsx                 # カード詳細画面下部の「大丈夫？」「元気！」ワンプッシュ返信
    MissionCard.tsx                    # ミッション一覧カード（カード詳細・ミッションポップアップで共用）
    MemberManagementSection.tsx / RestModeSection.tsx / NotificationSettingsSection.tsx / AppSettingsSection.tsx / SettingsSubTabBar.tsx
    AddressMapPickerModal.tsx         # 自宅住所を地図ピンで指定するモーダル
    PhotoSourceModal.tsx               # 写真登録時のカメラ／アルバム選択モーダル
    ImageCropModal.tsx（ネイティブ用no-op） / ImageCropModal.web.tsx（Web用Canvas切り抜きUI）
    app-tabs.tsx                       # NativeTabsの中身（ネイティブ用。ミッションポップアップの開閉、通知タップ時の画面遷移もここで扱う）
  context/
    MembersContext.tsx                 # メンバー一覧の共有state（追加・更新・個別/一括削除・並び替え・お休み切替・ミッション達成・体力ゲージの定期更新・危険度の都度算出・全メンバー分の気温湿度の自動更新・危険度アラート/体力ゲージ通知の発火・端末への永続化）
    NotificationsContext.tsx            # 通知履歴の共有state（追加・端末への永続化）
  logic/
    riskCalculation.ts                  # 熱中症危険度（スコア・6段階レベル）算出のロジック
    vitalityGauge.ts                     # 体力ゲージ（0〜100）の増減・危険度カラーへの変換ロジック
    missions.ts                          # ミッションの達成状態・クールダウン算出ロジック
  services/
    amedasWeather.ts                     # 気象庁アメダスの観測データから最寄り観測地点の気温・湿度を取得
    overpassSpots.ts                      # OpenStreetMap Overpass APIからコンビニ・自販機・カフェの位置を取得
    tokyoWaterSpots.ts                     # 東京都水道局の給水スポット/災害時給水ステーションCSVを取得
    envWbgt.ts                              # 環境省WBGT実況値APIから都内全地点の実況値取得・最寄り地点検索・IDW補間用のRiskLevel変換
    localNotifications.ts（ネイティブ用） / localNotifications.web.ts（Web用） # 危険度アラート・体力ゲージリマインダーのローカル通知
  hooks/
    use-area-weather.ts                    # 範囲内のアメダス観測値取得フック
    use-nearby-spots.ts                    # 範囲内のコンビニ・自販機・カフェ取得フック
    use-tokyo-water-spots.ts                # 範囲内の給水スポット・災害時給水ステーション取得フック
    use-nearest-wbgt.ts                      # 地図に最も近いWBGT実況値取得フック（10分間隔で自動再取得）
    use-tokyo-wbgt-grid.ts                    # 都内全地点のWBGT実況値取得フック（広域ヒートマップ用、10分間隔で自動再取得）
  utils/
    crossPlatformAlert.ts                  # react-native-webでも使えるアラート表示のユーティリティ
    mapProjection.ts                        # 緯度経度の座標変換（Web版：固定MAP_BOUNDS基準の仮想0〜100座標系／ネイティブ版：expo-mapsの現在の表示範囲を基準にした線形補間）
    csv.ts                                   # RFC4180準拠のシンプルなCSVパーサ（オープンデータCSVの解析に使用）
  constants/
    theme.ts                            # 色・余白・Spacing等（唯一の情報源）
    riskConfig.ts                        # 危険度6段階の色・ラベル定義
    missions.ts                           # ミッションの一覧・回復量・クールダウン時間の定義
    mapSpotConfig.ts                      # マップのスポット種別（コンビニ/自販機等）の色・アイコン
  data/
    mockData.ts                           # サンプルデータ（メンバー・通知・マップスポット）。メンバー写真はassets/images/members/配下のイラスト画像
    amedasStationTable.json / amedasLatestSnapshot.json  # 気象庁アメダスの観測データ。`src/services/amedasWeather.ts`が参照
  types/
    index.ts                               # Member / RiskLevel / NotificationItem 等の型定義
assets/
  images/
    members/                              # メンバー写真のイラスト
    map/                                    # マップ背景として敷いているGoogleマップのスクリーンショット画像
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

> `app.json` の `plugins` に `expo-image-picker`・`expo-location`・`expo-notifications` のカメラ／写真ライブラリ／位置情報／通知用の権限メッセージ（日本語文言）を設定しています。これは[Config Plugin](https://docs.expo.dev/workflow/continuous-native-generation/)によるネイティブ設定のため、実機でこの文言を確認したい場合は[development build](https://docs.expo.dev/develop/development-builds/introduction/)（`npx expo prebuild` または EAS Build）を作成してください。写真選択・撮影・ローカル通知の機能自体はExpo Go上でも動作します。
>
> `npm run android` / `npm run ios` は`expo-dev-client`導入に伴い`expo run:android` / `expo run:ios`（ローカルでのネイティブビルド）になっています。Expo Goで手軽に確認したい場合は、上記の代わりに`npx expo start`から起動してください。

## 実行方法

```bash
npx expo start
```

出力されたオプションから、以下のいずれかでアプリを開けます。

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android エミュレータ](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS シミュレータ](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go)
- Web（`npx expo start --web`）。カメラ撮影・アルバム選択などネイティブAPIに依存する機能を確認する場合は、実機／シミュレータでの確認を推奨します

テーマ関連の修正を反映した直後など、キャッシュが影響していそうな場合は `-c` オプションでキャッシュをクリアして起動してください。

```bash
npx expo start -c
```

`src/app` 配下がファイルベースルーティングのルートです。タブ画面を追加する場合は `src/app/(tabs)/` にファイルを追加し、`src/components/app-tabs.tsx`（ネイティブ）と `src/app/(tabs)/_layout.web.tsx`（Web）の両方にタブを追加してください。

## その他

- ESLintの設定：`npx expo lint`（詳細は[「Using ESLint and Prettier」](https://docs.expo.dev/guides/using-eslint/)）
- ユニットテスト：[「Unit Testing with Jest」](https://docs.expo.dev/develop/unit-testing/)
- TypeScript設定：[「Using TypeScript」](https://docs.expo.dev/guides/typescript/)
- [Expo ドキュメント](https://docs.expo.dev/) / [Learn Expo チュートリアル](https://docs.expo.dev/tutorial/introduction/)
