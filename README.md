# 家族の熱中症見守り

都知事杯 OpenData Hackathon 2026 提出作品。家族それぞれの現在位置と東京都のオープンデータ（気温・湿度）から熱中症の危険度をリアルタイムに算出し、家族間で見守り合えるスマートフォンアプリです。

## 仕様概要

- 対応OS：iOS / Android（React Native + TypeScript、Expo Router）
- 家族利用を想定。作成期間2週間程度のモックレベル実装
- 環境データは東京都が公開しているオープンデータ（気温・湿度）を利用予定（現状は未連携）

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

- 危険度は **水色→緑→黄色→橙→赤→紫** の6段階（`src/constants/riskConfig.ts`で一元管理）
- **ホーム画面**：メンバーごとのカード一覧、危険者数バナー、お休みモード導線
- **カード詳細画面**：登録情報・現在位置・現在の環境・最終更新時刻・危険度推移グラフ。通知履歴から開いた場合は、通知発生時点の危険度・位置・時刻をスナップショットとして表示（現在の状況と異なる旨を明示するバナー付き）
- **マップ画面**：メンバーアイコン＋危険度リング、お休み中バッジ、コンビニ/自販機/給水スポット/カフェのピン、メンバー別ヒートマップ（年齢に応じて範囲が変化）、各レイヤーのON/OFF切り替え、ヒートマップ基準メンバーの選択
- **通知履歴画面**：危険度・メンバー・既読状態でのフィルタ、日付ごとのグループ表示、「大丈夫？」「元気」のワンプッシュ返信
- **設定画面**：
  - メンバ管理：一覧表示、新規登録・編集画面への導線、一括削除（実際にメンバー一覧から削除されます）
  - お休みモード：メンバーごとのお休みON/OFF切り替え（実際に他画面にも反映されます）、自動解除条件（位置連動・通知しきい値30分単位・夜間通知OFF時間帯）※これらの条件設定自体は表示のみのモックです
- **メンバ登録／編集画面**：名前・生年月日（必須）、性別、写真（カメラ撮影／アルバム選択に対応）、自宅住所（テキスト入力または地図上でピン指定）、備考を登録・編集。保存すると一覧に反映されます

### 実装状況

見た目・画面遷移・アプリ内で完結する操作（メンバーの追加/編集/削除、お休みモードの切り替え、通知履歴のフィルタ等）は一通り動作します。一方で、以下は未実装のモック/プレースホルダーです。

- 熱中症危険度の算出ロジック（気温・湿度・年齢等からの計算）
- 実際の位置情報取得（`expo-location`未導入）と、それに伴うお休みモードの自動解除
- 東京都オープンデータとの連携（気温・湿度は`src/data/mockData.ts`の固定値）
- 地図タイル表示（マップ画面・地図でピン指定は簡易的なプレースホルダー背景）
- プッシュ通知の配信、通知設定／アプリ設定／データ・その他タブの中身
- データの永続化（メンバー情報は`MembersContext`のメモリ上のstateのみで、アプリを再読み込みすると初期モックデータに戻ります）

## 技術スタック

- [Expo](https://expo.dev) + [Expo Router](https://docs.expo.dev/router/introduction/)（`src/app` 配下のファイルベースルーティング。`(tabs)`グループ＋ルートStackの構成）
  - ネイティブは`expo-router/unstable-native-tabs`、Webは下部固定タブバーを持たないため`expo-router/ui`のheadless tabsで代替実装（`src/app/(tabs)/_layout.web.tsx`）
- React Native + TypeScript
- [react-native-svg](https://github.com/software-mansion/react-native-svg)（危険度ゲージの円形プログレス、マップのヒートマップ表現）
- [lucide-react-native](https://lucide.dev/)（アイコン）
- [expo-image-picker](https://docs.expo.dev/versions/latest/sdk/imagepicker/)（メンバー写真のカメラ撮影／アルバム選択）
- React Context（`src/context/MembersContext.tsx`）によるメンバー一覧の画面間共有state
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
    Notification*.tsx                # 通知履歴の絞り込み・カード
    MemberManagementSection.tsx / RestModeSection.tsx / SettingsSubTabBar.tsx
    AddressMapPickerModal.tsx         # 自宅住所を地図ピンで指定するモーダル
    app-tabs.tsx                       # NativeTabsの中身（ネイティブ用）
  context/
    MembersContext.tsx                 # メンバー一覧の共有state（追加・更新・削除・お休み切替）
  constants/
    theme.ts                            # 色・余白・Spacing等（唯一の情報源）
    riskConfig.ts                        # 危険度6段階の色・ラベル定義
    mapSpotConfig.ts                      # マップのスポット種別（コンビニ/自販機等）の色・アイコン
  data/
    mockData.ts                           # 開発用モックデータ（メンバー・通知・マップスポット）
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

> ⚠️ `app.json` の `plugins` に `expo-image-picker` のカメラ／写真ライブラリ用の権限メッセージ（日本語文言）を設定していますが、これは[Config Plugin](https://docs.expo.dev/workflow/continuous-native-generation/)によるネイティブ設定の変更のため、**Expo Goには反映されません**（Expo Goは事前ビルド済みアプリのため、標準の権限メッセージのまま動作します）。この文言を実機で確認したい場合は、[development build](https://docs.expo.dev/develop/development-builds/introduction/)（`npx expo prebuild` または EAS Build）を作成してください。写真選択・撮影機能自体はExpo Go上でも動作します。

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

- 危険度算出ロジック（GPS位置 × 東京都オープンデータの気温・湿度 × 年齢・性別）は未実装で、現状は `src/data/mockData.ts` の固定値を表示しています
- 実際の位置情報取得（`expo-location`）は未導入のため、お休みモードの自動解除・マップ上の現在地表示は動作しません
- プッシュ通知（危険度超過時の家族間通知、お休みモードの自動解除・通知からの設定）はネイティブ側の実装が必要です
- メンバー情報は`MembersContext`のメモリ上stateのみで永続化されません。API連携・端末保存の導入が今後の課題です
- 設定画面の「通知設定」「アプリ設定」「データ・その他」タブ、および「メンバーの並び替え」機能は未着手です
- `react-native-worklets` の `scheduleOnRN` は Expo SDK 57 まわりの動作検証中のため、`src/components/animated-icon.tsx` では一時的に `setVisible` の直接呼び出しに置き換えています

## その他

- ESLintの設定：`npx expo lint`（詳細は[「Using ESLint and Prettier」](https://docs.expo.dev/guides/using-eslint/)）
- ユニットテスト：[「Unit Testing with Jest」](https://docs.expo.dev/develop/unit-testing/)
- TypeScript設定：[「Using TypeScript」](https://docs.expo.dev/guides/typescript/)
- [Expo ドキュメント](https://docs.expo.dev/) / [Learn Expo チュートリアル](https://docs.expo.dev/tutorial/introduction/)
