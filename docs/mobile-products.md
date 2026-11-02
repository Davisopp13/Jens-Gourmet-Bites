# Mobile Admin Products

Below 1024px, `/admin/products` shows stacked cards with the product photo or cookie fallback, wrapping name, batch size, price, display order, Active/Hidden and Featured/Regular controls, and labeled Edit/Delete actions. From 1024px upward it retains the six-column table. The heading stacks above a full-width Add Product button below 640px.

Both layouts share the existing mutation handlers, state, confirmation, and ordering. Controls have at least 44px touch targets, visible keyboard focus, product-specific accessible names, and toggle pressed/busy states. Empty-list behavior is preserved. No API, product schema, database, notification, or environment changes are required.

This release preserves the newer production admin header, including Home Note, Inquiries and push-aware sign-out. Its wrapping layout already resolves the tablet overflow seen in the older local checkout. The unrelated unpublished Website Content navigation is excluded.

## Validation

- The selected implementation passed lint, TypeScript and an isolated production build, plus signed-in Chrome layout checks at 320, 390, 640, 768, 1023, 1024 and 1440px. All visible product controls met the 44px minimum.
- A disposable local harness using the real ProductTable source and an in-memory persistence boundary covered every status combination, photos and missing images, long/unbroken names, toggles and loading, keyboard focus, edit navigation, delete confirmation/cancellation, and empty states. No real catalog data was changed.
- The focused release on current production source passed lint, TypeScript, production build and all seven rendered viewport checks with the current admin header and Inquiries link. Document width equals viewport width, card/table visibility follows the 1024px breakpoint, and every visible product action meets the 44px minimum. Post-deployment verification covers these same layouts and edit navigation without saving changes.
- Physical iPhone/Safari verification remains separate from Chrome viewport checks.

Release evidence and screenshots are retained in the original workspace under `output/mobile-products-release-2026-11-02/`; earlier interaction evidence is under `output/mobile-products-2026-11-02/`. The original dirty redesign checkout is preserved. For rollback, revert the focused Products commit; no data rollback is needed.
