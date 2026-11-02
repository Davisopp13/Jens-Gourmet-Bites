const CACHE = "jgb-admin-offline-v1";
const OFFLINE_URL = "/admin-offline.html";

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.add(OFFLINE_URL))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter(
              (key) => key.startsWith("jgb-admin-offline-") && key !== CACHE,
            )
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.mode !== "navigate") return;
  event.respondWith(
    fetch(event.request).catch(async () => {
      return (await caches.match(OFFLINE_URL)) || Response.error();
    }),
  );
});

// Notification text never contains customer details. Admin pages remain network-only.
self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    /* use generic fallback */
  }
  const url =
    typeof data.url === "string" &&
    /^\/admin\/inquiries(?:\/[0-9a-f-]{36})?$/.test(data.url)
      ? data.url
      : "/admin/inquiries";
  event.waitUntil(
    self.registration.showNotification(data.title || "Jen’s Gourmet Bites", {
      body: data.body || "A new inquiry is waiting.",
      icon: "/admin-icons/kitchen-192.png",
      tag: data.tag || "inquiry",
      data: { url },
    }),
  );
});
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const path = event.notification.data?.url;
  const url = new URL(
    typeof path === "string" &&
    /^\/admin\/inquiries(?:\/[0-9a-f-]{36})?$/.test(path)
      ? path
      : "/admin/inquiries",
    self.location.origin,
  ).href;
  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then(async (clients) => {
        const existing = clients.find(
          (client) =>
            new URL(client.url).origin === self.location.origin &&
            new URL(client.url).pathname.startsWith("/admin"),
        );
        if (existing) {
          await existing.navigate(url);
          return existing.focus();
        }
        return self.clients.openWindow(url);
      }),
  );
});
