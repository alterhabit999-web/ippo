# iPPO 引き継ぎ書
**作成日**: 2026-04-08
**更新日**: 2026-04-11
**仕様書バージョン**: v1.9

---

## 1. プロジェクト概要

毎日朝・夜2回、1〜2分で記録する自己振り返りアプリ。気分・体調・睡眠・感情のパターンを蓄積・可視化し、自己理解を深めることが目的。GitHub Pages + Supabaseで運用中。PWA対応済み（iPhoneのホーム画面から直接起動可能）。最終的にApp Store / Google Playへのローンチを目指す。

---

## 2. 作業サマリー（全セッション）

| ステップ | 内容 | 状態 |
|---------|------|------|
| 記録項目の設計 | 朝5項目・夜6項目を確定 | 完了 |
| アプリ名 | iPPO に決定 | 完了 |
| デザインコンセプト | 朝・夜モードの配色・トーン確定 | 完了 |
| 全画面UI | メイン・記録・待機・カレンダー・インサイト・設定 | 完了 |
| 統合プロトタイプ | 全画面をサイドメニューで行き来できる完全版 | 完了 |
| データ保存 | Supabase対応・記録の永続化・各画面への反映 | 完了 |
| インサイト改善 | 睡眠時間との相関性（3軸散布図）に変更 | 完了 |
| iPhone表示対応 | 全画面表示・スクロール対応 | 完了 |
| CSVエクスポート | 設定画面から全記録をCSVダウンロード | 完了 |
| Supabase移行 | localStorage → Supabaseクラウド保存に完全移行 | 完了 |
| 環境変数対応 | Supabase接続情報を.envで管理 | 完了 |
| GitHub管理 | GitHubリポジトリにpush・バージョン管理開始 | 完了 |
| GitHub Pages デプロイ | URLで常時公開・どこからでもアクセス可能 | 完了 |
| 認証機能 | メールアドレス＋パスワードでログイン・新規登録・ログアウト | 完了 |
| RLS設定 | Row Level Security・自分のデータのみ読み書き可能 | 完了 |
| あつめた言葉たち画面 | 設定画面から独立した専用画面として追加 | 完了 |
| 言葉をあつめるボタン | 待機画面（DoneScreen）から言葉を追加するモーダル | 完了 |
| iPPOタイトルナビゲーション | 全画面の「iPPO」タイトルをタップでメイン画面に戻る | 完了 |
| サイドメニュー順序変更 | カレンダー→あつめた言葉たち→インサイト→設定 | 完了 |
| カレンダー詳細パネル改善 | 底面固定→中央フローティングダイアログに変更 | 完了 |
| ブラウザタイトル変更 | 「React App」→「iPPO」 | 完了 |
| 記録後の遷移修正 | 記録後に「あつめた言葉たち」画面→「待機画面」へ変更 | 完了 |
| 言葉追加ウィンドウ統一 | カレンダー詳細パネルと同デザイン（中央・65vh・borderRadius 20px） | 完了 |
| quotesテーブルDB化 | 言葉のデータをSupabaseのquotesテーブルで管理 | 完了 |
| デフォルト言葉の管理 | 初回ログイン時にiPPO出典付きでシード・削除可能 | 完了 |
| 複数ユーザー対応 | recordsのUNIQUE制約を(user_id,date,type)に変更 | 完了 |
| みんなの言葉機能 | 他ユーザーの言葉をランダム表示・自分のDBに追加可能 | 完了 |
| 重複フィルター | みんなの言葉から自分の既存言葉を除外 | 完了 |
| ESLintワーニング修正 | react-hooks/exhaustive-deps 対応 | 完了 |
| PWA対応 | manifest.json・sw.js・iOS metaタグ | 完了 |
| アイコンデザイン | 独自デザイン（image/フォルダの画像から各サイズ生成） | 完了 |
| PWAキャッシュ改善 | sw.js v2・HTML常時最新取得・起動時更新チェック | 完了 |
| PWA更新バナー | 新バージョン検知時に「今すぐ更新」バナーを自動表示 | 完了 |
| CSVセキュリティ強化 | loadAllRecords・exportCSVにuserIdフィルター明示追加 | 完了 |
| 時間帯別フレーズ | 待機画面に朝/昼/夕方/夜のランダムフレーズ表示 | 完了 |
| 引用文ランダム表示 | 待機画面の引用文を開くたび・ボタンでランダム表示 | 完了 |

---

## 3. 確定済み事項

### 公開URL
- **本番環境**: `https://alterhabit999-web.github.io/ippo`

### GitHubリポジトリ
- **URL**: `https://github.com/alterhabit999-web/ippo`
- **ブランチ**: `main`（ソースコード）/ `gh-pages`（ビルド済みファイル）
- **公開設定**: Public

### Supabase情報
- **Project URL**: `https://yabcpxespudmuahczccx.supabase.co`
- **anon public key**: `.env` ファイルに記載（GitHubには上げない）
- **テーブル**: `records`、`quotes`
- **RLS**: 設定済み
- **認証**: メールアドレス＋パスワード認証（Supabase Auth）

