# 振り返りアプリ 仕様書
**バージョン**: v1.8
**作成日**: 2026-04-08
**更新日**: 2026-04-10
**ステータス**: 開発中・運用中

---

## 1. プロダクト概要

### アプリ名
**iPPO**

### コンセプト
毎日2回・1〜2分で記録し、自分の気分・体調・感情のパターンを可視化するパーソナル振り返りアプリ。記録の負荷を最小限に抑えながら、蓄積データから自己理解を深めることを目的とする。

### ターゲットユーザー
- まず自分自身（個人利用）・知人への共有
- 将来的：自己理解・セルフケアに関心を持つ一般ユーザー

### 目標
- フェーズ1：個人用Webアプリの完成・運用 → **完了**
- フェーズ1.5：PWA対応 → **完了**
- フェーズ2：アプリストア（App Store / Google Play）へのローンチ

---

## 2. 記録項目定義（確定版）

### 朝の記録（起床後すぐ・目安60秒）

| # | 項目名 | 入力形式 | 説明 |
|---|--------|----------|------|
| 1 | 睡眠時間 | 数値入力（時間） | 昨夜の睡眠時間（例：6.5） |
| 2 | 睡眠の質 | 5段階スライダー | 1=最悪 〜 5=最高 |
| 3 | 今朝の気分 | 5段階スライダー | 1=最悪 〜 5=最高 |
| 4 | 今朝の体調 | 5段階スライダー | 1=最悪 〜 5=最高 |
| 5 | 今日の自分との約束 | テキスト入力（一言） | 今日大切にしたい一つのこと |

### 夜の記録（就寝前・目安60〜90秒）

| # | 項目名 | 入力形式 | 必須 | 説明 |
|---|--------|----------|------|------|
| 1 | 今日の気分・感情 | 5段階スライダー | 必須 | 1=最悪 〜 5=最高 |
| 2 | エネルギー・生産性 | 5段階スライダー | 必須 | 1=低い 〜 5=高い |
| 3 | ストレスレベル | 5段階スライダー | 必須 | 1=なし 〜 5=強い |
| 4 | 今日のHAPPY | テキスト入力 | 任意 | 今日あったポジティブなこと |
| 5 | 今日のモヤモヤ | テキスト入力 | 任意 | 今日あったネガティブなこと |
| 6 | 明日の自分との約束 | テキスト入力（一言） | 必須 | 明日の自分へのメッセージ |

---

## 3. 画面構成

### 3-1. 画面一覧

| 画面名 | 種別 | 役割 |
|--------|------|------|
| ログイン画面 | 起動時 | メール・パスワードでの認証 |
| メイン画面 | 常時表示 | 記録状態によって3ステートを切り替え |
| 朝の記録画面 | メインから遷移 | 朝5項目の入力フォーム |
| 夜の記録画面 | メインから遷移 | 夜6項目の入力フォーム |
| 待機画面（DoneScreen） | 記録後 | 記録完了状態・今日の一言表示・言葉をあつめるボタン |
| カレンダー画面 | サイドメニューから | 日別の記録状況・過去の記録閲覧 |
| インサイト画面 | サイドメニューから | グラフ・パターン分析・傾向表示 |
| あつめた言葉たち画面 | サイドメニューから | 登録した「今日の一言」一覧・追加・編集・削除・みんなの言葉 |
| 設定画面 | サイドメニューから | 通知時刻・データ・ログアウト |

### 3-2. ログイン画面
- メールアドレス + パスワードで認証
- 「アカウントをお持ちでない方」で新規登録モードに切り替え
- 新規登録時は確認メールが送信される（設定でOFF可能）
- 認証はSupabase Authが担当

### 3-3. メイン画面の3ステート

#### ステート1：記録待ち（未記録）
- 画面中央にボタン一つのみ表示。ボタン内テキストは "Morning"（朝）/ "Night"（夜）のみ
- 時間帯によって朝・夜を自動判定（17時境界）
- 朝モード：ウォームオレンジベース × 白カード配色
- 夜モード：深夜ブルー × ラベンダー配色

#### ステート2：記録画面
- ステート1のボタンを押すと遷移
- 項目を縦に並べたシンプルなフォーム
- スライダー（5段階）＋テキスト入力の構成
- 「記録する」ボタンで保存（非同期）→ **待機画面（DoneScreen）へ遷移**
- 保存中は「保存中...」表示でボタンを無効化

