# iPPO 引き継ぎ書
**作成日**: 2026-04-08
**更新日**: 2026-04-09
**仕様書バージョン**: v1.5

---

## 1. プロジェクト概要

毎日朝・夜2回、1〜2分で記録する自己振り返りアプリ。気分・体調・睡眠・感情のパターンを蓄積・可視化し、自己理解を深めることが目的。個人用WebアプリとしてSupabaseで運用中。最終的にApp Store / Google Playへのローンチを目指す。

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
| 環境構築 | Mac + VSCode + iPhone動作確認 | 完了 |
| iPhone表示対応 | 全画面表示・スクロール対応 | 完了 |
| CSVエクスポート | 設定画面から全記録をCSVダウンロード | 完了 |
| Supabase移行 | localStorage → Supabaseクラウド保存に完全移行 | 完了 |
| RLS設定 | Row Level Securityの設定 | **未完了・次回対応** |

---

## 3. 確定済み事項

### Supabase情報
- **Project URL**: `https://yabcpxespudmuahczccx.supabase.co`
- **anon public key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlhYmNweGVzcHVkbXVhaGN6Y2N4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU2NzE5OTQsImV4cCI6MjA5MTI0Nzk5NH0.sY8IKv9V6mW0lY_gw52uRGEgVIg3BFRubN5ViQDSORQ`
- **テーブル**: `records`
- **RLS**: 未設定（次回対応）

### テーブル定義
```sql
create table records (
  id uuid default gen_random_uuid() primary key,
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
  unique(date, type)
);
```

### データフロー
- 読み込み：`loadAllRecords()` — Supabaseから全件取得 → `{ "YYYY-MM-DD": { am, pm } }` 形式に変換
- 保存：`saveRecord()` — upsert（`onConflict: "date,type"`）
- CSVエクスポート：Supabaseから取得 → BOM付きUTF-8でダウンロード

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

## 4. 環境構築済みの設定

**開発環境**
- Mac + VSCode + Node.js
- プロジェクト場所：`~/Documents/App/ippo`
- 起動コマンド：`cd ~/Documents/App/ippo` → `npm start`
- iPhone確認：同一Wi-Fiで `http://[MacのIPアドレス]:3000`
- MacのIPアドレス確認：`ipconfig getifaddr en0`

**インストール済みパッケージ**
- `@supabase/supabase-js`

---

## 5. コードの管理

**最新のApp.jsコード**は `src/App.js` に直接保存されています（Coworkで管理）。

| ファイル | 内容 |
|---------|------|
| `src/App.js` | 最新・Supabase対応済み・環境変数対応済み |
| `public/index.html` | ビューポート設定済み |
| `src/App.css` | 全画面表示CSS設定済み |
| `.env` | Supabase接続情報（GitHubには上げない） |

---

## 6. 次回やること（優先順位順）

1. **RLS（Row Level Security）の設定** ← 次回はここから
2. **毎日使いながらUXの微調整**
3. **通知機能**（React Native化後に本実装）
4. **将来：React Native化** → App Store申請

### RLS設定の方針（次回引き継ぎ）
- 現状：`anon key` を知っている人なら誰でも読み書き可能
- 対応：Supabaseの Authentication を使ったユーザー認証 + RLS ポリシー設定
- 個人利用フェーズではメールアドレス認証（magic link）が最もシンプル

---

## 7. 将来追加機能メモ

- [ ] HAPPY/モヤモヤのキーワード分析
- [ ] AIによる週次インサイト生成（Claude API活用）
- [ ] 通知機能（React Native化後に本実装）

---

## 8. 未決定事項

- [ ] 将来的なマネタイズ方針

---

## 9. 次回セッションの開始方法

1. **この会話を開く**
2. 新しいメッセージで以下を伝える：

> 「iPPOの開発を続けます。引き継ぎ書v7と仕様書v1.5を添付します。」

3. この引き継ぎ書と仕様書をコピー＆ペーストする

---

## 変更履歴

| バージョン | 日付 | 内容 |
|-----------|------|------|
| 1.0〜5.0 | 2026-04-08 | プロトタイプ完成・localStorage対応・各種改善 |
| 6.0 | 2026-04-09 | CSVエクスポート機能実装完了 |
| 7.0 | 2026-04-09 | Supabase移行完了・RLS設定は次回対応 |
