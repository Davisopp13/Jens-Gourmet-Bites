import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
test("admin worker activates updates, shows generic pushes, keeps links internal and never caches private data", async () => {
  const handlers: Record<string, (event: any) => void> = {};
  const shown: any[] = [];
  const opened: string[] = [];
  const cached: string[] = [];
  let claimed = false;
  let skipped = false;
  let pending: Promise<unknown> = Promise.resolve();
  const self = {
    location: { origin: "https://jensgourmetbites.com" },
    addEventListener: (name: string, fn: (e: any) => void) => {
      handlers[name] = fn;
    },
    skipWaiting: async () => {
      skipped = true;
    },
    registration: {
      showNotification: async (title: string, options: any) => {
        shown.push({ title, ...options });
      },
    },
    clients: {
      claim: async () => {
        claimed = true;
      },
      matchAll: async () => [],
      openWindow: async (url: string) => {
        opened.push(url);
      },
    },
  };
  runInNewContext(readFileSync("public/admin-sw.js", "utf8"), {
    self,
    URL,
    Response,
    caches: {
      open: async () => ({
        add: async (url: string) => {
          cached.push(url);
        },
      }),
      keys: async () => [],
      match: async () => new Response("offline"),
    },
    fetch: async () => {
      throw Error("offline");
    },
  });
  const waitUntil = (p: Promise<unknown>) => {
    pending = p;
  };
  handlers.install({ waitUntil });
  await pending;
  handlers.activate({ waitUntil });
  await pending;
  assert.equal(skipped, true);
  assert.equal(claimed, true);
  assert.deepEqual(cached, ["/admin-offline.html"]);
  handlers.push({
    waitUntil,
    data: { json: () => ({ url: "https://evil.test/" }) },
  });
  await pending;
  assert.equal(shown[0].data.url, "/admin/inquiries");
  assert.match(shown[0].body, /new inquiry/);
  handlers.notificationclick({
    waitUntil,
    notification: { close() {}, data: { url: "//evil.test/" } },
  });
  await pending;
  assert.deepEqual(opened, ["https://jensgourmetbites.com/admin/inquiries"]);
  const id = "cccccccc-cccc-4ccc-8ccc-cccccccccccc";
  handlers.notificationclick({
    waitUntil,
    notification: { close() {}, data: { url: `/admin/inquiries/${id}` } },
  });
  await pending;
  assert.equal(opened[1], `https://jensgourmetbites.com/admin/inquiries/${id}`);
  let intercepted = false;
  handlers.fetch({
    request: {
      mode: "cors",
      url: "https://jensgourmetbites.com/api/admin/inquiries",
    },
    respondWith() {
      intercepted = true;
    },
  });
  assert.equal(intercepted, false);
  handlers.fetch({ request: { mode: "navigate" }, respondWith: waitUntil });
  await pending;
});
