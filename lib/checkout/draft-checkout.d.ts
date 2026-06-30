type DraftCheckoutOptions = {
  accessToken: string;
  storeId: string;
  variantId: number;
  fetchImpl?: typeof fetch;
};

export function createDraftCheckout(
  options: DraftCheckoutOptions,
): Promise<string>;
