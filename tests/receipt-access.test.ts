import test from "node:test";
import assert from "node:assert/strict";
import { isReceiptAdmin } from "../lib/receipts/access";

test("receipt tools deny missing configuration and unlisted accounts", () => {
  assert.equal(isReceiptAdmin("new-signup", undefined), false);
  assert.equal(isReceiptAdmin("new-signup", "jen,davis"), false);
  assert.equal(isReceiptAdmin("", ""), false);
  assert.equal(isReceiptAdmin("jen", " jen, davis "), true);
  assert.equal(isReceiptAdmin("davis", "jen,davis"), true);
});
