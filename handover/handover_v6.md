# iPPO 引き継ぎ書
**作成日**: 2026-04-08  
**更新日**: 2026-04-10  
**仕様書バージョン**: v3.0

---

## 1. プロジェクト概要

毎日朝・夜2回、1〜2分で記録する自己振り返りアプリ。気分・体調・睡眠・感情のパターンを蓄積・可視化し、自己理解を深めることが目的。Webアプリ（PWA）として実装済み。最終的にApp Store / Google Playへのローンチを目指す。

---

## 2. 作業サマリー（全セッション）

| ステップ | 内容 | 状態 |
|---------|------|------|
| 記録項目の設計 | 朝5項目・夜6項目を確定 | ✅ 完了 |
| アプリ名 | iPPO に決定 | ✅ 完了 |
| デザインコンセプト | 朝・夜モードの配色・トーン確定 | ✅ 完了 |
| 全画面UI | メイン・記録・待機・カレンダー・インサイト・設定 | ✅ 完了 |
| 環境構築 | Mac + VSCode + iPhone動作確認 | ✅ 完了 |
| Supabase移行 | localStorage → Supabase DB + Auth | ✅ 完了 |
| 認証機能 | Supabase Auth（メール/パスワード）| ✅ 完了 |
| 複数ユーザー対応 | RLS設定・UNIQUE制約（user_id, date, type）| ✅ 完了 |
| 集めた言葉機能 | quotes テーブル・追加・削除・デフォルトシード | ✅ 完了 |
| PWA対応 | アイコン・manifest・GitHub Pagesデプロイ | ✅ 完了 |
| 待機画面 出典表示 | source フィールドを待機画面に表示 | ✅ 完了 |
| ページネーション | 集めた言葉を10件区切りで表示 | ✅ 完了 |
| 上部白色帯の修正 | minHeight を 100dvh に変更 | ✅ 完了 |
| DB保存エラー対応 | エラーをUIに表示・Supabase自動停止の対処法確認 | ✅ 完了 |
| タイトルタップ更新 | iPPO タップで Supabase から最新データ再取得 | ✅ 完了 |
| 波アニメーション背景 | WaveBackground コンポーネント（position: fixed）| ✅ 完了 |
| セーフエリア対応 | WaveBackground を -100px 拡張でiOS帯を解消 | ✅ 完了 |

---

## 3. 確定済み事項

### アプリ名
**iPPO**（"i" は小文字）

### URL
**https://alterhabit999-web.github.io/ippo/**

### コンセプト
「一歩一歩、自分と向き合う」。シンプルだが手書きのような温もり。開いたときに「ほっとする＋ちょっと楽しい」気持ちになれるトーン。

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

### 画面構成

**メイン画面（3ステート）**
- ステート1：中央にボタン一つ（"Morning" / "Night"）
- ステート2：記録画面（スライダー＋テキスト入力）
- ステート3：待機画面（今日の一言＋出典＋朝夜完了状態）
- 17時を境に朝・夜を自動判定

**サイドメニュー**：カレンダー・インサイト・集めた言葉・設定

**波アニメーション背景が適用される画面**：メイン・待機・カレンダー・設定・記録  
**単色背景の画面**：インサイト・集めた言葉

---

## 4. 技術スタック

| 項目 | 内容 |
|------|------|
| フレームワーク | React (Create React App) |
| バックエンド | Supabase (PostgreSQL + Auth) |
| ホスティング | GitHub Pages |
| リポジトリ | alterhabit999-web/ippo（GitHubの `gh-pages` ブランチ） |
| デプロイ | `npm run deploy`（gh-pagesパッケージ） |
| プロジェクトフォルダ | `~/Documents/App/ippo` |

---

## 5. 環境構築

**開発起動**
```bash
cd ~/Documents/App/ippo
npm start
```

**本番デプロイ**
```bash
cd ~/Documents/App/ippo
npm run deploy
```

**iPhone確認（開発時）**
同一Wi-Fiで `http://[MacのIPアドレス]:3000`
```bash
ipconfig getifaddr en0  # MacのIPアドレス確認
```

