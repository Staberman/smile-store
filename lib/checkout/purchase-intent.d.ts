export type PurchaseIntent = {
  productId: number;
  variantId: number;
  returnPath: string;
  exp: number;
};

export function createPurchaseIntent(
  payload: PurchaseIntent,
  secret: string,
): string;

export function verifyPurchaseIntent(
  token: string,
  secret: string,
  now?: number,
): PurchaseIntent;
