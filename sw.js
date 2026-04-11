const CACHE_NAME = "ippo-v2"; // バージョンを上げると古いキャッシュが自動削除される

const SHELL_ASSETS = [
  "./manifest.json",
  "./logo192.png",
  "./apple-touch-icon.png",
];

// インストール：アプリシェルをキャッシュ
self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_ASSETS))
  );
  self.skipWaiting(); // 即座に新しいSWに切り替え
});

// アクティベート：古いバージョンのキャッシュをすべて削除
self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// フェッチ処理
self.addEventListener("fetch", (e) => {
  const url = e.request.url;

  // Supabase APIはキャッシュしない（常にネットワーク直通）
  if (url.includes("supabase.co")) return;

  // GETリクエスト以外はキャッシュしない
  if (e.request.method !== "GET") return;

  // HTMLページ（画面遷移）は常に最新をネットワークから取得
  // → デプロイ後に古い画面が表示される問題を防ぐ
  if (e.request.mode === "navigate") {
    e.respondWith(
      fetch(e.request, { cache: "no-store" })
        .then((res) => {
          const clone = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(e.request, clone));
          return res;
        })
        .catch(() => caches.match(e.request)) // オフライン時はキャッシュから返す
    );
    return;
  }

  // JS・CSS・画像など：ネットワーク優先、失敗時はキャッシュから返す
  e.respondWith(
    fetch(e.request)
      .then((res) => {
        if (res.ok) {
          const clone = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(e.request, clone));
        }
        return res;
      })
      .catch(() => caches.match(e.request))
  );
});

// アプリからの「今すぐ更新して」メッセージを受け取る
self.addEventListener("message", (e) => {
  if (e.data === "SKIP_WAITING") {
    self.skipWaiting();
  }
});
