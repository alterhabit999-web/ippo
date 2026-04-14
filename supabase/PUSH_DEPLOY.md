# iPPO Web Push 通知 デプロイ手順

iOS PWA でも完全にバックグラウンド動作するプッシュ通知を有効にするための手順です。
一度セットアップすれば、以降はフロント/Edge Function のデプロイで運用できます。

---

## 0. 前提

- Supabase プロジェクト: `yabcpxespudmuahczccx`
- VAPID 鍵ペア（このリポジトリ用に生成済み）
  - Public: `BNqyLXWo0WN3UIvElhhP9pAHh-EudIWIfIa8UygNbH8aSG0x-Lo87Pcr64wCXaAOx9tewIOigKgTK1MlNzZE55s`
  - Private: `Ea_-_-XKkFAotvyVk03AlV7UPs_Jz2l48auTaNCZaig`
  - ※ Private 鍵は Supabase Secret にのみ保存し、リポジトリにはコミットしないこと。

すでに `.env` には `REACT_APP_VAPID_PUBLIC_KEY` が設定済み。

---

## 1. Supabase SQL の実行

Supabase Dashboard → SQL Editor で、以下のファイルを開いて実行:

```
supabase/setup_push_notifications.sql
```

このファイルは次を行います:

1. `user_notification_settings` テーブル作成（時刻・ON/OFF・タイムゾーン・送信済みフラグ）
2. `push_subscriptions` テーブル作成（endpoint / p256dh / auth）
3. 両テーブルに RLS ポリシー適用（ユーザーは自分の行のみ操作可）
4. `pg_cron` / `pg_net` 拡張を有効化
5. 1 分ごとに Edge Function `send-reminders` を呼び出す cron ジョブを登録

**重要:** ファイル末尾の `cron.schedule(...)` の `<SERVICE_ROLE_KEY>` を、
Supabase Dashboard → Project Settings → API → `service_role` key に置き換えてから実行してください。

---

## 2. Supabase CLI で Edge Function をデプロイ

### 2-1. CLI インストール（初回のみ）

```bash
brew install supabase/tap/supabase
```

### 2-2. ログイン & プロジェクトリンク

```bash
supabase login
supabase link --project-ref yabcpxespudmuahczccx
```

### 2-3. Secret を登録

`web-push` が VAPID 鍵を使ってプッシュ送信するために必要。

```bash
supabase secrets set \
  VAPID_PUBLIC_KEY="BNqyLXWo0WN3UIvElhhP9pAHh-EudIWIfIa8UygNbH8aSG0x-Lo87Pcr64wCXaAOx9tewIOigKgTK1MlNzZE55s" \
  VAPID_PRIVATE_KEY="Ea_-_-XKkFAotvyVk03AlV7UPs_Jz2l48auTaNCZaig" \
  VAPID_SUBJECT="mailto:admin@ippo.app"
```

（`SUPABASE_URL` と `SUPABASE_SERVICE_ROLE_KEY` は Supabase が自動注入するので設定不要）

### 2-4. Function をデプロイ

```bash
supabase functions deploy send-reminders
```

デプロイ後のエンドポイント:
```
https://yabcpxespudmuahczccx.supabase.co/functions/v1/send-reminders
```

### 2-5. 動作確認

```bash
curl -X POST \
  -H "Authorization: Bearer <SERVICE_ROLE_KEY>" \
  -H "Content-Type: application/json" \
  https://yabcpxespudmuahczccx.supabase.co/functions/v1/send-reminders \
  -d '{}'
```

レスポンス例:
```json
{"ok":true,"processed":1,"sent":0}
```

`sent > 0` になるのは、現在時刻が誰かの `am_time` / `pm_time` と一致したタイミング。

---

## 3. フロントエンドをデプロイ

```bash
npm run deploy
```

これで GitHub Pages に push され、ユーザーが設定画面でトグル ON にした時に:

1. ブラウザ通知の許可を要求
2. `push_subscriptions` テーブルに購読情報を保存
3. `user_notification_settings` テーブルに時刻 / ON-OFF / タイムゾーンを保存

---

## 4. iOS PWA で動作確認

1. Safari で https://alterhabit999-web.github.io/ippo を開く
2. 共有 → "ホーム画面に追加"
3. ホーム画面から iPPO を起動（**必ずホーム画面から**）
4. ログイン後、設定画面でリマインダーをトグル ON → 時刻設定
5. 通知の許可ダイアログで「許可」
6. アプリを完全に終了（タスクスイッチャーから上スワイプで kill）
7. 設定時刻になると、アプリが閉じていても通知が届く

### 注意点

- iOS 16.4 以降必須
- **Safari で開いた状態ではダメ**。必ずホーム画面に追加した PWA から通知許可すること
- 初回の通知許可ダイアログに「許可」と答えないと、`push_subscriptions` への登録は発生しない
- 許可したのに届かない時は、iOS の 設定 → 通知 → iPPO で許可状態を確認

---

## 5. cron の確認

Supabase Dashboard → Database → Extensions → pg_cron → Jobs で
`ippo-send-reminders` が登録されていて status `success` になっていることを確認。

停止したい場合:

```sql
select cron.unschedule('ippo-send-reminders');
```

---

## 6. トラブルシュート

### 通知が届かない

1. ブラウザ Console で `push subscribe failed` が出ていないか確認
2. Supabase Dashboard → Table Editor → `push_subscriptions` に自分の行があるか確認
3. `user_notification_settings` の `am_on`/`pm_on` が true か
4. Edge Function のログ: Supabase Dashboard → Edge Functions → send-reminders → Logs
5. cron ジョブが 1 分ごとに走っているか（Database → Extensions → pg_cron → Jobs）

### 購読が切れている（410 Gone）

`send-reminders` は 410/404 を受け取ると自動で `push_subscriptions` から該当行を削除します。
その後ユーザーがアプリを起動すれば、再購読が自動で行われます。

### VAPID 鍵を変更したい

1. 新しい鍵ペアを生成: `npx web-push generate-vapid-keys`
2. `.env` の `REACT_APP_VAPID_PUBLIC_KEY` を更新 → `npm run deploy`
3. `supabase secrets set VAPID_PUBLIC_KEY=... VAPID_PRIVATE_KEY=...` で更新
4. `supabase functions deploy send-reminders`
5. 既存の `push_subscriptions` 行は古い鍵で登録されているので全削除
   ```sql
   delete from push_subscriptions;
   ```
6. ユーザーに再ログイン/再許可を促す
