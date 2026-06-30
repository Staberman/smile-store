import assert from "node:assert/strict";
import test from "node:test";
import { createDraftCheckout } from "../../lib/checkout/draft-checkout.mjs";

const input = {
  accessToken: "test-access-token",
  storeId: "3759046",
  variantId: 1467639001,
};

test("creates one draft product and returns its trusted checkout URL", async () => {
  let request;
  const checkoutUrl =
    "https://smiletienda.mitiendanube.com/checkout/v3/start/123/hash";

  const result = await createDraftCheckout({
    ...input,
    fetchImpl: async (url, options) => {
      request = { url, options };
      return Response.json(
        {
          id: 123,
          checkout_enabled: true,
          checkout_url: checkoutUrl,
          products: [{ variant_id: input.variantId, quantity: 1 }],
        },
        { status: 201 },
      );
    },
  });

  assert.equal(result, checkoutUrl);
  assert.equal(
    request.url,
    "https://api.tiendanube.com/v1/3759046/draft_orders",
  );
  assert.equal(
    request.options.headers.Authentication,
    "bearer test-access-token",
  );

  const body = JSON.parse(request.options.body);
  assert.deepEqual(body.products, [
    { variant_id: input.variantId, quantity: 1 },
  ]);
  assert.equal(body.payment_status, "unpaid");
  assert.match(body.contact_email, /^completar-checkout\+/);
});

test("rejects failed API responses and untrusted checkout URLs", async () => {
  await assert.rejects(
    createDraftCheckout({
      ...input,
      fetchImpl: async () =>
        Response.json({ message: "failed" }, { status: 422 }),
    }),
    /draft_order_failed/,
  );

  await assert.rejects(
    createDraftCheckout({
      ...input,
      fetchImpl: async () =>
        Response.json(
          {
            checkout_enabled: true,
            checkout_url: "https://evil.example/checkout/v3/start/1/x",
          },
          { status: 201 },
        ),
    }),
    /invalid_checkout_url/,
  );
});