### テーブル定義

#### recordsテーブル
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
  unique(user_id, date, type)  -- 複数ユーザー対応のため3カラム複合UNIQUE
);
```

#### quotesテーブル
```sql
create table quotes (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) not null,
  text text not null,
  source text default '',
  created_at timestamptz default now()
);
```

### RLSポリシー（全テーブル設定済み）

#### records
```sql
ALTER TABLE records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "自分のデータのみ参照" ON records FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "自分のデータのみ追加" ON records FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "自分のデータのみ更新" ON records FOR UPDATE USING (auth.uid() = user_id);
```

#### quotes
```sql
ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;
-- 全認証ユーザーが読み取り可能（みんなの言葉機能のため）
CREATE POLICY "認証ユーザーは全件参照可能" ON quotes FOR SELECT TO authenticated USING (true);
CREATE POLICY "自分のデータのみ追加" ON quotes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "自分のデータのみ更新" ON quotes FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "自分のデータのみ削除" ON quotes FOR DELETE TO authenticated USING (auth.uid() = user_id);
```

### ⚠️ Supabase側で要実行のSQL（未実施の場合は要確認）

```sql
-- recordsのUNIQUE制約変更（複数ユーザー対応）
ALTER TABLE records DROP CONSTRAINT IF EXISTS records_date_type_key;
ALTER TABLE records ADD CONSTRAINT records_user_date_type_unique UNIQUE (user_id, date, type);
```

### カラーパレット

**朝モード（サンライズオレンジ）**
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

**夜モード（インクブルー × スカイ）**
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

---

## 4. 開発環境

- **プロジェクト場所**: `~/Documents/App/ippo`
- **開発ツール**: Cowork（コード編集）＋ Mac標準ターミナル（コマンド実行）
- **ローカル確認**: `cd ~/Documents/App/ippo` → `npm start` → ブラウザで `http://localhost:3000`
- **iPhone確認**: 同一Wi-Fiで `http://[MacのIPアドレス]:3000`（`ipconfig getifaddr en0` で確認）

**インストール済みパッケージ**
- `@supabase/supabase-js`
- `gh-pages`（デプロイ用）

---

## 5. コードの管理

| ファイル | 内容 |
|---------|------|
| `src/App.js` | メインコード（全画面・認証・Supabase接続・quotes管理） |
| `src/index.js` | Reactエントリポイント + Service Worker登録・更新検知・更新バナー |
| `public/index.html` | タイトル「iPPO」・ビューポート・PWA metaタグ・apple-touch-icon |
| `public/favicon.ico` | ブラウザタブアイコン（32px） |
| `public/logo192.png` | PWAアイコン（192px） |
| `public/logo512.png` | PWAアイコン（512px） |
| `public/apple-touch-icon.png` | iOSホーム画面アイコン（180px） |
| `public/manifest.json` | PWA設定（アプリ名・アイコン・standalone・theme_color） |
| `public/sw.js` | Service Worker v2（ネットワーク優先・HTML常時最新・Supabase除外） |
| `src/App.css` | 全画面表示CSS設定済み |
| `.env` | Supabase接続情報（**GitHubには上げない**） |
| `package.json` | homepage・deployスクリプト設定済み |
| `image/favicon.png` | アイコン元画像（32px） |
| `image/icon.png` | アイコン元画像（512px） |

---

## 6. 開発フロー（Cowork + ターミナル）

```
Coworkでコード修正を依頼
  ↓
Claudeがsrc/App.jsを直接編集
  ↓
ターミナルで以下を実行：

  # GitHubにpush（ソースコード更新）
  git add .
  git commit -m "変更内容のメモ"
  git push origin main

  # GitHub Pagesにデプロイ（本番反映）
  npm run deploy
```

### git commit 時の注意
- `.git/HEAD.lock` エラーが出た場合：`rm -f .git/HEAD.lock` を実行してから再試行
- buildフォルダの権限エラー（EPERM unlink）が出た場合：Coworkに削除許可を求める

---

## 7. PWAホーム画面追加手順（iPhone）

1. SafariでiPPOのURLを開く：`https://alterhabit999-web.github.io/ippo`
2. 下部の「共有」アイコン（□↑）をタップ
3. 「ホーム画面に追加」をタップ
4. 名前を「iPPO」に確認して「追加」
5. ホーム画面にアイコンが表示される

### PWA更新の仕組み
- デプロイ後にアプリを開く（または復帰する）と自動で更新チェックが走る
- 新バージョンが見つかると自動リロードされ最新版に切り替わる
- 自動リロードされない場合は画面上部のオレンジバナー「今すぐ更新」を押す

---

## 8. 認証の補足

**確認メールについて**
新規登録時、Supabaseからメールアドレス確認メールが自動送信される。メール内のリンクをクリックしてから初回ログインが可能になる。

