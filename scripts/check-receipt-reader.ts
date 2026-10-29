import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { readReceipt, ReceiptReaderError } from '../lib/receipts/reader';

async function main() {
  if (!process.env.OPENAI_API_KEY?.trim()) {
    console.error('Missing OPENAI_API_KEY. Add it to .env.local (not chat), then run this check again.');
    process.exitCode = 2;
    return;
  }
  // Only this clearly labeled synthetic fixture is sent. No business data is written.
  const bytes = await readFile(new URL('../output/receipt-build-2026-10-28/test-receipt.pdf', import.meta.url));
  const result = await readReceipt([{ name: 'synthetic-test-receipt.pdf', type: 'application/pdf', bytes }], {
    apiKey: process.env.OPENAI_API_KEY,
    model: process.env.RECEIPT_EXTRACTION_MODEL,
  });
  assert.equal(result.data.total_cents, 649, 'Synthetic receipt total should be $6.49');
  assert.equal(result.data.purchased_on, '2026-10-28', 'Synthetic purchase date should be read');
  assert.ok(result.data.lines.some(line => line.net_cents === 649), 'Synthetic flour item should be read');
  assert.ok(result.data.lines.every(line => !line.confirmed && !line.use_for_pricing), 'Reading must never approve prices');
  console.log('Receipt reader connected: synthetic PDF date, item and $6.49 total extracted. No ingredient prices or receipt records changed.');
}
main().catch(error => {
  console.error(error instanceof ReceiptReaderError ? error.message : 'Receipt-reader check failed. No prices were changed. Check model access or the synthetic extraction result.');
  process.exitCode = 1;
});
