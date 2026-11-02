import { test } from 'node:test';
import assert from 'node:assert/strict';
import { NextRequest } from 'next/server';
import { POST } from '../app/api/contact/route';

const valid = { name: 'Test Customer', email: 'customer@example.com', message: 'One batch please', preferred_format: 'baked' };
type Call = { url: string; body: Record<string, string> };

test('notification uses branded sender, fixed recipient, customer reply address, and escaped HTML', async () => {
  await withProvider({}, async (calls) => {
    const result = await submit({ ...valid, name: '<b>Customer</b>', message: '<img src=x> & cookies' });
    assert.equal(result.status, 200);
    assert.deepEqual(await result.json(), { success: true });
    assert.equal(calls.length, 2);
    const mail = calls.find(call => call.url === 'https://api.resend.com/emails')!.body;
    assert.equal(mail.from, "Jen's Gourmet Bites <orders@jensgourmetbites.com>");
    assert.equal(mail.to, 'jensgourmetbites@gmail.com');
    assert.equal(mail.reply_to, valid.email);
    assert.match(mail.html, /&lt;img src=x&gt; &amp; cookies/);
    assert.doesNotMatch(mail.html, /<img src=x>/);
    assert.match(mail.text, /<img src=x> & cookies/);
  });
});
test('missing config, provider rejection, missing IDs, and network failures never report success', async () => {
  for (const mode of ['missing-key', 'rejected', 'missing-id', 'throw'] as const) {
    await withProvider({ mode }, async (calls) => {
      const result = await submit(valid);
      assert.equal(result.status, 503, mode);
      const body = await result.json();
      assert.equal(body.success, undefined);
      assert.match(body.error, /jensgourmetbites@gmail.com/);
      assert.doesNotMatch(body.error, /secret-provider-body/);
      if (mode === 'missing-key') assert.equal(calls.length, 0);
    });
  }
});
test('database failure still attempts delivery; total failure returns an error', async () => {
  for (const mode of [undefined, 'rejected'] as const) {
    await withProvider({ dbFailure: true, mode }, async (calls) => {
      assert.equal((await submit(valid)).status, mode ? 503 : 200);
      assert.equal(calls.length, 2);
    });
  }
});
test('invalid input is rejected before saving or sending', async () => {
  await withProvider({}, async (calls) => {
    for (const body of [{ ...valid, email: 'bad' }, { ...valid, name: ' ' }, { ...valid, phone: {} }, { ...valid, message: 'x'.repeat(10001) }, { ...valid, preferred_format: ['baked'] }]) {
      assert.equal((await submit(body)).status, 400);
    }
    assert.equal(calls.length, 0);
  });
});
function submit(body: unknown) {
  return POST(new NextRequest('https://jensgourmetbites.com/api/contact', { method: 'POST', body: JSON.stringify(body), headers: { 'Content-Type': 'application/json' } }));
}
async function withProvider(options: { mode?: 'missing-key' | 'rejected' | 'missing-id' | 'throw'; dbFailure?: boolean }, run: (calls: Call[]) => Promise<void>) {
  const originalFetch = globalThis.fetch;
  const keys = ['RESEND_API_KEY', 'CONTACT_EMAIL', 'CONTACT_FROM_EMAIL', 'NEXT_PUBLIC_SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'];
  const saved = Object.fromEntries(keys.map(key => [key, process.env[key]]));
  process.env.RESEND_API_KEY = options.mode === 'missing-key' ? '' : 're_test_only';
  process.env.CONTACT_EMAIL = 'jensgourmetbites@gmail.com';
  process.env.CONTACT_FROM_EMAIL = "Jen's Gourmet Bites <orders@jensgourmetbites.com>";
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://synthetic.supabase.co';
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'synthetic';
  const calls: Call[] = [];
  globalThis.fetch = async (input, init) => {
    const url = String(input);
    calls.push({ url, body: JSON.parse(String(init?.body)) });
    if (url === 'https://api.resend.com/emails') {
      if (options.mode === 'throw') throw new Error('secret-provider-body');
      if (options.mode === 'rejected') return Response.json({ name: 'validation_error', message: 'secret-provider-body' }, { status: 403 });
      return Response.json(options.mode === 'missing-id' ? {} : { id: 'test-email-id' });
    }
    assert.match(url, /^https:\/\/synthetic\.supabase\.co\/rest\/v1\/contact_submissions/);
    return options.dbFailure ? Response.json({ code: 'test_failure', message: 'synthetic failure' }, { status: 500 }) : new Response(null, { status: 201 });
  };
  try { await run(calls); }
  finally {
    globalThis.fetch = originalFetch;
    for (const key of keys) {
      if (saved[key] === undefined) delete process.env[key];
      else process.env[key] = saved[key];
    }
  }
}
