import { test } from "node:test";
import assert from "node:assert/strict";
import { NextRequest } from "next/server";
import { POST } from "../app/api/contact/route";
import { deliverNotifications } from "../lib/inquiries/notifications";
import { adminAllowed, safeInquiryReturn } from "../lib/inquiries/types";
import {
  pushEndpointAllowed,
  subscriptionSchema,
} from "../lib/inquiries/validation";
const id = "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
  admin = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const valid = {
  submission_id: id,
  name: "Test Customer",
  email: "customer@example.com",
  message: "One batch please",
  preferred_format: "baked",
};
function submit(body: unknown) {
  return POST(
    new NextRequest("https://jensgourmetbites.com/api/contact", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  );
}
type Options = {
  dbFail?: boolean;
  emailFail?: boolean;
  claimFail?: boolean;
  push?: boolean;
  missingKey?: boolean;
};
async function withProvider(
  options: Options,
  run: (calls: { url: string; body: any; headers: Headers }[]) => Promise<void>,
) {
  const original = globalThis.fetch;
  const saved = { ...process.env };
  let persisted = { ...valid };
  const calls: { url: string; body: any; headers: Headers }[] = [];
  Object.assign(process.env, {
    NEXT_PUBLIC_SUPABASE_URL: "https://synthetic.supabase.co",
    SUPABASE_SERVICE_ROLE_KEY: "synthetic",
    INQUIRY_ADMIN_USER_IDS: admin,
    RESEND_API_KEY: options.missingKey ? "" : "re_test",
    NEXT_PUBLIC_SITE_URL: "https://jensgourmetbites.com",
  });
  globalThis.fetch = async (input, init) => {
    const request = new Request(input, init);
    const url = request.url;
    const body =
      request.method === "GET"
        ? null
        : JSON.parse((await request.text()) || "null");
    calls.push({ url, body, headers: request.headers });
    const response = (value: unknown, status = 200) =>
      new Response(JSON.stringify(value), {
        status,
        headers: { "Content-Type": "application/json" },
      });
    if (url.endsWith("/rpc/create_inquiry")) {
      persisted = { ...valid, name: body.p_name, message: body.p_message };
      return options.dbFail ? response({ code: "db_down" }, 503) : response(id);
    }
    if (url.endsWith("/rpc/claim_inquiry_notifications"))
      return options.claimFail
        ? response({ code: "db_down" }, 503)
        : response([
            { id: "email-job", channel: "email" },
            ...(options.push
              ? [{ id: "push-job", channel: "push", subscription_id: id }]
              : []),
          ]);
    if (url.includes("/contact_submissions?"))
      return response({ ...persisted, id, phone: null });
    if (url.includes("/inquiry_push_subscriptions?"))
      return response({
        id,
        user_id: admin,
        endpoint: "https://web.push.apple.com/device",
        keys: { p256dh: "synthetic", auth: "synthetic" },
      });
    if (url.includes("/inquiry_notifications?")) return response(null);
    if (url === "https://api.resend.com/emails")
      return options.emailFail
        ? response({ message: "secret-provider-body" }, 503)
        : response({ id: "provider-email" });
    throw new Error("Unexpected network call " + url);
  };
  try {
    await run(calls);
  } finally {
    globalThis.fetch = original;
    for (const k of Object.keys(process.env))
      if (!(k in saved)) delete process.env[k];
    Object.assign(process.env, saved);
  }
}
test("saved inquiry uses stable submission key, escaped branded email and authenticated link", async () => {
  await withProvider({}, async (calls) => {
    const r = await submit({
      ...valid,
      name: "<b>Customer</b>",
      message: "<img src=x> & cookies",
    });
    assert.equal(r.status, 200);
    assert.deepEqual(await r.json(), { success: true, inquiry_id: id });
    const create = calls.find((c) => c.url.endsWith("/rpc/create_inquiry"))!;
    assert.equal(create.body.p_submission_id, id);
    assert.equal(create.body.p_fingerprint.length, 64);
    const mail = calls.find((c) => c.url === "https://api.resend.com/emails")!;
    assert.equal(mail.body.reply_to, valid.email);
    assert.equal(
      mail.body.from,
      "Jen's Gourmet Bites <orders@jensgourmetbites.com>",
    );
    assert.equal(mail.body.to, "jensgourmetbites@gmail.com");
    assert.match(mail.body.html, /&lt;img src=x&gt;/);
    assert.doesNotMatch(mail.body.html, /<img/);
    assert.match(mail.body.text, new RegExp(`/admin/inquiries/${id}`));
    assert.equal(mail.headers.get("Idempotency-Key"), "inquiry/email-job");
  });
});
test("database save failure sends no email and reports failure", async () => {
  await withProvider({ dbFail: true }, async (calls) => {
    assert.equal((await submit(valid)).status, 503);
    assert.equal(calls.length, 1);
  });
});
test("saved inquiries remain successful on email, configuration, and claim failures", async () => {
  for (const options of [
    { emailFail: true },
    { missingKey: true },
    { claimFail: true },
  ])
    await withProvider(options, async (calls) => {
      assert.equal((await submit(valid)).status, 200);
      if (!options.claimFail)
        assert.equal(
          calls.find((c) => c.url.includes("/inquiry_notifications?"))!.body
            .state,
          "failed",
        );
    });
});
test("push and email fail independently; revoked devices are removed", async () => {
  await withProvider({ emailFail: true, push: true }, async (calls) => {
    let pushes = 0;
    await deliverNotifications(id, async () => {
      pushes++;
      return {} as any;
    });
    assert.equal(pushes, 1);
    assert.equal(
      calls.find((c) => c.url.includes("id=eq.push-job"))!.body.state,
      "accepted",
    );
    assert.equal(
      calls.find((c) => c.url.includes("id=eq.email-job"))!.body.state,
      "failed",
    );
  });
  await withProvider({ push: true }, async (calls) => {
    await deliverNotifications(id, async () => {
      throw Object.assign(new Error("secret"), { statusCode: 410 });
    });
    assert.equal(
      calls.find((c) => c.url.includes("id=eq.email-job"))!.body.state,
      "accepted",
    );
    assert.equal(
      calls.find((c) => c.url.includes("id=eq.push-job"))!.body.last_error,
      "device_expired",
    );
    assert.ok(
      calls.some(
        (c) =>
          c.url.includes("/inquiry_push_subscriptions?") && c.body === null,
      ),
    );
  });
});
test("invalid input is rejected before persistence or delivery", async () => {
  await withProvider({}, async (calls) => {
    for (const body of [
      { ...valid, name: " " },
      { ...valid, email: "bad" },
      { ...valid, phone: {} },
      { ...valid, message: "x".repeat(10001) },
      { ...valid, submission_id: "bad" },
    ])
      assert.equal((await submit(body)).status, 400);
    assert.equal(calls.length, 0);
  });
});
test("admin allowlist, sign-in returns and push endpoint validation", () => {
  const saved = process.env.INQUIRY_ADMIN_USER_IDS;
  process.env.INQUIRY_ADMIN_USER_IDS = admin;
  try {
    assert.equal(adminAllowed({ id: admin }), true);
    assert.equal(adminAllowed({ id: admin, is_anonymous: true }), false);
    assert.equal(adminAllowed({ id: id }), false);
  } finally {
    if (saved === undefined) delete process.env.INQUIRY_ADMIN_USER_IDS;
    else process.env.INQUIRY_ADMIN_USER_IDS = saved;
  }
  assert.equal(
    safeInquiryReturn(`/admin/inquiries/${id}`),
    `/admin/inquiries/${id}`,
  );
  for (const path of [
    "//evil.test",
    "https://evil.test",
    "/admin/inquiries/../products",
  ])
    assert.equal(safeInquiryReturn(path), "/admin/products");
  assert.equal(pushEndpointAllowed("https://web.push.apple.com/Q/test"), true);
  for (const path of [
    "http://web.push.apple.com",
    "https://127.0.0.1/",
    "https://web.push.apple.com.evil.test",
    "https://web.push.apple.com:444/",
    "https://user@web.push.apple.com/",
  ])
    assert.equal(pushEndpointAllowed(path), false);
  assert.equal(
    subscriptionSchema.safeParse({
      endpoint: "https://web.push.apple.com/device",
      keys: { p256dh: "a".repeat(87), auth: "b".repeat(22) },
    }).success,
    true,
  );
});
