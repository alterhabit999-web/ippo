-- ============================================================
-- iPPO プッシュ通知用テーブル作成・RLS設定
-- Supabase SQL Editor で実行してください
-- ============================================================

-- ① ユーザーごとの通知設定テーブル
create table if not exists user_notification_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  am_time text default '07:00',
  pm_time text default '22:00',
  am_on boolean default true,
  pm_on boolean default true,
  timezone_offset integer default 540,  -- 分単位（日本はUTC+9 = 540分）
  last_sent_am_date date,  -- 冪等性: この日付のAM通知を既に送ったか
  last_sent_pm_date date,  -- 冪等性: この日付のPM通知を既に送ったか
  updated_at timestamptz default now()
);

-- 既存テーブルに後から列を足す場合の安全策
alter table user_notification_settings add column if not exists last_sent_am_date date;
alter table user_notification_settings add column if not exists last_sent_pm_date date;

alter table user_notification_settings enable row level security;

create policy "user can read own notification settings"
  on user_notification_settings for select
  using (auth.uid() = user_id);

create policy "user can insert own notification settings"
  on user_notification_settings for insert
  with check (auth.uid() = user_id);

create policy "user can update own notification settings"
  on user_notification_settings for update
  using (auth.uid() = user_id);

-- ② プッシュ購読情報テーブル（デバイスごとに1行）
create table if not exists push_subscriptions (
  endpoint text primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  p256dh text not null,
  auth_key text not null,
  created_at timestamptz default now()
);

alter table push_subscriptions enable row level security;

create policy "user can read own push subscriptions"
  on push_subscriptions for select
  using (auth.uid() = user_id);

create policy "user can insert own push subscriptions"
  on push_subscriptions for insert
  with check (auth.uid() = user_id);

create policy "user can update own push subscriptions"
  on push_subscriptions for update
  using (auth.uid() = user_id);

create policy "user can delete own push subscriptions"
  on push_subscriptions for delete
  using (auth.uid() = user_id);

-- ============================================================
-- pg_cron 拡張を有効化（Supabase Dashboard → Database → Extensions でも可）
-- ============================================================
create extension if not exists pg_cron;
create extension if not exists pg_net;

-- ============================================================
-- 1分ごとに send-reminders Edge Function を実行
-- ※ <SERVICE_ROLE_KEY> は Supabase Dashboard → Project Settings → API → service_role key を使用
-- ============================================================
-- 既存ジョブがあれば削除
select cron.unschedule('ippo-send-reminders') where exists (
  select 1 from cron.job where jobname='ippo-send-reminders'
);

select cron.schedule(
  'ippo-send-reminders',
  '* * * * *',
  $$
  select net.http_post(
    url := 'https://yabcpxespudmuahczccx.supabase.co/functions/v1/send-reminders',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer <SERVICE_ROLE_KEY>'
    ),
    body := '{}'::jsonb
  );
  $$
);
