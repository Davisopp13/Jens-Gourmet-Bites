import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { resolve } from "node:path";
import { runInNewContext } from "node:vm";
import ts from "typescript";
import { createClient } from "@supabase/supabase-js";
import { adminAllowed } from "../lib/inquiries/types";

// Execute the real modules, substituting only framework/session/browser boundaries.
// No real sessions, remote database, push service, or browser profile is used.
function loadModule<T>(
  path: string,
  modules: Record<string, unknown> = {},
  globals: Record<string, unknown> = {},
): T {
  const filename = resolve(path);
  const output = ts.transpileModule(readFileSync(filename, "utf8"), {
    fileName: filename,
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      jsx: ts.JsxEmit.ReactJSX,
      esModuleInterop: true,
    },
  });
  const nativeRequire = createRequire(filename);
  const exports = {};
  runInNewContext(
    output.outputText,
    {
      exports,
      require: (id: string) =>
        Object.hasOwn(modules, id) ? modules[id] : nativeRequire(id),
      console,
      URL,
      AbortController,
      setTimeout,
      clearTimeout,
      ...globals,
    },
    { filename },
  );
  return exports as T;
}

const owner = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const other = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const endpoint = "https://web.push.apple.com/synthetic-owner-device";
const otherEndpoint = "https://web.push.apple.com/synthetic-other-device";
const origin = "https://jensgourmetbites.com";
type User = { id: string; is_anonymous?: boolean };
type PushRoute = {
  GET(): Promise<Response>;
  POST(request: Request): Promise<Response>;
  DELETE(request: Request): Promise<Response>;
};

function routeHarness(user: User | null = { id: owner }, sessionError = false) {
  const rows = [
    { user_id: owner, endpoint },
    { user_id: other, endpoint: otherEndpoint },
  ];
  const requests: Request[] = [];
  const db = createClient(
    "https://synthetic.supabase.co",
    "synthetic-service-role",
    {
      auth: { persistSession: false, autoRefreshToken: false },
      global: {
        fetch: async (input, init) => {
          const request = new Request(input, init);
          requests.push(request);
          const url = new URL(request.url);
          assert.equal(url.pathname, "/rest/v1/inquiry_push_subscriptions");
          assert.equal(request.method, "DELETE");
          const index = rows.findIndex(
            (row) =>
              url.searchParams.get("endpoint") === `eq.${row.endpoint}` &&
              url.searchParams.get("user_id") === `eq.${row.user_id}`,
          );
          if (index >= 0) rows.splice(index, 1);
          return new Response(null, { status: 204 });
        },
      },
    },
  );
  const server = loadModule<Record<string, unknown>>(
    "lib/inquiries/server.ts",
    {
      "@/lib/supabase/server": {
        createClient: async () => ({
          auth: {
            getUser: async () => ({
              data: { user },
              error: sessionError ? new Error("invalid session") : null,
            }),
          },
        }),
      },
      "@/lib/supabase/admin": { createAdminClient: () => db },
      "./types": { adminAllowed },
    },
  );
  const modules = {
    "@/lib/inquiries/server": server,
    "@/lib/supabase/admin": { createAdminClient: () => db },
  };
  const route = loadModule<PushRoute>("app/api/admin/push/route.ts", modules);
  const inquiries = loadModule<{ GET(request: Request): Promise<Response> }>(
    "app/api/admin/inquiries/route.ts",
    modules,
  );
  function remove(device = endpoint, requestOrigin: string | null = origin) {
    return route.DELETE(
      new Request(`${origin}/api/admin/push`, {
        method: "DELETE",
        headers: requestOrigin === null ? {} : { origin: requestOrigin },
        body: JSON.stringify({ endpoint: device }),
      }),
    );
  }
  return { route, inquiries, remove, rows, requests };
}

