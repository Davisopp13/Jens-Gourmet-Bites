import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readReceipt } from '../lib/receipts/reader';
const extracted = { store: 'Test store', location: null, purchased_on: '2026-10-28', total_cents: 649, tax_cents: 0, warnings: [], lines: [{ description: 'Flour', quantity: 1, net_cents: 649, package_quantity: null, unit: null, exact_product: null, on_sale: false }] };
const provider = (data: unknown) => async () => new Response(JSON.stringify({ status: 'completed', output: [{ content: [{ type: 'output_text', text: JSON.stringify(data) }] }] }));
test('extraction fills receipt facts without guessing package details or approving costs', async () => {
  const result = await readReceipt([], { apiKey: 'synthetic', fetch: provider(extracted) });
  assert.equal(result.data.total_cents, 649); assert.equal(result.data.store, 'Test store');
  assert.equal(result.data.lines[0].package_quantity, null); assert.equal(result.data.lines[0].ingredient_id, null);
  assert.equal(result.data.lines[0].confirmed, false); assert.equal(result.data.lines[0].use_for_pricing, false);
});
test('unknown amounts remain flagged and malformed extracted money is rejected', async () => {
  const result = await readReceipt([], { apiKey: 'synthetic', fetch: provider({...extracted, total_cents: null}) });
  assert.match(result.message, /unreadable/);
  await assert.rejects(readReceipt([], { apiKey: 'synthetic', fetch: provider({...extracted, total_cents: -1}) }));
});
test('connection failures give safe actionable messages without exposing provider bodies', async () => {
  for (const [status, pattern] of [[401,/key was rejected/],[403,/permission/],[429,/usage or billing/],[404,/model is unavailable/]] as const) {
    await assert.rejects(readReceipt([], { apiKey: 'synthetic', fetch: async () => new Response('private provider body', {status}) }), pattern);
  }
  await assert.rejects(readReceipt([], {apiKey: ''}), /needs an OpenAI API key/);
});
test('image/PDF request uses private inline inputs and structured output without tools', async () => {
  await readReceipt([{name:'test.pdf',type:'application/pdf',bytes:Buffer.from('%PDF-test')},{name:'test.png',type:'image/png',bytes:Buffer.from('image')}], {apiKey:'synthetic',fetch:async (url, init)=>{
    assert.equal(url,'https://api.openai.com/v1/responses');
    const body=JSON.parse(String(init?.body));assert.equal(body.store,false);assert.equal(body.tools,undefined);assert.equal(body.text.format.strict,true);
    assert.match(body.input[0].content[1].file_data,/^data:application\/pdf;base64,/);assert.equal(body.input[0].content[2].type,'input_image');
    return provider(extracted)();
  }});
});
