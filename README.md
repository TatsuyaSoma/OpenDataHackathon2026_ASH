# 家族の熱中症見守り

都知事杯 OpenData Hackathon 2026 提出作品。家族それぞれの現在位置と東京都のオープンデータ（気温・湿度）から熱中症の危険度をリアルタイムに算出し、家族間で見守り合えるスマートフォンアプリです。

## 仕様概要

- 対応OS：iOS / Android（React Native + TypeScript、Expo Router）
- 家族利用を想定。作成期間2週間程度のモックレベル実装
- 環境データは東京都が公開しているオープンデータ（気温・湿度）を利用

### 画面構成

```
ホーム画面 ── カード詳細画面
         ├─ マップ画面
         ├─ 通知履歴画面
         ├─ 設定画面 ── メンバ編集
         └─ お休みモード設定
```

### 主な機能

- メンバーごとにリアルタイムで現在位置を取得し、現在地の環境（気温・湿度）と個別情報（年齢・性別）から熱中症の危険度を算出
- 危険度は **水色→緑→黄色→橙→赤→紫** の6段階で表示し、閾値超過時は他メンバーへ通知
- **ホーム画面**：メンバーごとのカード一覧、現在の危険者数バナー、お休みモード（位置が動くと自動解除）
- **カード詳細画面**：登録情報・現在位置・現在の環境・最終更新時刻
- **マップ画面**：メンバーアイコン＋危険度リング表示、お休み中アイコン、自販機/コンビニ等のピン、メンバー別ヒートマップ（年齢等に応じて内容変化）、レイヤーのON/OFF切り替え
- **通知履歴画面**：危険度・メンバーでのフィルタ、過去1か月分の表示、「大丈夫？」「元気」のワンプッシュ返信
- **設定画面**：見守り対象メンバーの登録・編集・削除（名前・年齢必須、性別・写真・自宅住所）

現在実装済みなのはホーム画面のみです（`src/screens/HomeScreen.tsx` 以下）。他画面は今後実装予定です。

## 技術スタック

- [Expo](https://expo.dev) + [Expo Router](https://docs.expo.dev/router/introduction/)（`src/app` 配下のファイルベースルーティング）
- React Native + TypeScript
- [react-native-svg](https://github.com/software-mansion/react-native-svg)（危険度ゲージの円形プログレス表示）
- [lucide-react-native](https://lucide.dev/)（アイコン）
- react-native-reanimated / react-native-worklets（スプラッシュアニメーション）

## ディレクトリ構成（抜粋）

```
src/
  app/                 # Expo Routerのルーティング（画面遷移）
    _layout.tsx
    index.tsx            # ホーム画面のエントリ
  screens/
    HomeScreen.tsx        # ホーム画面本体
  components/
    MemberCard.tsx          # メンバーカード
    RiskGauge.tsx             # 円形の危険度ゲージ
    RiskBadge.tsx              # 危険度ラベルバッジ
    AlertBanner.tsx             # 「現在の危険者：n名」バナー
    RestModeBar.tsx               # お休みモード設定バー
    app-tabs.tsx                   # 下部タブ（NativeTabs）
  constants/
    theme.ts                        # 色・余白・Spacing等（唯一の情報源）
    riskConfig.ts                    # 危険度6段階の色・ラベル定義
  data/
    mockData.ts                       # 開発用モックデータ
  types/
    index.ts                           # Member / RiskLevel 等の型定義
```

## セットアップ

1. 依存パッケージのインストール

   ```bash
   npm install
   ```

2. 本プロジェクト固有の追加パッケージ（危険度ゲージ・アイコン表示に使用）

   ```bash
   npx expo install react-native-svg
   npm install lucide-react-native
   ```

## 実行方法

```bash
npx expo start
```

出力されたオプションから、以下のいずれかでアプリを開けます。

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android エミュレータ](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS シミュレータ](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go)

テーマ関連の修正を反映した直後など、キャッシュが影響していそうな場合は `-c` オプションでキャッシュをクリアして起動してください。

```bash
npx expo start -c
```

`src/app` 配下がファイルベースルーティングのルートです。画面を追加する場合は `src/app` にファイルを追加し、必要に応じて `src/components/app-tabs.tsx` にタブを追加してください。

## 既知の注意点・今後の実装予定

- 危険度算出ロジック（GPS位置 × 東京都オープンデータの気温・湿度 × 年齢・性別）は未実装で、現状は `src/data/mockData.ts` の固定値を表示しています
- マップ画面・通知履歴画面・設定画面は未実装です
- プッシュ通知（危険度超過時の家族間通知、お休みモードの自動解除・通知からの設定）はネイティブ側の実装が必要です
- `react-native-worklets` の `scheduleOnRN` は Expo SDK 57 まわりの動作検証中のため、`src/components/animated-icon.tsx` では一時的に `setVisible` の直接呼び出しに置き換えています

## その他

- ESLintの設定：`npx expo lint`（詳細は[「Using ESLint and Prettier」](https://docs.expo.dev/guides/using-eslint/)）
- ユニットテスト：[「Unit Testing with Jest」](https://docs.expo.dev/develop/unit-testing/)
- TypeScript設定：[「Using TypeScript」](https://docs.expo.dev/guides/typescript/)
- [Expo ドキュメント](https://docs.expo.dev/) / [Learn Expo チュートリアル](https://docs.expo.dev/tutorial/introduction/)