async function withAllowlist(ids: string, run: () => Promise<void>) {
  const saved = process.env.INQUIRY_ADMIN_USER_IDS;
  process.env.INQUIRY_ADMIN_USER_IDS = ids;
  try {
    await run();
  } finally {
    if (saved === undefined) delete process.env.INQUIRY_ADMIN_USER_IDS;
    else process.env.INQUIRY_ADMIN_USER_IDS = saved;
  }
}

test("revoked inquiry owner can remove their own device without regaining inquiry or registration access", async () => {
  await withAllowlist(other, async () => {
    const h = routeHarness();
    assert.equal((await h.route.GET()).status, 403);
    assert.equal(
      (
        await h.route.POST(
          new Request(`${origin}/api/admin/push`, {
            method: "POST",
            headers: { origin },
            body: "{}",
          }),
        )
      ).status,
      403,
    );
    assert.equal(
      (await h.inquiries.GET(new Request(`${origin}/api/admin/inquiries`)))
        .status,
      403,
    );
    assert.equal(h.requests.length, 0);
    const result = await h.remove();
    assert.equal(result.status, 200);
    assert.equal(result.headers.get("Cache-Control"), "private, no-store");
    assert.deepEqual(h.rows, [{ user_id: other, endpoint: otherEndpoint }]);
    assert.equal((await h.remove()).status, 200); // idempotent cleanup
  });
});

test("both current and revoked owners cannot delete another account's subscription", async () => {
  for (const ids of [owner, other, ""])
    await withAllowlist(ids, async () => {
      const h = routeHarness();
      assert.equal((await h.remove(otherEndpoint)).status, 200);
      assert.equal(h.rows.length, 2);
      const query = new URL(h.requests[0].url).searchParams;
      assert.equal(query.get("user_id"), `eq.${owner}`);
      assert.equal(query.get("endpoint"), `eq.${otherEndpoint}`);
    });
});

test("push cleanup still rejects invalid sessions, anonymous users, cross-origin writes and invalid input", async () => {
  await withAllowlist(owner, async () => {
    for (const [user, error] of [
      [null, false],
      [{ id: owner, is_anonymous: true }, false],
      [{ id: owner }, true],
    ] as const) {
      const h = routeHarness(user, error);
      assert.equal((await h.remove()).status, 401);
      assert.equal(h.requests.length, 0);
    }
    const h = routeHarness();
    for (const requestOrigin of ["https://evil.example", null])
      assert.equal((await h.remove(endpoint, requestOrigin)).status, 403);
    assert.equal(
      (
        await h.route.DELETE(
          new Request(`${origin}/api/admin/push`, {
            method: "DELETE",
            headers: { origin },
            body: JSON.stringify({ endpoint: 123 }),
          }),
        )
      ).status,
      400,
    );
    assert.equal(h.requests.length, 0);
  });
});

type Cleanup = { disableDevicePush(): Promise<void> };
type CleanupOptions = {
  request?: (input: string, init: RequestInit) => Promise<Response>;
  unsubscribe?: () => Promise<boolean>;
  noSubscription?: boolean;
  noServiceWorker?: boolean;
  lookup?: () => Promise<unknown>;
};
function browserHarness(options: CleanupOptions = {}) {
  let unsubscribed = 0;
  let timer: (() => void) | undefined;
  let signal: AbortSignal | undefined;
  const calls: string[] = [];
  const cleanup = loadModule<Cleanup>(
    "components/admin/PushSettings.tsx",
    {},
    {
      navigator: options.noServiceWorker
        ? {}
        : {
            serviceWorker: {
              getRegistration:
                options.lookup ||
                (async (scope: string) => {
                  assert.equal(scope, "/admin");
                  return {
                    pushManager: {
                      getSubscription: async () =>
                        options.noSubscription
                          ? null
                          : {
                              endpoint,
                              unsubscribe: async () => {
                                unsubscribed++;
                                calls.push("unsubscribe");
                                return options.unsubscribe
                                  ? options.unsubscribe()
                                  : true;
                              },
                            },
                    },
                  };
                }),
            },
          },
      fetch: async (input: string, init: RequestInit) => {
        calls.push("delete");
        signal = init.signal as AbortSignal;
        assert.equal(input, "/api/admin/push");
        assert.equal(init.method, "DELETE");
        assert.equal(JSON.parse(init.body as string).endpoint, endpoint);
        return options.request
          ? options.request(input, init)
          : new Response(JSON.stringify({ success: true }));
      },
      setTimeout: (callback: () => void, ms: number) => {
        assert.equal(ms, 8000);
        timer = callback;
        return 1;
      },
      clearTimeout: () => {
        timer = undefined;
      },
    },
  );
  return {
    ...cleanup,
    calls,
    unsubscribed: () => unsubscribed,
    signal: () => signal,
    timeOut: () => {
      assert.ok(timer);
      timer();
    },
    timerCleared: () => timer === undefined,
  };
}

