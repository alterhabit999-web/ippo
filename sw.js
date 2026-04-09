const CACHE_NAME = "ippo-v1";
const ASSETS = [
  "./index.html",
  "./manifest.json",
  "./logo192.png",
  "./apple-touch-icon.png"
];

// インストール：アプリシェルをキャッシュ
self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

// アクティベート：古いキャッシュを削除
self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// フェッチ：ネットワーク優先、失敗時にキャッシュから返す
self.addEventListener("fetch", (e) => {
  // Supabase APIはキャッシュしない
  if (e.request.url.includes("supabase.co")) return;

  e.respondWith(
    fetch(e.request)
      .then((res) => {
        // 成功したレスポンスをキャッシュに保存
        const clone = res.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(e.request, clone));
        return res;
      })
      .catch(() => caches.match(e.request))
  );
});
