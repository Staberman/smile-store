import assert from "node:assert/strict";
import test from "node:test";

import { buildSalesRanking } from "./sales-ranking-utils.mjs";

test("ranks sold units and excludes cancelled or old orders", () => {
  const now = new Date("2026-06-30T12:00:00Z");
  const orders = [
    {
      status: "open",
      created_at: "2026-06-20T10:00:00Z",
      products: [
        { product_id: 10, quantity: 2 },
        { product_id: 20, quantity: 1 },
      ],
    },
    {
      status: "cancelled",
      created_at: "2026-06-22T10:00:00Z",
      products: [{ product_id: 20, quantity: 20 }],
    },
    {
      status: "closed",
      created_at: "2026-01-01T10:00:00Z",
      products: [{ product_id: 30, quantity: 50 }],
    },
  ];

  assert.deepEqual(buildSalesRanking(orders, now), [
    { productId: 10, units: 2 },
    { productId: 20, units: 1 },
  ]);
});
