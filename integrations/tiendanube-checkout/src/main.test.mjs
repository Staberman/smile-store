import assert from "node:assert/strict";
import test from "node:test";
import { createApp } from "./main.ts";

function createListenerRegistry() {
  const listeners = new Map();

  return {
    listeners,
    on(event, handler) {
      const next = [...(listeners.get(event) ?? []), handler];
      listeners.set(event, next);
      return () => {
        const remaining = (listeners.get(event) ?? []).filter(
          (candidate) => candidate !== handler,
        );
        if (remaining.length === 0) {
          listeners.delete(event);
        } else {
          listeners.set(event, remaining);
        }
      };
    },
    emit(event, payload) {
      for (const handler of listeners.get(event) ?? []) {
        handler(payload);
      }
    },
  };
}

function createNube({ cartItems = [], intent }) {
  const registry = createListenerRegistry();
  const sent = [];
  const navigations = [];

  return {
    listeners: registry.listeners,
    emit: registry.emit,
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
        return registry.on(event, handler);
      },
      off(event, handler) {
        const remaining = (registry.listeners.get(event) ?? []).filter(
          (candidate) => candidate !== handler,
        );
        if (remaining.length === 0) {
          registry.listeners.delete(event);
        } else {
          registry.listeners.set(event, remaining);
        }
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

  fake.emit("cart:add:success", {
    cart: {
      items: [{ product_id: 321, variant_id: 123, quantity: 1 }],
    },
    eventPayload: { product_id: 321, variant_id: 123, quantity: 1 },
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
  fake.emit("cart:remove:success", { cart: { items: [] } });
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