test("browser unsubscribe runs even for 403/503, offline and malformed server responses", async () => {
  for (const request of [
    async () =>
      new Response(JSON.stringify({ error: "denied" }), { status: 403 }),
    async () =>
      new Response(JSON.stringify({ error: "unavailable" }), { status: 503 }),
    async () => {
      throw new Error("offline");
    },
    async () => new Response("not json", { status: 502 }),
  ]) {
    const h = browserHarness({ request });
    await assert.rejects(h.disableDevicePush());
    assert.equal(h.unsubscribed(), 1);
    assert.equal(h.timerCleared(), true);
  }
});

test("server removal runs despite browser unsubscribe rejection or false result", async () => {
  for (const unsubscribe of [
    async () => false,
    async () => {
      throw new Error("browser failure");
    },
  ]) {
    const h = browserHarness({ unsubscribe });
    await assert.rejects(
      h.disableDevicePush(),
      /cleanup could not be confirmed/,
    );
    assert.equal(h.calls.filter((c) => c === "delete").length, 1);
    assert.equal(h.timerCleared(), true);
  }
});

test("successful cleanup and devices with no push support/subscription finish without a warning", async () => {
  for (const options of [
    {},
    { noSubscription: true },
    { noServiceWorker: true },
  ]) {
    const h = browserHarness(options);
    await h.disableDevicePush();
    assert.equal(h.unsubscribed(), Object.keys(options).length ? 0 : 1);
    assert.equal(h.timerCleared(), true);
  }
});

test("stalled server, unsubscribe, and service-worker lookup cannot indefinitely block sign-out", async () => {
  for (const options of [
    { request: () => new Promise<Response>(() => {}) },
    { unsubscribe: () => new Promise<boolean>(() => {}) },
    { lookup: () => new Promise<unknown>(() => {}) },
  ]) {
    const h = browserHarness(options);
    const pending = h.disableDevicePush();
    await new Promise<void>((resolve) => setImmediate(resolve));
    h.timeOut();
    await assert.rejects(pending, /timed out/);
    if (!options.lookup) assert.equal(h.signal()?.aborted, true);
    assert.equal(h.timerCleared(), true);
  }
});

