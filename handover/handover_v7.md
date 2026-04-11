# iPPO 引き継ぎ書
**作成日**: 2026-04-08  
**更新日**: 2026-04-10  
**仕様書バージョン**: v4.0

---

## 1. プロジェクト概要

毎日朝・夜2回、1〜2分で記録する自己振り返りアプリ。気分・体調・睡眠・感情のパターンを蓄積・可視化し、自己理解を深めることが目的。WebアプリPWAとして実装済み。最終的にApp Store / Google Playへのローンチを目指す。

**URL**: https://alterhabit999-web.github.io/ippo/

---

## 2. 作業サマリー（全セッション）

| ステップ | 内容 | 状態 |
|---------|------|------|
| 記録項目の設計 | 朝5項目・夜6項目を確定 | ✅ 完了 |
| アプリ名 | iPPO に決定 | ✅ 完了 |
| デザインコンセプト | 朝・夜モードの配色・トーン確定 | ✅ 完了 |
| 全画面UI | メイン・記録・待機・カレンダー・インサイト・設定 | ✅ 完了 |
| Supabase移行 | localStorage → Supabase DB + Auth | ✅ 完了 |
| 認証機能 | Supabase Auth（メール/パスワード） | ✅ 完了 |
| 複数ユーザー対応 | RLS設定・UNIQUE制約（user_id, date, type） | ✅ 完了 |
| 集めた言葉機能 | quotes テーブル・追加・削除・シード・みんなの言葉 | ✅ 完了 |
| PWA対応 | アイコン・manifest・GitHub Pagesデプロイ | ✅ 完了 |
| 待機画面 出典表示 | source フィールドを待機画面に表示 | ✅ 完了 |
| ページネーション | 集めた言葉を10件区切りで表示 | ✅ 完了 |
| 上部白色帯の修正 | minHeight を 100dvh に変更 | ✅ 完了 |
| DB保存エラー対応 | エラーをUIに表示・Supabase自動停止の対処法確認 | ✅ 完了 |
| タイトルタップ更新 | iPPO タップで Supabase から最新データ再取得 | ✅ 完了 |
| 波アニメーション背景 | WaveBackground（position: fixed, -100px拡張） | ✅ 完了 |
| 背景仕様の確定 | 波：メイン・待機・記録・カレンダー・設定 / 単色：インサイト・集めた言葉 | ✅ 完了 |
| ヘッダー色統一 | インサイト・集めた言葉のTopBarとコンテンツを同色divでラップ | ✅ 完了 |

---

## 3. 技術スタック

| 項目 | 内容 |
|------|------|
| フレームワーク | React (Create React App) |
| バックエンド | Supabase (PostgreSQL + Auth) |
| ホスティング | GitHub Pages |
| プロジェクトフォルダ | `~/Documents/App/ippo` |
| デプロイコマンド | `npm run deploy` |

---

## 4. 環境構築

```bash
# 開発起動
cd ~/Documents/App/ippo
npm start

# 本番デプロイ
npm run deploy

# MacのIPアドレス確認（iPhone実機確認用）
ipconfig getifaddr en0
```

---

## 5. Supabase 情報

### テーブル

**`records`** — 記録データ
- UNIQUE制約：`records_user_date_type_unique`（user_id, date, type）
- upsert：`onConflict: "user_id,date,type"` で重複時は上書き

**`quotes`** — 今日の言葉
- `source = "iPPO"` でデフォルト言葉を識別
- 初回ログイン時に `DEFAULT_QUOTES_DATA` から自動シード

### ⚠️ 注意事項
**Supabase無料プランは一定期間アクセスがないと自動停止する。**  
停止中は `TypeError: Load failed` エラーが出る。  
対処：https://supabase.com にアクセスしてプロジェクトを手動再起動。

### 推奨SQL（未実施の場合）
```sql
-- 重複したUNIQUE制約を削除
ALTER TABLE records DROP CONSTRAINT records_user_id_date_type_key;
```

---

## 6. コンポーネント構成（App.js）

```
App
├── WaveBackground        // position: fixed, 四方向 -100px 拡張。全画面に波アニメーション
├── Phone                 // 透明なレイアウトラッパー（zIndex: 1）
│   ├── LoginScreen       // 未ログイン時
│   ├── TopBar            // 背景なし（透明）。iPPOタップで goHome → fetchData
│   ├── SideMenu
│   ├── MainScreen        // 波アニメーション
│   ├── RecordScreen      // 波アニメーション（エラー時に赤いエラーボックス表示）
│   ├── DoneScreen        // 波アニメーション（待機画面）
│   ├── CalendarScreen    // 波アニメーション
│   ├── InsightScreen     // 単色背景 ← 画面全体をT.bgPage divでラップ（TopBar含む）
│   ├── CollectedWordsScreen // 単色背景 ← 同上
│   └── SettingsScreen    // 波アニメーション
```

### 背景実装の重要ポイント

**波アニメーション画面（MainScreen等）**  
→ Phone が透明なので WaveBackground が透けて見える

**単色背景画面（InsightScreen / CollectedWordsScreen）**  
→ 画面のルート要素が `<div style={{flex:1, display:"flex", flexDirection:"column", background:T.bgPage}}>` でラップ  
→ TopBarとコンテンツエリアの両方が同じ単色で覆われ、ヘッダー色とページ色が一致する  
→ WaveBackgroundは裏で動いているが、このdivで完全に隠れる

### 重要な関数

**`fetchData(userId)`** — Supabaseからrecords・quotesを取得してstateを更新  
**`goHome()`** — メイン画面に戻る + fetchDataで最新データを再取得  
**`saveRecord(data, userId)`** — recordsテーブルにupsert。エラーを戻り値で返す。呼び出し側でUIにエラーを表示。

---

## 7. ファイル構成

| ファイル | 内容 |
|---------|------|
| `src/App.js` | メインコード（全コンポーネント） |
| `src/App.css` | 波アニメーションkeyframes（ippoWaveH / ippoWaveV） |
| `public/index.html` | PWA設定・ビューポート設定 |
| `public/manifest.json` | PWAマニフェスト |
| `spec/spec_v4.md` | 最新仕様書 |
| `handover/handover_v7.md` | 最新引き継ぎ書（このファイル） |

---

## 8. 次回やること（優先順位順）

1. **日々の使用 → UXの微調整**
2. **CSVエクスポート機能**（設定画面に実装予定）
3. **Supabase重複UNIQUE制約の削除**（未実施の場合）
4. **通知機能**（後回し中・React Native化後に本実装）
5. **将来：React Native化** → App Store申請

---

## 9. 将来追加機能メモ

- [ ] CSVエクスポート機能
- [ ] HAPPY/モヤモヤのキーワード分析
- [ ] AIによる週次インサイト生成（Claude API活用）
- [ ] 通知機能（React Native化後に本実装）

---

## 10. 次回セッションの開始方法

新しいセッションで以下を伝える：

> 「iPPOの開発を続けます。引き継ぎ書v7と仕様書v4を読み込んでください。」

ファイルパス：
- 仕様書：`spec/spec_v4.md`
- 引き継ぎ書：`handover/handover_v7.md`

---

## 変更履歴

| バージョン | 日付 | 内容 |
|-----------|------|------|
| 1.0〜5.0 | 2026-04-08 | 初版〜localStorage対応 |
| 6.0 | 2026-04-10 | Supabase移行・PWA・認証・集めた言葉・波アニメーション等を反映 |
| 7.0 | 2026-04-10 | 背景仕様確定（波／単色の画面割り振り・ヘッダー色統一の実装方式）を追記 |