#### ステート3：待機画面（DoneScreen）
- 今日の記録が完了している状態
- 画面中央に「今日の一言」をランダム表示（quotesテーブルから取得）
- 「別の言葉を見る」ボタンで別の一言を表示
- 「言葉をあつめる」ボタンでモーダル入力（言葉・出典を登録）
  - モーダルデザイン：画面中央・最大高さ65vh・borderRadius 20px・スクロール対応
- 左上のハンバーガーメニュー（☰）でサイドメニューを開く

### 3-4. サイドメニュー
- 画面左からスライドイン
- メニュー項目（順番）：**カレンダー → あつめた言葉たち → インサイト → 設定**
- 「iPPO」タイトルをタップするとメイン画面（記録前）or 待機画面（記録後）へ戻る

### 3-5. 全画面共通：iPPOタイトルのナビゲーション
- TopBar（全画面）とSideMenu内の「iPPO」文字をタップするとメイン画面に戻る
- 記録済み状態なら待機画面（DoneScreen）、未記録なら記録前のメイン画面

### 3-6. サブ画面の詳細

#### カレンダー画面
- 月カレンダー（グリッド形式）、左右矢印で月移動
- ドット表示：オレンジ（朝）・水色（夜）
- 記録済みの日をタップで詳細パネル表示（画面中央のフローティングダイアログ）
  - Morning / Night タブで切り替え
  - 背景色はタブの時間帯に合わせた配色（朝：オレンジ系、夜：ブルー系）
  - 半透明のオーバーレイ上に最大高さ65vh・スクロール対応

#### インサイト画面
- 期間切替：7日 / 30日 / 全期間
- グラフ①：気分・エネルギー・ストレスの折れ線グラフ
- グラフ②：睡眠時間の推移
- グラフ③：睡眠時間との相関性（3軸散布図）
- 上部に期間平均サマリーカード

#### あつめた言葉たち画面
- 「今日の一言」として使う言葉の一覧（Supabaseの quotesテーブルから取得）
- データはユーザーごとに独立（user_idフィルター）
- 追加・編集（テキスト・出典）・削除がすべて可能（デフォルト言葉も含む）
- 待機画面の「言葉をあつめる」ボタンからも追加可能（同デザインのモーダル）
- 「+ 言葉を追加する」ボタンからも追加可能
- **「みんなの言葉」セクション**：
  - 他ユーザーが登録した言葉（出典がiPPOのもの・自分の言葉を除く）からランダムで1件表示
  - 「＋」ボタンを押すと自分のquotesに追加（自分のDBに既存の言葉と重複する場合は弾く）

#### 設定画面
- 通知：朝・夜のトグル＋時刻変更（UI実装済み・実際の通知はReact Native化後）
- データ：CSVエクスポートボタン（実装済み）
- アカウント：ログアウトボタン

---

## 4. 通知仕様

| 通知 | タイミング | デフォルト時刻 | 内容 |
|------|-----------|--------------|------|
| 朝のリマインダー | 毎日朝 | 7:00 AM | 「おはようございます。今日の朝の記録をしましょう」 |
| 夜のリマインダー | 毎日夜 | 10:00 PM | 「今日もお疲れさまでした。夜の記録をしましょう」 |

※ 通知機能はReact Native化後に本実装予定。UIのトグル・時刻設定のみ実装済み。

---

## 5. データ設計

### テーブル1：records（Supabase）

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
  unique(user_id, date, type)  -- ユーザーごとに日付+タイプで一意
);
```

**重要**: UNIQUE制約は `(user_id, date, type)` の3カラム複合。複数ユーザーが同じ日付・タイプで記録できる。

```sql
-- Supabase SQL Editorで実行済み（複数ユーザー対応のため変更）
ALTER TABLE records DROP CONSTRAINT IF EXISTS records_date_type_key;
ALTER TABLE records ADD CONSTRAINT records_user_date_type_unique UNIQUE (user_id, date, type);
```

### テーブル2：quotes（Supabase）

```sql
create table quotes (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) not null,
  text text not null,
  source text default '',
  created_at timestamptz default now()
);
```

#### RLSポリシー（quotes）

```sql
-- RLS有効化
ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;

-- 全認証ユーザーが読み取り可能（みんなの言葉機能のため）
CREATE POLICY "認証ユーザーは全件参照可能"
  ON quotes FOR SELECT
  TO authenticated
  USING (true);