**確認メールを無効化したい場合**
1. [supabase.com](https://supabase.com) → `ippo` プロジェクト
2. 左メニュー「**Authentication**」→「**Providers**」→「**Email**」
3. 「**Confirm email**」のトグルを **OFF** にして保存

**知人に使ってもらう場合**
- URLを共有するだけでOK
- 各自「アカウントをお持ちでない方」からメール＋パスワードで登録
- RLSにより記録データ・言葉データはユーザーごとに完全に分離されている
- 「みんなの言葉」機能で他ユーザーの言葉（参照のみ）が表示される

---

## 9. 次回やること（優先順位順）

### STEP 1：データを蓄積させる
- しばらく自分・家族で使い続けてデータを集める
- インサイト画面の分析をより意味のあるものにするため

### STEP 2：React Native（Expo）化
通知機能・App Store申請のためのフル対応

主な変更点：
- `div` → `View`、`p/span` → `Text`、`button` → `TouchableOpacity`
- CSSスタイル → StyleSheet API
- Supabase接続はそのまま使用可能
- React Router不要（React Navigationに変更）

**App Store申請**：Apple Developer Program（年99ドル）が必要
**Google Play申請**：Google Play Console（初回25ドル）が必要

```
現在（GitHub Pages Webアプリ + PWA）
  ↓ STEP 2
Expo（React Native）化
  ↓
App Store / Google Play ローンチ
  ↓
プレミアム機能追加・マネタイズ開始
```

---

## 10. App Store ローンチ戦略

### 技術的に必要なこと（必須）
- React Native（Expo）への移行
- プッシュ通知の本実装
- オフライン対応
- Face ID / Touch ID ログイン対応
- Apple Developer Program 登録（年99ドル）
- プライバシーポリシーページの用意

### 追加すると差別化になる機能
| 機能 | 概要 | 優先度 |
|------|------|--------|
| ホーム画面ウィジェット | 今の気分・直近の記録状況をホーム画面で確認 | 高 |
| ストリーク（連続記録日数） | 「12日連続記録中」など継続モチベーション表示 | 高 |
| AIインサイト | 蓄積データから個人の傾向を自然文で分析（Claude API活用） | 高 |
| 週次・月次レポート | サマリーをPDF・画像でエクスポート・シェア | 中 |
| カスタムテーマ | 朝・夜以外の追加カラーテーマ（プレミアム機能候補） | 中 |
| Apple Health 連携 | 睡眠・活動データとの統合 | 低 |

### マネタイズ方針（フリーミアムモデル）
- **無料**：基本記録・カレンダー・インサイト（基本）
- **プレミアム（月額300〜500円 / 年額2,000〜3,000円）**：AIインサイト・ウィジェット・詳細レポート・追加テーマ
- 参考競合：Daylio、Reflectlyなど（同価格帯）

---

## 11. 将来追加機能メモ

- [ ] ホーム画面ウィジェット（iOS 14+）
- [ ] ストリーク（連続記録日数）表示
- [ ] AIによる週次インサイト生成（Claude API活用）
- [ ] 週次・月次レポートのPDF/画像エクスポート
- [ ] HAPPY/モヤモヤのキーワード分析（インサイト画面）
- [ ] カスタムテーマ（プレミアム機能候補）
- [ ] Apple Health 連携
- [ ] 通知機能（React Native化後に本実装）

---

## 12. 未決定事項

- [ ] App Store申請タイミング
- [ ] Google Play対応の優先度（iOS先行か同時か）

---

## 13. 次回セッションの開始方法

1. Coworkを開く
2. `~/Documents/App/ippo` フォルダを選択
3. 以下を伝える：

> 「iPPOの開発を続けます。引き継ぎ書v11と仕様書v1.9を確認してください。」

---

## 変更履歴

| バージョン | 日付 | 内容 |
|-----------|------|------|
| 1.0〜5.0 | 2026-04-08 | プロトタイプ完成・localStorage対応・各種改善 |
| 6.0 | 2026-04-09 | CSVエクスポート機能実装完了 |
| 7.0 | 2026-04-09 | Supabase移行完了 |
| 8.0 | 2026-04-09 | GitHub Pages公開・認証・RLS設定完了・Cowork開発環境に移行 |
| 9.0 | 2026-04-09 | あつめた言葉たち画面・言葉をあつめるボタン・iPPOタイトルナビゲーション・サイドメニュー順序・カレンダー詳細パネル改善 |
| 10.0 | 2026-04-10 | ブラウザタイトル変更・記録後遷移修正・言葉追加ウィンドウ統一・quotesテーブルDB化・みんなの言葉機能・複数ユーザー対応・デフォルト言葉管理・重複フィルター・ESLintワーニング修正・PWA対応（manifest・sw.js・アイコン・iOS metaタグ） |
| 11.0 | 2026-04-11 | アイコン新デザイン反映・PWAキャッシュ改善（sw.js v2）・更新バナー追加・CSVにuserIdフィルター追加・時間帯別ランダムフレーズ（朝/昼/夕方/夜）・引用文ランダム表示・App Storeローンチ戦略を追加 |
