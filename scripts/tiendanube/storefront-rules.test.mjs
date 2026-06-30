import assert from "node:assert/strict";
import test from "node:test";

import {
  filterStorefrontProducts,
  getAvailableVariants,
  getDisplayPrice,
  getInstallmentPrice,
  getTransferPrice,
  isOffer,
} from "../../lib/storefront.mjs";

function product(overrides = {}) {
  return {
    id: "1",
    name: "Producto",
    brand: "Ray Ban",
    categories: ["LENTES DE SOL", "RAY BAN"],
    price: 100_000,
    promotionalPrice: null,
    variants: [],
    ...overrides,
  };
}

test("keeps only purchasable variants", () => {
  const variants = [
    { id: 1, available: true, stock: 2, price: 100_000 },
    { id: 2, available: true, stock: 0, price: 100_000 },
    { id: 3, available: false, stock: 4, price: 100_000 },
    { id: 4, available: true, stock: 1, price: null },
  ];

  assert.deepEqual(getAvailableVariants(product({ variants })), [variants[0]]);
});

test("calculates display, transfer and installment prices", () => {
  const item = product({ price: 120_000, promotionalPrice: 90_000 });

  assert.equal(getDisplayPrice(item), 90_000);
  assert.equal(getTransferPrice(90_000), 72_000);
  assert.equal(getInstallmentPrice(90_000), 15_000);
});

test("recognizes offers and separates eyewear from watches", () => {
  const eyewear = product({ id: "eyewear", promotionalPrice: 80_000 });
  const watch = product({
    id: "watch",
    brand: "Tommy Hilfiger",
    categories: ["RELOJES", "TOMMY HILFIGER CABALLERO"],
  });

  assert.equal(isOffer(eyewear), true);
  assert.deepEqual(filterStorefrontProducts([eyewear, watch], "lentes"), [eyewear]);
  assert.deepEqual(filterStorefrontProducts([eyewear, watch], "relojes"), [watch]);
  assert.deepEqual(filterStorefrontProducts([eyewear, watch], "offers"), [eyewear]);
});

test("normalizes Ray-Ban aliases for the dedicated view", () => {
  const aliases = ["Ray ban", "Ray Ban", "Rayban", "RAY BAN"].map((brand, index) =>
    product({ id: String(index), brand }),
  );

  assert.equal(filterStorefrontProducts(aliases, "ray-ban").length, 4);
});
