-- ============================================================
-- iPPO quotes（あつめた言葉）テーブル作成・RLS 設定
-- Supabase SQL Editor で実行してください。
-- 既に quotes テーブルがある場合でも、CREATE IF NOT EXISTS と
-- ADD COLUMN IF NOT EXISTS / CREATE POLICY IF NOT EXISTS を使って
-- 冪等に実行できる想定です。
-- ============================================================

-- ① テーブル本体
create table if not exists quotes (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  text       text not null,
  source     text default '',
  created_at timestamptz default now()
);

-- 既存テーブルに列が欠けている場合の補完
alter table quotes add column if not exists source     text default '';
alter table quotes add column if not exists created_at timestamptz default now();

-- user_id 検索の高速化
create index if not exists quotes_user_id_idx on quotes (user_id);

-- ② RLS（行単位セキュリティ）
alter table quotes enable row level security;

-- 本人のみ SELECT できる
drop policy if exists "quotes_select_own" on quotes;
create policy "quotes_select_own"
  on quotes for select
  using (auth.uid() = user_id);

-- 本人のみ INSERT できる（言葉追加はこのポリシーを通る）
drop policy if exists "quotes_insert_own" on quotes;
create policy "quotes_insert_own"
  on quotes for insert
  with check (auth.uid() = user_id);

-- 本人のみ UPDATE できる
drop policy if exists "quotes_update_own" on quotes;
create policy "quotes_update_own"
  on quotes for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- 本人のみ DELETE できる
drop policy if exists "quotes_delete_own" on quotes;
create policy "quotes_delete_own"
  on quotes for delete
  using (auth.uid() = user_id);

-- ③「みんなの言葉」機能で他人の言葉をランダム表示するため、
--   ログイン済みユーザーであれば自分以外の言葉も SELECT できる
--   補助ポリシー（iPPO の仕様に従う）。
--   ※ もし公開したくない場合はこのポリシーを削除してください。
drop policy if exists "quotes_select_public_shared" on quotes;
create policy "quotes_select_public_shared"
  on quotes for select
  to authenticated
  using (true);

-- ============================================================
-- 確認用クエリ（SQL Editor で実行して結果が見られればOK）
-- select policyname, cmd from pg_policies where tablename = 'quotes';
-- ============================================================
