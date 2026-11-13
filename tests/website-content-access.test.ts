import { test } from "node:test";
import assert from "node:assert/strict";
import { isWebsiteContentAdmin } from "../lib/website-content-access";

test("additional content editors preserve existing editors and reject others", () => {
  const jen = "19676e9c-a95c-46b1-b5e5-f77637a1e23e";
  assert.equal(isWebsiteContentAdmin({ id: "existing" }, "existing, other", jen), true);
  assert.equal(isWebsiteContentAdmin({ id: jen }, "existing, other", jen), true);
  assert.equal(isWebsiteContentAdmin({ id: jen, is_anonymous: true }, "existing", jen), false);
  assert.equal(isWebsiteContentAdmin({ id: "visitor" }, "existing", jen), false);
  assert.equal(isWebsiteContentAdmin({ id: "existing" }, " existing "), true);
  assert.equal(isWebsiteContentAdmin({ id: jen }, undefined, jen), true);
  assert.equal(isWebsiteContentAdmin({ id: jen }, undefined), false);
});
