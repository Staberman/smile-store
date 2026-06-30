export type CartItemReference = {
  product_id: number;
  variant_id: number;
  quantity: number;
};

export type CartAddEventState = {
  cart: {
    items: CartItemReference[];
  };
  eventPayload?: unknown;
};

export type CheckoutBridge = {
  resolveIntent(intent: string): Promise<{
    productId: number;
    variantId: number;
    quantity: 1;
  }>;
  clearCart(): Promise<void>;
  on(
    event: "cart:add:success" | "cart:add:fail",
    handler: (state: CartAddEventState) => void,
  ): () => void;
  sendAdd(item: CartItemReference & { quantity: 1 }): void;
  navigate(path: string): void;
};

export type CheckoutLocation = {
  url: string;
  queries: Record<string, string>;
};

export type CartEventSDK = {
  on(
    event: "cart:remove:success" | "cart:remove:fail",
    handler: (state: { cart: { items: CartItemReference[] } }) => void,
  ): void;
  off(
    event: "cart:remove:success" | "cart:remove:fail",
    handler: (state: { cart: { items: CartItemReference[] } }) => void,
  ): void;
  send(
    event: "cart:remove",
    modifier: () => { cart: { items: CartItemReference[] } },
  ): void;
};

export function startCheckoutFlow(
  location: CheckoutLocation,
  bridge: CheckoutBridge,
  timeoutMs?: number,
): Promise<void>;

export function removeAllCartItems(
  nube: CartEventSDK,
  items: CartItemReference[],
  timeoutMs?: number,
): Promise<void>;
