// ============================================================
// iPPO - リマインダープッシュ送信 Edge Function
// pg_cron から 1 分ごとに呼び出される想定
// 各ユーザーの通知設定を読み、現在のローカル時刻が
// am_time / pm_time と一致する場合にプッシュを送信する
// ============================================================
// 必要な環境変数 (supabase secrets set で設定):
//   SUPABASE_URL                 (自動付与)
//   SUPABASE_SERVICE_ROLE_KEY    (自動付与)
//   VAPID_PUBLIC_KEY
//   VAPID_PRIVATE_KEY
//   VAPID_SUBJECT                (例: "mailto:you@example.com")
// ============================================================

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import webpush from "https://esm.sh/web-push@3.6.7";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const VAPID_PUBLIC_KEY = Deno.env.get("VAPID_PUBLIC_KEY")!;
const VAPID_PRIVATE_KEY = Deno.env.get("VAPID_PRIVATE_KEY")!;
const VAPID_SUBJECT = Deno.env.get("VAPID_SUBJECT") ?? "mailto:admin@ippo.app";

webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

// "HH:MM" → 分
function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
}

// 現在 UTC 分（0-1439）を基に、オフセット分だけずらしたローカル時刻分を返す
function localMinutesNow(tzOffsetMin: number): number {
  const now = new Date();
  const utcMin = now.getUTCHours() * 60 + now.getUTCMinutes();
  return ((utcMin + tzOffsetMin) % 1440 + 1440) % 1440;
}

// YYYY-MM-DD キー（指定タイムゾーンのローカル日付）
function localDateKey(tzOffsetMin: number): string {
  const now = new Date();
  const shifted = new Date(now.getTime() + tzOffsetMin * 60 * 1000);
  return shifted.toISOString().slice(0, 10);
}

type Settings = {
  user_id: string;
  am_time: string;
  pm_time: string;
  am_on: boolean;
  pm_on: boolean;
  timezone_offset: number;
};

type PushSub = {
  endpoint: string;
  user_id: string;
  p256dh: string;
  auth_key: string;
};

async function sendPushToUser(
  userId: string,
  payload: { title: string; body: string; tag: string },
) {
  const { data: subs, error } = await supabase
    .from("push_subscriptions")
    .select("endpoint,user_id,p256dh,auth_key")
    .eq("user_id", userId);
  if (error) {
    console.error("fetch subs failed", error);
    return;
  }
  if (!subs || subs.length === 0) return;

  for (const s of subs as PushSub[]) {
    const subscription = {
      endpoint: s.endpoint,
      keys: { p256dh: s.p256dh, auth: s.auth_key },
    };
    try {
      await webpush.sendNotification(subscription, JSON.stringify(payload));
    } catch (e: unknown) {
      const err = e as { statusCode?: number; body?: string };
      console.warn("push send failed", err.statusCode, err.body);
      // 410 Gone / 404 Not Found は購読失効 → 削除
      if (err.statusCode === 410 || err.statusCode === 404) {
        await supabase.from("push_subscriptions").delete().eq("endpoint", s.endpoint);
      }
    }
  }
}

// すでに今日送信済みかを「送信ログテーブル」で判定する代わりに
// settings 行に last_sent_am_date / last_sent_pm_date を持たせて冪等にする
async function markSent(
  userId: string,
  kind: "am" | "pm",
  dateKey: string,
) {
  const col = kind === "am" ? "last_sent_am_date" : "last_sent_pm_date";
  await supabase
    .from("user_notification_settings")
    .update({ [col]: dateKey })
    .eq("user_id", userId);
}

type SettingsWithLast = Settings & {
  last_sent_am_date: string | null;
  last_sent_pm_date: string | null;
};

Deno.serve(async (_req) => {
  try {
    const { data, error } = await supabase
      .from("user_notification_settings")
      .select(
        "user_id,am_time,pm_time,am_on,pm_on,timezone_offset,last_sent_am_date,last_sent_pm_date",
      );
    if (error) throw error;

    const rows = (data ?? []) as SettingsWithLast[];
    let processed = 0;
    let sentCount = 0;

    for (const s of rows) {
      processed++;
      const tz = s.timezone_offset ?? 540;
      const nowMin = localMinutesNow(tz);
      const dateKey = localDateKey(tz);

      // 厳密一致 + 直近5分以内のキャッチアップ
      const within5 = (target: string) => {
        const t = toMinutes(target);
        return nowMin >= t && nowMin <= t + 5;
      };

      if (s.am_on && s.last_sent_am_date !== dateKey && within5(s.am_time)) {
        await sendPushToUser(s.user_id, {
          title: "iPPO - 朝の記録",
          body: "おはよう！朝の記録をつけましょう",
          tag: "ippo-am",
        });
        await markSent(s.user_id, "am", dateKey);
        sentCount++;
      }
      if (s.pm_on && s.last_sent_pm_date !== dateKey && within5(s.pm_time)) {
        await sendPushToUser(s.user_id, {
          title: "iPPO - 夜の記録",
          body: "お疲れさま！今日の振り返りをしましょう",
          tag: "ippo-pm",
        });
        await markSent(s.user_id, "pm", dateKey);
        sentCount++;
      }
    }

    return new Response(
      JSON.stringify({ ok: true, processed, sent: sentCount }),
      { headers: { "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error(e);
    return new Response(
      JSON.stringify({ ok: false, error: String(e) }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
});