-- 自分のデータのみ追加・更新・削除
CREATE POLICY "自分のデータのみ追加" ON quotes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "自分のデータのみ更新" ON quotes FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "自分のデータのみ削除" ON quotes FOR DELETE TO authenticated USING (auth.uid() = user_id);
```

### RLSポリシー（records）

```sql
-- RLS有効化済み
ALTER TABLE records ENABLE ROW LEVEL SECURITY;

-- 自分のデータのみ参照・追加・更新
CREATE POLICY "自分のデータのみ参照" ON records FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "自分のデータのみ追加" ON records FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "自分のデータのみ更新" ON records FOR UPDATE USING (auth.uid() = user_id);
```

### 保存方式（records）
- upsert（`onConflict: "user_id,date,type"`）で同一ユーザーの同日重複を防ぐ
- 保存時に `user_id`（ログイン中ユーザーのID）を付与

### quotesのデータフロー
- 初回ログイン時：DEFAULT_QUOTES_DATA（5件・source="iPPO"）をSupabaseにシード
- 読み込み：`loadQuotes(userId)` — `user_id` フィルター付きで自分の言葉のみ取得
- みんなの言葉：`loadRandomOtherQuote(userId, myTexts)` — 他ユーザー・非iPPO・自分と重複しない言葉をランダム取得
- 追加・更新・削除：Supabaseに直接書き込み

### デフォルト言葉（シード）

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

## 6. 技術方針（フェーズ別）

### フェーズ1：個人用Webアプリ → **完了・運用中**
- **プラットフォーム**：Webアプリ（スマホブラウザで動作）
- **技術**：React + Supabase（認証・クラウド保存・RLS）
- **公開URL**：`https://alterhabit999-web.github.io/ippo`

### フェーズ1.5：PWA対応 → **完了**
- **プラットフォーム**：ホーム画面追加（疑似ネイティブ）
- **技術**：manifest.json + Service Worker（sw.js）+ apple-touch-icon
- **アイコン**：太極図デザイン（YANG: `#F0A060`オレンジ、YIN: `#5A8AAA`スチールブルー）
- **ホーム画面追加方法**：SafariでURLを開く → 「共有」→「ホーム画面に追加」

### フェーズ2：ネイティブアプリ化（次フェーズ）
- **プラットフォーム**：iOS / Android
- **技術候補**：React Native（Expo）
- **追加機能**：プッシュ通知、オフライン対応、App Store / Google Play申請
- **工数**：大（コードの大部分を書き直し）

### フェーズ3：ローンチ・拡張
- 一般ユーザー向けの拡張
- AIによる週次インサイト生成（Claude API活用）
- プレミアム機能の検討

---

## 7. デザインシステム（確定）

### カラーパレット

#### 朝モード（サンライズオレンジ）
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

#### 夜モード（インクブルー × スカイ）
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
- アプリ名・大見出し：Georgia（セリフ体）、letter-spacing 広め
- 本文・入力：サンセリフ、weight 400
- ラベル：サンセリフ、weight 500、letter-spacing 広め
- フォントカラーは真っ黒を使わない

### アイコン・PWAデザイン

| ファイル | サイズ | 内容 |
|---------|--------|------|
| `public/favicon.ico` | 32×32px | 太極図デザイン |
| `public/logo192.png` | 192×192px | 太極図デザイン（PWA Android） |
| `public/logo512.png` | 512×512px | 太極図デザイン（PWA高解像度） |
| `public/apple-touch-icon.png` | 180×180px | 太極図デザイン（iOS） |

**太極図カラー**：
- YANG（右半分）：`#F0A060`（ソフトオレンジ）
- YIN（左半分）：`#5A8AAA`（スチールブルー）
- テキスト "iPPO" on YANG：`#5A8AAA`
- テキスト "iPPO" on YIN：`#FFF4E8`
- 背景：`#FFF4E8`（朝モード背景色）

---

## 8. 開発・運用環境

### 構成

| 項目 | 内容 |
|------|------|
| 公開URL | `https://alterhabit999-web.github.io/ippo` |
| コード管理 | GitHub（Public）`https://github.com/alterhabit999-web/ippo` |
| データ | Supabase `https://yabcpxespudmuahczccx.supabase.co` |
| ホスティング | GitHub Pages |
| 開発ツール | Cowork（コード編集）+ Mac標準ターミナル |

### ファイル構成

