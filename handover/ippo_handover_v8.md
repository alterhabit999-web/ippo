# iPPO 引き継ぎ書
**作成日**: 2026-04-08
**更新日**: 2026-04-09
**仕様書バージョン**: v1.6

---

## 1. プロジェクト概要

毎日朝・夜2回、1〜2分で記録する自己振り返りアプリ。気分・体調・睡眠・感情のパターンを蓄積・可視化し、自己理解を深めることが目的。GitHub Pages + Supabaseで運用中。最終的にApp Store / Google Playへのローンチを目指す。

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
| 環境変数対応 | Supabase接続情報を.envで管理（コードに直書きしない） | 完了 |
| GitHub管理 | GitHubリポジトリにpush・バージョン管理開始 | 完了 |
| GitHub Pages デプロイ | URLで常時公開・どこからでもアクセス可能 | 完了 |
| 認証機能 | メールアドレス＋パスワードでログイン・新規登録・ログアウト | 完了 |
| RLS設定 | Row Level Security・自分のデータのみ読み書き可能 | 完了 |

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
- **テーブル**: `records`
- **RLS**: 設定済み（自分のデータのみ読み書き可能）
- **認証**: メールアドレス＋パスワード認証（Supabase Auth）

### 認証の補足

**確認メールについて**
新規登録時、Supabaseからメールアドレス確認メールが自動送信される。メール内のリンクをクリックしてから初回ログインが可能になる。

**確認メールを無効化したい場合**（個人利用で不要な場合）
1. [supabase.com](https://supabase.com) → `ippo` プロジェクト
2. 左メニュー「**Authentication**」→「**Providers**」→「**Email**」
3. 「**Confirm email**」のトグルを **OFF** にして保存
→ 登録後すぐにログインできるようになる

**知人に使ってもらう場合**
- URLを共有するだけでOK
- 各自「アカウントをお持ちでない方」からメール＋パスワードで登録
- RLSにより各ユーザーのデータは完全に分離されている

### テーブル定義
```sql
create table records (
  id uuid default gen_random_uuid() primary key,
  date text not null,
  type text not null check (type in ('am', 'pm')),
  user_id uuid references auth.users(id),
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
  unique(date, type)
);
```

### RLSポリシー
```sql
-- RLS有効化済み
ALTER TABLE records ENABLE ROW LEVEL SECURITY;

-- 自分のデータのみ参照・追加・更新
CREATE POLICY "自分のデータのみ参照" ON records FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "自分のデータのみ追加" ON records FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "自分のデータのみ更新" ON records FOR UPDATE USING (auth.uid() = user_id);
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
| `src/App.js` | メインコード（Coworkで管理） |
| `public/index.html` | ビューポート設定済み |
| `src/App.css` | 全画面表示CSS設定済み |
| `.env` | Supabase接続情報（**GitHubには上げない**） |
| `package.json` | homepage・deployスクリプト設定済み |

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

---

## 7. 次回やること（優先順位順）

1. **毎日使いながらUXの微調整**
2. **過去データの移行**（既存レコードへuser_idを付与するかどうか判断）
3. **通知機能**（React Native化後に本実装）
4. **将来：React Native化** → App Store申請

---

## 8. 将来追加機能メモ

- [ ] HAPPY/モヤモヤのキーワード分析
- [ ] AIによる週次インサイト生成（Claude API活用）
- [ ] 通知機能（React Native化後に本実装）

---

## 9. 未決定事項

- [ ] 将来的なマネタイズ方針

---

## 10. 次回セッションの開始方法

1. Coworkを開く
2. `~/Documents/App/ippo` フォルダを選択
3. 以下を伝える：

> 「iPPOの開発を続けます。引き継ぎ書v8を確認してください。」

---

## 変更履歴

| バージョン | 日付 | 内容 |
|-----------|------|------|
| 1.0〜5.0 | 2026-04-08 | プロトタイプ完成・localStorage対応・各種改善 |
| 6.0 | 2026-04-09 | CSVエクスポート機能実装完了 |
| 7.0 | 2026-04-09 | Supabase移行完了 |
| 8.0 | 2026-04-09 | GitHub Pages公開・認証・RLS設定完了・Cowork開発環境に移行 |