type Element = {
  props?: {
    children?: Element | Element[];
    "aria-label"?: string;
    onClick?: () => Promise<void>;
    disabled?: boolean;
  };
};
function signOutButton(element: Element): Element["props"] {
  if (element?.props?.["aria-label"] === "Sign out") return element.props;
  for (const child of [element?.props?.children].flat(Infinity) as Element[]) {
    if (!child || typeof child !== "object") continue;
    const found = signOutButton(child);
    if (found) return found;
  }
  return undefined;
}
function headerHarness(
  disableDevicePush: () => Promise<void>,
  signOut = async () => ({ error: null as Error | null }),
) {
  const calls: string[] = [];
  const alerts: string[] = [];
  let busy = false;
  const Header = loadModule<{ default(props: object): Element }>(
    "components/admin/AdminHeader.tsx",
    {
      react: {
        useState: () => [
          busy,
          (value: boolean) => {
            busy = value;
          },
        ],
      },
      "next/link": () => null,
      "next/navigation": {
        useRouter: () => ({
          replace: (path: string) => {
            calls.push(path);
          },
          refresh: () => {
            calls.push("refresh");
          },
        }),
      },
      "./InquiryNav": () => null,
      "./PushSettings": { disableDevicePush },
      "@/lib/supabase/client": {
        createClient: () => ({
          auth: {
            signOut: async () => {
              calls.push("signOut");
              return signOut();
            },
          },
        }),
      },
    },
    {
      window: {
        alert: (message: string) => {
          alerts.push(message);
        },
      },
    },
  );
  const button = () => {
    const result = signOutButton(Header.default({}));
    assert.ok(result, "The header must render its sign-out control");
    return result;
  };
  return { button, calls, alerts };
}

test("revoked owner flow removes their device, unsubscribes, signs out and replaces the admin page", async () => {
  await withAllowlist(other, async () => {
    const route = routeHarness();
    const browser = browserHarness({
      request: async (_input, init) =>
        route.route.DELETE(
          new Request(`${origin}/api/admin/push`, {
            ...init,
            headers: { origin, "Content-Type": "application/json" },
          }),
        ),
    });
    const header = headerHarness(browser.disableDevicePush);
    await header.button().onClick!();
    assert.equal(browser.unsubscribed(), 1);
    assert.equal(
      route.rows.some((row) => row.user_id === owner),
      false,
    );
    assert.deepEqual(header.calls, ["signOut", "/admin/login", "refresh"]);
    assert.deepEqual(header.alerts, []);
    assert.equal(header.button().disabled, false);
  });
});

test("normal allowed-owner sign-out also cleans both subscriptions before navigation", async () => {
  await withAllowlist(owner, async () => {
    const route = routeHarness();
    const browser = browserHarness({ request: async () => route.remove() });
    const header = headerHarness(browser.disableDevicePush);
    await header.button().onClick!();
    assert.equal(browser.unsubscribed(), 1);
    assert.equal(route.rows.length, 1);
    assert.deepEqual(header.calls, ["signOut", "/admin/login", "refresh"]);
    assert.deepEqual(header.alerts, []);
  });
});

test("failed or stalled push cleanup still signs out with actionable warning and re-enables the button", async () => {
  const browser = browserHarness({
    request: () => new Promise<Response>(() => {}),
  });
  const h = headerHarness(browser.disableDevicePush);
  const pending = h.button().onClick!();
  assert.equal(h.button().disabled, true);
  await new Promise<void>((resolve) => setImmediate(resolve));
  browser.timeOut();
  await pending;
  assert.equal(browser.unsubscribed(), 1);
  assert.deepEqual(h.calls, ["signOut", "/admin/login", "refresh"]);
  assert.match(h.alerts[0], /signed out.*device’s settings/);
  assert.equal(h.button().disabled, false);
  const failed = headerHarness(async () => {
    throw new Error("403");
  });
  await failed.button().onClick!();
  assert.deepEqual(failed.calls, ["signOut", "/admin/login", "refresh"]);
  assert.equal(failed.alerts.length, 1);
});

test("Supabase returned errors or thrown failures do not claim success or navigate away", async () => {
  for (const signOut of [
    async () => ({ error: new Error("auth unavailable") }),
    async (): Promise<{ error: Error | null }> => {
      throw new Error("network failure");
    },
  ]) {
    const h = headerHarness(async () => {}, signOut);
    await h.button().onClick!();
    assert.deepEqual(h.calls, ["signOut"]);
    assert.match(h.alerts[0], /Sign-out could not be completed/);
    assert.equal(h.button().disabled, false);
  }
});