| ファイル | 内容 |
|---------|------|
| `src/App.js` | メインコード（全画面・認証・Supabase接続） |
| `src/index.js` | Reactエントリポイント + Service Worker登録 |
| `public/index.html` | ブラウザタイトル「iPPO」・ビューポート・PWA metaタグ |
| `public/favicon.ico` | ブラウザタブのアイコン（太極図） |
| `public/logo192.png` | PWAアイコン 192px（太極図） |
| `public/logo512.png` | PWAアイコン 512px（太極図） |
| `public/apple-touch-icon.png` | iOSホーム画面アイコン（太極図） |
| `public/manifest.json` | PWA設定（アプリ名・アイコン・表示モード・テーマカラー） |
| `public/sw.js` | Service Worker（オフラインキャッシュ・Supabase除外） |
| `src/App.css` | 全画面表示CSS |
| `.env` | Supabase接続情報（GitHubには上げない） |
| `package.json` | GitHub Pages デプロイ設定済み |

### .env の内容（ローカルのみ保持）

```
REACT_APP_SUPABASE_URL=https://yabcpxespudmuahczccx.supabase.co
REACT_APP_SUPABASE_ANON_KEY=（Supabaseダッシュボードで確認）
```

---

## 9. 開発フロー

### 通常の開発手順

1. **Coworkで修正を依頼**（「〇〇を直して」と伝えるだけ）
2. **Coworkがコードを編集**
3. **ターミナルでデプロイ**：

```bash
cd ~/Documents/App/ippo
npm run deploy
```

4. **URLで確認**：`https://alterhabit999-web.github.io/ippo`

### ローカルで動作確認したい場合

```bash
cd ~/Documents/App/ippo
npm start
```

ブラウザで `http://localhost:3000` が開く。

---

## 10. 認証・アカウント管理

### ログイン方法
- メールアドレス + パスワード
- 新規登録時は確認メールが届く

### 確認メールを無効化したい場合
1. [supabase.com](https://supabase.com) → `ippo` プロジェクト
2. 左メニュー「**Authentication**」→「**Providers**」→「**Email**」
3. 「**Confirm email**」のトグルを **OFF** にして保存

### ユーザーを追加したい場合（知人に使ってもらう）
- URLを共有するだけでOK
- 各自でアカウントを作成（「アカウントをお持ちでない方」から登録）
- RLSにより、自分のデータは自分のみ閲覧可能
- quotesは全ユーザーが読み取り可能（みんなの言葉機能のため）・書き込みは自分のみ

---

## 11. 次回の開発計画

### React Native（Expo）化
通知機能・App Store申請のためのフル対応

**Expo** を使うと比較的スムーズにReact → React Native移行が可能。
- 主な変更点：
  - `div` → `View`、`p/span` → `Text`、`button` → `TouchableOpacity`
  - CSSスタイル → StyleSheet API
  - Supabase接続はそのまま使用可能
  - React Router不要（React Navigationに変更）
- **App Store申請**：Apple Developer Program（年99ドル）が必要
- **Google Play申請**：Google Play Console（初回25ドル）が必要

**インサイト画面の充実**（データが蓄積されたタイミングで実装）
- 現状のグラフ機能を維持しつつ、より詳細な傾向分析を追加予定

---

## 12. 将来追加機能メモ

- [ ] HAPPY/モヤモヤのキーワード分析
- [ ] AIによる週次インサイト生成（Claude API活用）
- [ ] 通知機能（React Native化後に本実装）

## 13. 未決定事項

- [ ] 将来的なマネタイズ方針
- [ ] App Store申請タイミング

---

## 変更履歴

| バージョン | 日付 | 内容 |
|-----------|------|------|
| v1.0 | 2026-04-08 | 設定画面UI確定・全サブ画面が揃いプロトタイプv1.0完成 |
| v1.4 | 2026-04-08 | localStorage対応・データ保存実装完了 |
| v1.5 | 2026-04-09 | Supabase移行完了・CSVエクスポート実装済み |
| v1.6 | 2026-04-09 | GitHub Pages公開・認証（メール+パスワード）・RLS設定完了・開発環境をCoworkに移行 |
| v1.7 | 2026-04-09 | 「あつめた言葉たち」画面追加・「言葉をあつめる」ボタン（待機画面）・iPPOタイトルナビゲーション・サイドメニュー順序変更・カレンダー詳細パネルをフローティングダイアログに変更 |
| v1.8 | 2026-04-10 | quotesテーブルDB化・みんなの言葉機能・複数ユーザー対応（records UNIQUE制約変更）・デフォルト言葉のiPPO出典＋削除可能化・記録後の遷移を待機画面に修正・言葉追加ウィンドウのデザイン統一・PWA対応（manifest・sw.js・アイコン太極図デザイン・iOS metaタグ）・ブラウザタイトル変更 |
