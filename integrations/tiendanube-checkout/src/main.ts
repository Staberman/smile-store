import type { NubeApp, NubeSDK } from "@tiendanube/nube-sdk-types";
import type { CheckoutBridge } from "./flow";
import {
  removeAllCartItems,
  startCheckoutFlow,
} from "./flow.mjs";

const RESOLVER_URL =
  "https://www.smiletiendaimp.com.ar/api/checkout/tiendanube/resolve";

type FetchImplementation = (
  input: string | URL | Request,
  init?: RequestInit,
) => Promise<Response>;

function parseResolvedIntent(value: unknown) {
  if (
    !value ||
    typeof value !== "object" ||
    !("productId" in value) ||
    !("variantId" in value) ||
    !("quantity" in value)
  ) {
    throw new Error("invalid_intent_response");
  }

  const { productId, variantId, quantity } = value;
  if (
    !Number.isInteger(productId) ||
    Number(productId) <= 0 ||
    !Number.isInteger(variantId) ||
    Number(variantId) <= 0 ||
    quantity !== 1
  ) {
    throw new Error("invalid_intent_response");
  }

  return {
    productId: Number(productId),
    variantId: Number(variantId),
    quantity: 1 as const,
  };
}

function runApp(nube: NubeSDK, fetchImpl: FetchImplementation) {
  const browser = nube.getBrowserAPIs();
  const location = nube.getState().location;

  const bridge: CheckoutBridge = {
    resolveIntent: async (intent) => {
      const response = await fetchImpl(
        `${RESOLVER_URL}?intent=${encodeURIComponent(intent)}`,
      );
      if (!response.ok) throw new Error("intent_resolution_failed");
      return parseResolvedIntent(await response.json());
    },
    clearCart: async () => {
      const items = nube.getState().cart.items;
      await removeAllCartItems(nube, items);
    },
    on: (event, handler) => {
      if (event === "cart:add:success") {
        nube.on("cart:add:success", ({ cart }) => handler(cart.items));
        return;
      }

      nube.on("cart:add:fail", ({ cart }) => handler(cart.items));
    },
    sendAdd: (item) => {
      nube.send("cart:add", () => ({ cart: { items: [item] } }));
    },
    navigate: (path) => {
      if (path.startsWith("/")) browser.navigate(path as `/${string}`);
    },
  };

  void startCheckoutFlow(location, bridge);
}

export function createApp(
  fetchImpl: FetchImplementation = fetch,
): NubeApp {
  return (nube) => runApp(nube, fetchImpl);
}

export function App(nube: NubeSDK) {
  runApp(nube, fetch);
}
