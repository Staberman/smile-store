const startedIntents = new Set();
const START_PATH = "/apps/smile-comprar/start";

function destination(stage, intent) {
  return `/apps/smile-comprar/${stage}?intent=${encodeURIComponent(intent)}`;
}

function isResolvedItem(value) {
  return (
    value &&
    Number.isInteger(value.productId) &&
    value.productId > 0 &&
    Number.isInteger(value.variantId) &&
    value.variantId > 0 &&
    value.quantity === 1
  );
}

function isExpectedCart(items, expected) {
  return (
    items.length === 1 &&
    items[0].product_id === expected.product_id &&
    items[0].variant_id === expected.variant_id &&
    items[0].quantity === 1
  );
}

export async function startCheckoutFlow(location, bridge) {
  let pathname;

  try {
    pathname = new URL(
      location.url,
      "https://smiletienda.mitiendanube.com",
    ).pathname;
  } catch {
    return;
  }

  const intent = location.queries.intent;
  if (pathname !== START_PATH || !intent || startedIntents.has(intent)) {
    return;
  }

  startedIntents.add(intent);
  let settled = false;

  const navigateOnce = (stage) => {
    if (settled) return;
    settled = true;
    bridge.navigate(destination(stage, intent));
  };

  try {
    const resolved = await bridge.resolveIntent(intent);
    if (!isResolvedItem(resolved)) {
      throw new Error("invalid_resolved_intent");
    }

    const item = {
      product_id: resolved.productId,
      variant_id: resolved.variantId,
      quantity: 1,
    };

    bridge.on("cart:add:success", (items) => {
      navigateOnce(isExpectedCart(items, item) ? "checkout" : "error");
    });
    bridge.on("cart:add:fail", () => navigateOnce("error"));

    await bridge.clearCart();
    if (!settled) bridge.sendAdd(item);
  } catch {
    navigateOnce("error");
  }
}

export function removeAllCartItems(nube, items, timeoutMs = 8_000) {
  if (items.length === 0) return Promise.resolve();

  return new Promise((resolve, reject) => {
    let settled = false;
    let timer;

    const cleanup = () => {
      if (timer) clearTimeout(timer);
      nube.off("cart:remove:success", onSuccess);
      nube.off("cart:remove:fail", onFail);
    };

    const finish = (error) => {
      if (settled) return;
      settled = true;
      cleanup();
      if (error) reject(error);
      else resolve();
    };

    const onSuccess = ({ cart }) => {
      if (cart.items.length === 0) finish();
    };
    const onFail = () => finish(new Error("cart_remove_failed"));

    nube.on("cart:remove:success", onSuccess);
    nube.on("cart:remove:fail", onFail);
    timer = setTimeout(
      () => finish(new Error("cart_remove_timeout")),
      timeoutMs,
    );

    try {
      nube.send("cart:remove", () => ({
        cart: {
          items: items.map(({ product_id, variant_id, quantity }) => ({
            product_id,
            variant_id,
            quantity,
          })),
        },
      }));
    } catch (error) {
      finish(error);
    }
  });
}
