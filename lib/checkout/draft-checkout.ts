const API_ORIGIN = "https://api.tiendanube.com";
const CHECKOUT_ORIGIN = "https://smiletienda.mitiendanube.com";

export async function createDraftCheckout(params: {
  accessToken: string;
  storeId: string;
  variantId: number;
  quantity?: number;
}): Promise<string> {
  const { accessToken, storeId, variantId, quantity = 1 } = params;

  if (!accessToken || !storeId || !Number.isInteger(variantId) || variantId <= 0) {
    throw new Error("invalid_draft_order_configuration");
  }

  const response = await fetch(
    `${API_ORIGIN}/v1/${storeId}/draft_orders`,
    {
      method: "POST",
      headers: {
        Authentication: `bearer ${accessToken}`,
        "Content-Type": "application/json",
        "User-Agent": "Smile Store (smiletiendaimp.com.ar)",
      },
      body: JSON.stringify({
        contact_name: ".",
        contact_lastname: ".",
        contact_email: "x@x.com",
        payment_status: "unpaid",
        sale_channel: "Smile web",
        products: [{ variant_id: variantId, quantity }],
      }),
    },
  );

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`draft_order_failed:${response.status} ${text.slice(0, 200)}`);
  }

  const draft = await response.json();

  if (!draft?.checkout_enabled || typeof draft.checkout_url !== "string") {
    throw new Error("invalid_checkout_url");
  }

  const checkoutUrl = new URL(draft.checkout_url);
  if (
    checkoutUrl.origin !== CHECKOUT_ORIGIN ||
    !checkoutUrl.pathname.startsWith("/checkout/")
  ) {
    throw new Error("invalid_checkout_url");
  }

  return checkoutUrl.toString();
}
