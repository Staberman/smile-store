import assert from "node:assert/strict";
import test from "node:test";
import { createApp } from "./main.ts";

function createNube({ cartItems = [], intent }) {
  const listeners = new Map();
  const sent = [];
  const navigations = [];

  return {
    listeners,
    navigations,
    sent,
    nube: {
      getState() {
        return {
          location: {
            url: `https://smiletienda.mitiendanube.com/apps/smile-comprar/start?intent=${intent}`,
            queries: { intent },
          },
          cart: { items: cartItems },
        };
      },
      getBrowserAPIs() {
        return {
          navigate(path) {
            navigations.push(path);
          },
        };
      },
      on(event, handler) {
        listeners.set(event, handler);
      },
      off(event, handler) {
        if (listeners.get(event) === handler) listeners.delete(event);
      },
      send(event, modifier) {
        sent.push({ event, state: modifier() });
      },
    },
  };
}

async function flush() {
  await new Promise((resolve) => setTimeout(resolve, 0));
}

test("App resolves the intent, sends cart:add, and navigates after success", async () => {
  const fake = createNube({ intent: "adapter-success" });
  const App = createApp(async () =>
    Response.json({ productId: 321, variantId: 123, quantity: 1 }),
  );

  App(fake.nube);
  await flush();

  assert.deepEqual(fake.sent, [
    {
      event: "cart:add",
      state: {
        cart: {
          items: [{ product_id: 321, variant_id: 123, quantity: 1 }],
        },
      },
    },
  ]);

  fake.listeners.get("cart:add:success")({
    cart: {
      items: [{ product_id: 321, variant_id: 123, quantity: 1 }],
    },
  });

  assert.deepEqual(fake.navigations, [
    "/apps/smile-comprar/checkout?intent=adapter-success",
  ]);
});

test("App sends cart:remove before cart:add when the session has old items", async () => {
  const oldItem = { product_id: 999, variant_id: 888, quantity: 1 };
  const fake = createNube({
    cartItems: [oldItem],
    intent: "adapter-clear",
  });
  const App = createApp(async () =>
    Response.json({ productId: 321, variantId: 123, quantity: 1 }),
  );

  App(fake.nube);
  await flush();

  assert.equal(fake.sent[0].event, "cart:remove");
  fake.listeners.get("cart:remove:success")({ cart: { items: [] } });
  await flush();

  assert.equal(fake.sent[1].event, "cart:add");
});

test("App navigates to error when intent resolution fails", async () => {
  const fake = createNube({ intent: "adapter-network-fail" });
  const App = createApp(async () => new Response(null, { status: 503 }));

  App(fake.nube);
  await flush();

  assert.deepEqual(fake.sent, []);
  assert.deepEqual(fake.navigations, [
    "/apps/smile-comprar/error?intent=adapter-network-fail",
  ]);
});