---

## 6. Supabase 情報

### テーブル

**`records`** — 記録データ
- UNIQUE制約：`(user_id, date, type)` → 制約名 `records_user_date_type_unique`
- upsert時：`onConflict: "user_id,date,type"` で重複時は上書き

**`quotes`** — 今日の言葉
- デフォルト言葉は `source = "iPPO"` で識別
- 初回ログイン時に `DEFAULT_QUOTES_DATA` から自動シード

### 注意事項
- **Supabase無料プランは一定期間アクセスがないとプロジェクトが自動停止する**
- 停止した場合は https://supabase.com でプロジェクトを手動で再起動
- 停止中は `TypeError: Load failed` というエラーが出る

### 推奨SQL（未実施の場合）
重複したUNIQUE制約を削除：
```sql
ALTER TABLE records DROP CONSTRAINT records_user_id_date_type_key;
```

---

## 7. 主要コンポーネント構成（App.js）

```
App（メインコンポーネント）
├── WaveBackground（position: fixed で全画面を波アニメーション）
├── Phone（透明なレイアウトラッパー・zIndex:1）
│   ├── LoginScreen（未ログイン時）
│   ├── TopBar（iPPO タイトルタップで goHome → fetchData）
│   ├── SideMenu
│   ├── MainScreen（記録待ち）
│   ├── RecordScreen（記録入力）
│   ├── DoneScreen（待機画面）
│   ├── CalendarScreen
│   ├── InsightScreen
│   ├── CollectedWordsScreen
│   └── SettingsScreen
```

### 重要な関数

**`fetchData(userId)`**：Supabaseからrecords・quotesを取得し、stateを更新

**`goHome()`**：メイン画面に戻る＋fetchDataで最新データを再取得

**`saveRecord(data, userId)`**：recordsテーブルにupsert。エラーを戻り値で返す。UI側でエラーメッセージを表示。

---

## 8. ファイル構成

| ファイル | 内容 |
|---------|------|
| `src/App.js` | メインコード（全コンポーネント） |
| `src/App.css` | 波アニメーションkeyframes（ippoWaveH / ippoWaveV） |
| `public/index.html` | PWA設定・ビューポート設定済み |
| `public/manifest.json` | PWAマニフェスト |
| `spec/spec_v3.md` | 最新仕様書 |
| `handover/handover_v6.md` | 最新引き継ぎ書（このファイル） |

---

## 9. 次回やること（優先順位順）

1. **日々の使用 → UXの微調整**（使いながら気になった点を修正）
2. **CSVエクスポート機能**（設定画面に実装予定）
3. **Supabase UNIQUE制約の重複削除**（推奨・未実施の場合）
4. **通知機能**（後回し中・React Native化後に本実装）
5. **将来：React Native化** → App Store申請

---

## 10. 将来追加機能メモ

- [ ] CSVエクスポート機能
- [ ] HAPPY/モヤモヤのキーワード分析
- [ ] AIによる週次インサイト生成（Claude API活用）
- [ ] 通知機能（React Native化後に本実装）

---

## 11. 次回セッションの開始方法

新しいセッションで以下を伝える：

> 「iPPOの開発を続けます。引き継ぎ書v6と仕様書v3を読み込んでください。」

ファイルパス（Coworkから読み込み）：
- 仕様書：`spec/spec_v3.md`
- 引き継ぎ書：`handover/handover_v6.md`

---

## 変更履歴

| バージョン | 日付 | 内容 |
|-----------|------|------|
| 1.0 | 2026-04-08 | 初版作成 |
| 2.0 | 2026-04-08 | 全画面プロトタイプ完成 |
| 3.0 | 2026-04-08 | 統合プロトタイプ完成 |
| 4.0 | 2026-04-08 | データ保存・インサイト改善・環境構築・iPhone表示対応 |
| 5.0 | 2026-04-08 | localStorage対応完了 |
| 6.0 | 2026-04-10 | Supabase移行・PWA・認証・集めた言葉・波アニメーション・各種UIバグ修正を反映 |
