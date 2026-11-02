const CACHE = "jgb-site-offline-v1";
const OFFLINE_URL = "/site-offline.html";

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.add(OFFLINE_URL)));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(
    keys.filter((key) => key.startsWith("jgb-site-offline-") && key !== CACHE)
      .map((key) => caches.delete(key))
  )));
});

self.addEventListener("fetch", (event) => {
  const path = new URL(event.request.url).pathname;
  if (event.request.mode !== "navigate" || path === "/admin" || path.startsWith("/admin/")) return;
  event.respondWith(fetch(event.request).catch(async () => {
    return (await caches.match(OFFLINE_URL)) || Response.error();
  }));
});
