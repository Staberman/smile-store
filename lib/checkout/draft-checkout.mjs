import { randomUUID } from "node:crypto";

const API_ORIGIN = "https://api.tiendanube.com";
const CHECKOUT_ORIGIN = "https://smiletienda.mitiendanube.com";

export async function createDraftCheckout({
  accessToken,
  storeId,
  variantId,
  fetchImpl = fetch,
}) {
  if (
    typeof accessToken !== "string" ||
    accessToken.length === 0 ||
    !/^\d+$/.test(String(storeId)) ||
    !Number.isInteger(variantId) ||
    variantId <= 0
  ) {
    throw new Error("invalid_draft_order_configuration");
  }

  const response = await fetchImpl(
    `${API_ORIGIN}/v1/${storeId}/draft_orders`,
    {
      method: "POST",
      headers: {
        Authentication: `bearer ${accessToken}`,
        "Content-Type": "application/json",
        "User-Agent":
          "Smile Stock Sync (smiletiendaimportados@gmail.com)",
      },
      body: JSON.stringify({
        contact_name: "Cliente",
        contact_lastname: "Smile",
        contact_email: `completar-checkout+${randomUUID()}@smiletiendaimp.com.ar`,
        payment_status: "unpaid",
        sale_channel: "Smile web",
        products: [{ variant_id: variantId, quantity: 1 }],
      }),
    },
  );

  if (!response.ok) {
    throw new Error(`draft_order_failed:${response.status}`);
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
