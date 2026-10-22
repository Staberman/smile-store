import assert from "node:assert/strict";
import test from "node:test";
import { formatPrice } from "../../lib/price-format.mjs";

test("formatPrice writes whole pesos the es-AR way", () => {
  // The space after "$" is a no-break space, so the amount never wraps alone.
  assert.equal(formatPrice(200000), "$ 200.000");
  assert.equal(formatPrice(1500000), "$ 1.500.000");
  assert.equal(formatPrice(0), "$ 0");
  assert.equal(formatPrice(182699.6), "$ 182.700");
});

test("formatPrice says Consultar when there is no price", () => {
  assert.equal(formatPrice(null), "Consultar");
  assert.equal(formatPrice(undefined), "Consultar");
});
