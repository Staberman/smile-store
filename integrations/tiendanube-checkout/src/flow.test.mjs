import assert from "node:assert/strict";
import test from "node:test";
import {
  removeAllCartItems,
  startCheckoutFlow,
} from "./flow.mjs";

function createListenerRegistry() {
  const listeners = new Map();
  const offCalls = [];

  return {
    listeners,
    offCalls,
    on(event, handler) {
      const next = [...(listeners.get(event) ?? []), handler];
      listeners.set(event, next);
      return () => {
        offCalls.push([event, handler]);
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
    count(event) {
      return listeners.get(event)?.length ?? 0;
    },
  };
}

function createBridge({
  resolved = { productId: 321, variantId: 123, quantity: 1 },
  clearError,
} = {}) {
  const registry = createListenerRegistry();
  const calls = [];
  const sentEvents = [];
  const navigations = [];

  return {
    calls,
    sentEvents,
    listeners: registry.listeners,
    offCalls: registry.offCalls,
    navigations,
    emit: registry.emit,
    listenerCount: registry.count,
    bridge: {
      async resolveIntent(intent) {
        calls.push(["resolve", intent]);
        return resolved;
      },
      async clearCart() {
        calls.push(["clear"]);
        if (clearError) throw clearError;
      },
      on(event, handler) {
        calls.push(["on", event]);
        return registry.on(event, handler);
      },
      sendAdd(item) {
        calls.push(["add", item]);
        sentEvents.push({ event: "cart:add", item });
      },
      navigate(path) {
        calls.push(["navigate", path]);
        navigations.push(path);
      },
    },
  };
}

function startLocation(intent) {
  return {
    url: `https://smiletienda.mitiendanube.com/apps/smile-comprar/start?intent=${intent}`,
    queries: { intent },
  };
}

test("resolves intent, registers listeners, clears, then sends cart:add", async () => {
  const fake = createBridge();

  await startCheckoutFlow(startLocation("intent-order"), fake.bridge);

  assert.deepEqual(fake.calls, [
    ["resolve", "intent-order"],
    ["on", "cart:add:success"],
    ["on", "cart:add:fail"],
    ["clear"],
    [
      "add",
      { product_id: 321, variant_id: 123, quantity: 1 },
    ],
  ]);
});

test("clears existing cart items before sending cart:add", async () => {
  const fake = createBridge();

  await startCheckoutFlow(startLocation("intent-clear-first"), fake.bridge);

  assert.ok(
    fake.calls.findIndex(([name]) => name === "clear") <
      fake.calls.findIndex(([name]) => name === "add"),
  );
});

test("navigates to checkout only after matching cart:add:success", async () => {
  const fake = createBridge();

  await startCheckoutFlow(startLocation("intent-success"), fake.bridge);
  assert.deepEqual(fake.navigations, []);

  fake.emit("cart:add:success", {
    cart: {
      items: [{ product_id: 321, variant_id: 123, quantity: 1 }],
    },
    eventPayload: { product_id: 321, variant_id: 123, quantity: 1 },
  });

  assert.deepEqual(fake.navigations, [
    "/apps/smile-comprar/checkout?intent=intent-success",
  ]);
});

test("ignores foreign cart:add:success events and cleans up after the match", async () => {
  const fake = createBridge();

  await startCheckoutFlow(startLocation("intent-mismatch"), fake.bridge);
  fake.emit("cart:add:success", {
    cart: {
      items: [{ product_id: 999, variant_id: 888, quantity: 1 }],
    },
    eventPayload: { product_id: 999, variant_id: 888, quantity: 1 },
  });

  assert.deepEqual(fake.navigations, []);

  fake.emit("cart:add:success", {
    cart: {
      items: [{ product_id: 321, variant_id: 123, quantity: 1 }],
    },
    eventPayload: { product_id: 321, variant_id: 123, quantity: 1 },
  });

  assert.deepEqual(fake.navigations, [
    "/apps/smile-comprar/checkout?intent=intent-mismatch",
  ]);
  assert.equal(fake.offCalls.length, 2);
  assert.equal(fake.listenerCount("cart:add:success"), 0);

  fake.emit("cart:add:fail", {
    cart: { items: [] },
    eventPayload: null,
  });

  assert.deepEqual(fake.navigations, [
    "/apps/smile-comprar/checkout?intent=intent-mismatch",
  ]);
});

test("navigates to error after cart:add:fail", async () => {
  const fake = createBridge();

  await startCheckoutFlow(startLocation("intent-add-fail"), fake.bridge);
  fake.emit("cart:add:fail", {
    cart: { items: [] },
    eventPayload: null,
  });

  assert.deepEqual(fake.navigations, [
    "/apps/smile-comprar/error?intent=intent-add-fail",
  ]);
  assert.equal(fake.offCalls.length, 2);
});

test("navigates to error after cart:add timeout and cleans up listeners", async () => {
  const fake = createBridge();

  await startCheckoutFlow(startLocation("intent-timeout"), fake.bridge, 10);

  await new Promise((resolve) => setTimeout(resolve, 15));

  assert.deepEqual(fake.navigations, [
    "/apps/smile-comprar/error?intent=intent-timeout",
  ]);
  assert.equal(fake.offCalls.length, 2);
});

test("navigates to error when clearing the cart fails", async () => {
  const fake = createBridge({ clearError: new Error("remove failed") });

  await startCheckoutFlow(startLocation("intent-remove-fail"), fake.bridge);

  assert.deepEqual(fake.sentEvents, []);
  assert.deepEqual(fake.navigations, [
    "/apps/smile-comprar/error?intent=intent-remove-fail",
  ]);
});

test("allows retry after a failure before cart:add is sent", async () => {
  const fake = createBridge();
  let clearAttempts = 0;
  fake.bridge.clearCart = async () => {
    clearAttempts += 1;
    if (clearAttempts === 1) throw new Error("temporary_remove_failure");
  };
  const location = startLocation("intent-pre-add-retry");

  await startCheckoutFlow(location, fake.bridge);
  await startCheckoutFlow(location, fake.bridge);

  assert.equal(clearAttempts, 2);
  assert.equal(fake.sentEvents.length, 1);
});

test("navigates to error when a matching add leaves extra cart items", async () => {
  const fake = createBridge();

  await startCheckoutFlow(startLocation("intent-extra-item"), fake.bridge);
  fake.emit("cart:add:success", {
    cart: {
      items: [
        { product_id: 321, variant_id: 123, quantity: 1 },
        { product_id: 999, variant_id: 888, quantity: 1 },
      ],
    },
    eventPayload: { product_id: 321, variant_id: 123, quantity: 1 },
  });

  assert.deepEqual(fake.navigations, [
    "/apps/smile-comprar/error?intent=intent-extra-item",
  ]);
});

test("does nothing outside /apps/smile-comprar/start", async () => {
  const fake = createBridge();

  await startCheckoutFlow(
    {
      url: "https://smiletienda.mitiendanube.com/products/example",
      queries: { intent: "intent-wrong-page" },
    },
    fake.bridge,
  );

  assert.deepEqual(fake.calls, []);
});

test("does not send cart:add twice for the same intent", async () => {
  const fake = createBridge();
  const location = startLocation("intent-once");

  await startCheckoutFlow(location, fake.bridge);
  await startCheckoutFlow(location, fake.bridge);

  assert.equal(fake.sentEvents.length, 1);
});

test("removeAllCartItems resolves only when the cart is empty and removes listeners", async () => {
  const registry = createListenerRegistry();
  const removed = [];
  const nube = {
    on(event, handler) {
      return registry.on(event, handler);
    },
    off(event, handler) {
      registry.offCalls.push([event, handler]);
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
      removed.push({ event, state: modifier() });
    },
  };
  const items = [{ product_id: 321, variant_id: 123, quantity: 2 }];

  const pending = removeAllCartItems(nube, items, 100);
  registry.emit("cart:remove:success", { cart: { items } });
  assert.equal(registry.offCalls.length, 0);
  registry.emit("cart:remove:success", { cart: { items: [] } });
  await pending;

  assert.deepEqual(removed, [
    {
      event: "cart:remove",
      state: {
        cart: {
          items: [{ product_id: 321, variant_id: 123, quantity: 2 }],
        },
      },
    },
  ]);
  assert.equal(registry.offCalls.length, 2);
});

test("removeAllCartItems rejects cart:remove:fail and removes listeners", async () => {
  const registry = createListenerRegistry();
  const nube = {
    on(event, handler) {
      return registry.on(event, handler);
    },
    off(event, handler) {
      registry.offCalls.push([event, handler]);
      const remaining = (registry.listeners.get(event) ?? []).filter(
        (candidate) => candidate !== handler,
      );
      if (remaining.length === 0) {
        registry.listeners.delete(event);
      } else {
        registry.listeners.set(event, remaining);
      }
    },
    send() {},
  };

  const pending = removeAllCartItems(
    nube,
    [{ product_id: 321, variant_id: 123, quantity: 1 }],
    100,
  );
  registry.emit("cart:remove:fail", { cart: { items: [] } });

  await assert.rejects(pending, /cart_remove_failed/);
  assert.equal(registry.offCalls.length, 2);
});

test("removeAllCartItems rejects after its timeout and removes listeners", async () => {
  const registry = createListenerRegistry();
  const nube = {
    on(event, handler) {
      return registry.on(event, handler);
    },
    off(event, handler) {
      registry.offCalls.push([event, handler]);
      const remaining = (registry.listeners.get(event) ?? []).filter(
        (candidate) => candidate !== handler,
      );
      if (remaining.length === 0) {
        registry.listeners.delete(event);
      } else {
        registry.listeners.set(event, remaining);
      }
    },
    send() {},
  };

  await assert.rejects(
    removeAllCartItems(
      nube,
      [{ product_id: 321, variant_id: 123, quantity: 1 }],
      5,
    ),
    /cart_remove_timeout/,
  );
  assert.equal(registry.offCalls.length, 2);
});
