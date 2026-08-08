# 家族の熱中症見守り - ホーム画面デモ

都知事杯 OpenData Hackathon 提出用デモアプリのホーム画面実装です。React Native + TypeScript で構築しています。

## セットアップ

```bash
# 依存パッケージ
npm install
npm install react-native-svg lucide-react-native react-native-svg-transformer

# Expo を利用する場合
npx expo install react-native-svg
```

- 円形ゲージ表示に `react-native-svg` を使用しています。
- アイコンは `lucide-react-native` を使用しています（ハンバーガー・ベル・地図ピン・ベッドなど、モックのUIに合わせたシンプルな線画アイコン）。

## ディレクトリ構成

```
src/
  types/            # Member / RiskLevel などの型定義
  constants/
    riskConfig.ts    # 危険度6段階（水色〜紫）の色・ラベル定義
    theme.ts          # 共通カラー・余白
  data/
    mockData.ts        # ホーム画面表示用のモックデータ（イメージ図に準拠）
  components/
    RiskGauge.tsx       # 円形の危険度ゲージ（react-native-svg）
    RiskBadge.tsx        # 危険度ラベルのバッジ
    MemberCard.tsx        # メンバー1人分のカード
    AlertBanner.tsx        # 「現在の危険者：n名」バナー
    RestModeBar.tsx         # お休みモード設定バー
    BottomTabBar.tsx         # 下部タブバー（見た目のみのモック）
  screens/
    HomeScreen.tsx           # ホーム画面本体
App.tsx                       # ホーム画面単体で動作確認するためのエントリポイント
```

## 今後の実装で置き換える想定の箇所

- `BottomTabBar` → `@react-navigation/bottom-tabs` の Tab Navigator
- `App.tsx` の直接呼び出し → `NavigationContainer` + Stack Navigator（ホーム/カード詳細/マップ/通知履歴/設定）
- `mockData.ts` → 各メンバーの現在位置（GPS）＋ 東京都オープンデータ（気温・湿度）から算出した実データ
- 危険度算出ロジック（`riskLevel` の決定）は、現状メンバーごとに固定値。実装時は
  「現在位置の気温・湿度（東京都オープンデータ）」×「年齢・性別」から WBGT 相当の指標を計算し、
  `RiskLevel` の6段階（`safeLight` 〜 `severe`）にマッピングするロジックを別モジュールとして追加予定です。
- 通知（プッシュ通知）連携、お休みモードの自動解除（位置情報の変化検知）はネイティブ側の実装が必要です。

## 補足

- カードの枠色は危険度が「危険」「非常に危険」の場合に赤枠でハイライトされます（お休み中は除く）。
- 「現在の危険者：n名」のバナーは、危険者が1人以上いる場合のみ表示されます。
