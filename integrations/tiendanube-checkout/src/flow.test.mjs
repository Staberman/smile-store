import assert from "node:assert/strict";
import test from "node:test";
import {
  removeAllCartItems,
  startCheckoutFlow,
} from "./flow.mjs";

function createBridge({
  resolved = { productId: 321, variantId: 123, quantity: 1 },
  clearError,
} = {}) {
  const listeners = new Map();
  const calls = [];
  const sentEvents = [];
  const navigations = [];

  return {
    calls,
    sentEvents,
    listeners,
    navigations,
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
        listeners.set(event, handler);
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

  fake.listeners.get("cart:add:success")([
    { product_id: 321, variant_id: 123, quantity: 1 },
  ]);

  assert.deepEqual(fake.navigations, [
    "/apps/smile-comprar/checkout?intent=intent-success",
  ]);
});

test("fails when the resulting cart is not exactly the selected variant", async () => {
  const fake = createBridge();

  await startCheckoutFlow(startLocation("intent-mismatch"), fake.bridge);
  fake.listeners.get("cart:add:success")([
    { product_id: 321, variant_id: 123, quantity: 1 },
    { product_id: 999, variant_id: 888, quantity: 1 },
  ]);

  assert.deepEqual(fake.navigations, [
    "/apps/smile-comprar/error?intent=intent-mismatch",
  ]);
});

test("navigates to error after cart:add:fail", async () => {
  const fake = createBridge();

  await startCheckoutFlow(startLocation("intent-add-fail"), fake.bridge);
  fake.listeners.get("cart:add:fail")([]);

  assert.deepEqual(fake.navigations, [
    "/apps/smile-comprar/error?intent=intent-add-fail",
  ]);
});

test("navigates to error when clearing the cart fails", async () => {
  const fake = createBridge({ clearError: new Error("remove failed") });

  await startCheckoutFlow(startLocation("intent-remove-fail"), fake.bridge);

  assert.deepEqual(fake.sentEvents, []);
  assert.deepEqual(fake.navigations, [
    "/apps/smile-comprar/error?intent=intent-remove-fail",
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
  const listeners = new Map();
  const removed = [];
  const offCalls = [];
  const nube = {
    on(event, handler) {
      listeners.set(event, handler);
    },
    off(event, handler) {
      offCalls.push([event, handler]);
      listeners.delete(event);
    },
    send(event, modifier) {
      removed.push({ event, state: modifier() });
    },
  };
  const items = [{ product_id: 321, variant_id: 123, quantity: 2 }];

  const pending = removeAllCartItems(nube, items, 100);
  listeners.get("cart:remove:success")({ cart: { items } });
  assert.equal(offCalls.length, 0);
  listeners.get("cart:remove:success")({ cart: { items: [] } });
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
  assert.equal(offCalls.length, 2);
});

test("removeAllCartItems rejects cart:remove:fail and removes listeners", async () => {
  const listeners = new Map();
  const offCalls = [];
  const nube = {
    on(event, handler) {
      listeners.set(event, handler);
    },
    off(event, handler) {
      offCalls.push([event, handler]);
      listeners.delete(event);
    },
    send() {},
  };

  const pending = removeAllCartItems(
    nube,
    [{ product_id: 321, variant_id: 123, quantity: 1 }],
    100,
  );
  listeners.get("cart:remove:fail")({ cart: { items: [] } });

  await assert.rejects(pending, /cart_remove_failed/);
  assert.equal(offCalls.length, 2);
});

test("removeAllCartItems rejects after its timeout and removes listeners", async () => {
  const listeners = new Map();
  const offCalls = [];
  const nube = {
    on(event, handler) {
      listeners.set(event, handler);
    },
    off(event, handler) {
      offCalls.push([event, handler]);
      listeners.delete(event);
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
  assert.equal(offCalls.length, 2);
});
