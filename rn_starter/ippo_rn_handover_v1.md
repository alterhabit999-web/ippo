# iPPO React Native版 引き継ぎ書
**バージョン**: v1.0
**作成日**: 2026-04-11
**ベース**: Webアプリ版 仕様書v1.9 / 引き継ぎ書v11
**ステータス**: 開発開始前

---

## 1. このドキュメントについて

iPPO（振り返りアプリ）はすでにWebアプリ（React + GitHub Pages）として完成・運用中です。
このドキュメントは、そのiPPOを **React Native（Expo）でネイティブアプリ化** するための引き継ぎ書です。

- **Webアプリ版**：`https://alterhabit999-web.github.io/ippo` で運用継続
- **React Native版**：このプロジェクトで新規開発（iOS / Android対応）
- **Supabaseデータベース**：Web版・RN版で**共通**（同じDBを使う）

---

## 2. アプリ概要

### アプリ名
**iPPO**

### コンセプト
毎日2回・1〜2分で記録し、自分の気分・体調・感情のパターンを可視化するパーソナル振り返りアプリ。
記録の負荷を最小限に抑えながら、蓄積データから自己理解を深めることを目的とする。

### 記録項目

**朝の記録（起床後すぐ・目安60秒）**

| # | 項目名 | 入力形式 |
|---|--------|----------|
| 1 | 睡眠時間 | 数値入力（時間・例：6.5） |
| 2 | 睡眠の質 | 5段階スライダー（1=最悪〜5=最高） |
| 3 | 今朝の気分 | 5段階スライダー |
| 4 | 今朝の体調 | 5段階スライダー |
| 5 | 今日の自分との約束 | テキスト入力（一言） |

**夜の記録（就寝前・目安60〜90秒）**

| # | 項目名 | 入力形式 | 必須 |
|---|--------|----------|------|
| 1 | 今日の気分・感情 | 5段階スライダー | 必須 |
| 2 | エネルギー・生産性 | 5段階スライダー | 必須 |
| 3 | ストレスレベル | 5段階スライダー | 必須 |
| 4 | 今日のHAPPY | テキスト入力 | 任意 |
| 5 | 今日のモヤモヤ | テキスト入力 | 任意 |
| 6 | 明日の自分との約束 | テキスト入力（一言） | 必須 |

---

## 3. Supabase接続情報（Web版と共通）

```
SUPABASE_URL=https://yabcpxespudmuahczccx.supabase.co
SUPABASE_ANON_KEY=（.envファイルまたはSupabaseダッシュボードで確認）
```

### テーブル：records

```sql
create table records (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id),
  date text not null,
  type text not null check (type in ('am', 'pm')),
  sleep_h numeric,
  sleep_q integer,
  morning_mood integer,
  morning_condition integer,
  morning_promise text,
  night_mood integer,
  energy integer,
  stress integer,
  happy text,
  moya text,
  night_promise text,
  created_at timestamptz default now(),
  unique(user_id, date, type)
);
```

### テーブル：quotes

```sql
create table quotes (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) not null,
  text text not null,
  source text default '',
  created_at timestamptz default now()
);
```

### RLSポリシー（設定済み）
- records：自分のデータのみ参照・追加・更新
- quotes：全ユーザーが読み取り可能・書き込みは自分のみ

### Supabase認証
- メールアドレス + パスワード（Supabase Auth）
- `@supabase/supabase-js` パッケージで接続

---

## 4. 画面構成

| 画面名 | 役割 |
|--------|------|
| ログイン画面 | メール・パスワードでの認証 |
| メイン画面 | 記録状態によって2ステートを切り替え（記録前 / 記録後） |
| 朝の記録画面 | 朝5項目の入力フォーム |
| 夜の記録画面 | 夜6項目の入力フォーム |
| 待機画面（DoneScreen） | 記録完了状態・今日の一言ランダム表示・時間帯別フレーズ |
| カレンダー画面 | 日別の記録状況・過去の記録閲覧 |
| インサイト画面 | グラフ・パターン分析 |
| あつめた言葉たち画面 | 引用文の一覧・追加・編集・削除・みんなの言葉 |
| 設定画面 | 通知時刻・CSVエクスポート・ログアウト |

### 画面遷移のポイント
- 時間帯で朝・夜を自動判定（17時境界）
- 記録後は必ず待機画面（DoneScreen）へ遷移
- 全画面の「iPPO」タイトルをタップするとメイン画面（or待機画面）に戻る
- サイドメニューの順番：カレンダー → あつめた言葉たち → インサイト → 設定

---

## 5. デザインシステム

### 朝モード（サンライズオレンジ）
| 役割 | カラー |
|------|--------|
| ページ背景 | `#FFF4E8` |
| カード背景 | `#FFF8F0` |
| サブ背景 | `#FFE8CC` |
| アクセント | `#D45F10` |
| アクセント（明） | `#F0A060` |
| ボーダー | `#EEC898` |
| テキスト | `#3A2A18` |
| テキスト（ミュート） | `#A07850` |

### 夜モード（インクブルー × スカイ）
| 役割 | カラー |
|------|--------|
| ページ背景 | `#1A2028` |
| カード背景 | `#232830` |
| サブ背景 | `#2E3840` |
| アクセント | `#5A8AAA` |
| アクセント（明） | `#A8C8D8` |
| ボーダー | `#343C48` |
| テキスト | `#D8E8EE` |
| テキスト（ミュート） | `#6A7888` |

### タイポグラフィ
- アプリ名・大見出し：Georgia（セリフ体）、letterSpacing 広め
- 本文・入力：System Font（サンセリフ）、weight 400
- ラベル：System Font、weight 500、letterSpacing 広め
- フォントカラーは真っ黒を使わない

