import assert from "node:assert/strict";
import test from "node:test";
import {
  createPurchaseIntent,
  verifyPurchaseIntent,
} from "../../lib/checkout/purchase-intent.mjs";

const secret = "test-secret-with-at-least-32-characters";
const payload = {
  productId: 299935919,
  variantId: 1338048150,
  returnPath: "/tienda/productos/hexagonal-classic-3548-dorado-verde-3lb4e",
  exp: 2_000,
};

test("round trips a signed purchase intent", () => {
  const token = createPurchaseIntent(payload, secret);
  assert.deepEqual(verifyPurchaseIntent(token, secret, 1_999), payload);
});

test("rejects tampered, expired, and external return paths", () => {
  const token = createPurchaseIntent(payload, secret);
  assert.throws(() => verifyPurchaseIntent(`${token}x`, secret, 1_999));
  assert.throws(() => verifyPurchaseIntent(token, secret, 2_001), /expired/i);
  assert.throws(() =>
    createPurchaseIntent({ ...payload, returnPath: "https://evil.test" }, secret),
  );
});