### アイコン
- アプリアイコン元画像：`image/icon.png`（512×512px）
- ファビコン元画像：`image/favicon.png`（32×32px）

---

## 6. 待機画面の時間帯別フレーズ（Web版と同仕様）

| 時間帯 | 時間 | フレーズ（5種類からランダム） |
|--------|------|-------------------------------|
| 朝 | 5:00〜11:59 | おはよう、からはじまる一日 / また一歩、踏み出す朝 / 今日のあなたが、ここにいる / 朝が来た、一日が始まる / カーテンを開ける、おひさまを浴びる |
| 昼 | 12:00〜16:59 | ここらでちょっとひと休み / 今日の真ん中にいる / お昼どき、ひと息ついて / 午後も、ひとつずつ / 今日もここまで来た |
| 夕方 | 17:00〜20:59 | 空が染まる、今日もよかった / お疲れさま、家に帰ろう / 夕暮れが、今日を包む / 夕暮れどき、深呼吸して / 帰り道、今日もよかった |
| 夜 | 21:00〜4:59 | 今日も一日、お疲れさま / また一歩、前進した / ゆっくり休もう / 明日はどんな良いことがあるかな / おやすみ、また明日 |

---

## 7. デフォルト引用文（初回ログイン時にシード）

```javascript
const DEFAULT_QUOTES_DATA = [
  { text: "小さな一歩が、やがて大きな道になる。", source: "iPPO" },
  { text: "完璧じゃなくていい。続けることが大切。", source: "iPPO" },
  { text: "今日の自分に、やさしくいよう。", source: "iPPO" },
  { text: "焦らなくていい。一歩ずつ、それがiPPO。", source: "iPPO" },
  { text: "今日も、ちゃんと生きた。", source: "iPPO" },
];
```

---

## 8. Webアプリ版との主な違い（実装時の注意点）

| Web版 | React Native版 |
|-------|----------------|
| `div`, `p`, `span` | `View`, `Text` |
| `button` | `TouchableOpacity` または `Pressable` |
| CSSスタイル（文字列） | `StyleSheet.create()`（オブジェクト） |
| React Router（画面遷移） | React Navigation |
| `input type="range"`（スライダー） | `@react-native-community/slider` |
| `input type="text"` | `TextInput` |
| `input type="number"` | `TextInput` + `keyboardType="decimal-pad"` |
| Service Worker（PWA） | 不要（ネイティブのため） |
| ブラウザのダウンロード（CSV） | `expo-sharing` または `expo-file-system` |
| 通知 UI のみ | `expo-notifications`（本実装） |

---

## 9. 開発環境のセットアップ手順

### 前提条件
- Node.js インストール済み
- Expo CLI のインストール：`npm install -g expo-cli`
- iPhoneで確認する場合：**Expo Go** アプリをApp Storeからインストール

### プロジェクト作成

```bash
npx create-expo-app ippo-native
cd ippo-native
```

### 必要なパッケージのインストール

```bash
# Supabase接続
npm install @supabase/supabase-js

# 画面遷移
npm install @react-navigation/native @react-navigation/native-stack
npx expo install react-native-screens react-native-safe-area-context

# スライダー
npx expo install @react-native-community/slider

# 通知
npx expo install expo-notifications

# CSVエクスポート用
npx expo install expo-file-system expo-sharing

# グラフ（インサイト画面）
npm install react-native-chart-kit react-native-svg
```

### 環境変数の設定
`app.json` または `.env` に以下を追加：

```json
{
  "expo": {
    "extra": {
      "supabaseUrl": "https://yabcpxespudmuahczccx.supabase.co",
      "supabaseAnonKey": "（Supabaseダッシュボードで確認）"
    }
  }
}
```

### 開発サーバー起動

```bash
npx expo start
```

iPhoneのExpo GoアプリでQRコードをスキャンして確認。

---

## 10. 開発の進め方（推奨順序）

1. **プロジェクト作成・Supabase接続確認**
2. **認証画面**（ログイン・新規登録）
3. **メイン画面**（記録前・記録後の切り替え）
4. **朝の記録画面**（スライダー＋テキスト入力）
5. **夜の記録画面**（スライダー＋テキスト入力）
6. **待機画面**（DoneScreen・引用文ランダム表示・時間帯フレーズ）
7. **サイドメニュー**
8. **カレンダー画面**
9. **インサイト画面**（グラフ）
10. **あつめた言葉たち画面**
11. **設定画面**（通知・CSVエクスポート）
12. **プッシュ通知の実装**
13. **App Store申請準備**

---

## 11. App Store申請に必要なもの

- Apple Developer Program（年99ドル）の登録
- アプリアイコン（1024×1024px）→ `image/icon.png` をベースに作成
- スクリーンショット（iPhone各サイズ）
- アプリ説明文・キーワード
- プライバシーポリシーのURL

---

## 12. 参考ファイル（Webアプリ版）

新規開発の参考として以下を確認：

| ファイル | 参照目的 |
|---------|---------|
| `src/App.js` | 全画面のロジック・Supabase処理・デザイン実装の参考 |
| `spec/ippo_spec_v19.md` | 仕様・デザインシステムの詳細 |
| `handover/ippo_handover_v11.md` | Webアプリ版の開発経緯・確定事項 |
| `image/icon.png` | アプリアイコン元画像（512px） |

---

## 13. セッション開始の伝え方

次回Coworkで開発を始める際は以下を伝えてください：

> 「iPPOのReact Native版を開発します。この引き継ぎ書（ippo_rn_handover_v1.md）と仕様書（ippo_spec_v19.md）、そしてWebアプリ版のコード（src/App.js）を確認してください。まず〇〇から始めたいです。」
