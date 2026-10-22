// Payment and shipping phrases and location shared by page copy, metadata and
// structured data. Plain JavaScript so node:test can check copy built from
// them; lib/store-facts.ts re-exports them for the rest of the app.
import { formatPrice } from "./price-format.mjs";
import {
  FREE_SHIPPING_MINIMUM_ARS,
  INTEREST_FREE_INSTALLMENTS,
  TRANSFER_DISCOUNT_PERCENT,
} from "./storefront.mjs";

export const INSTALLMENTS_PHRASE = `${INTEREST_FREE_INSTALLMENTS} cuotas sin interés`;
export const TRANSFER_DISCOUNT_PHRASE = `${TRANSFER_DISCOUNT_PERCENT}% off por transferencia`;
export const CHECKOUT_PHRASE = "checkout seguro de Tiendanube";

/**
 * When an order ships for free, after "Envío gratis": "en compras superiores a
 * $ 200.000", or "a todo el país" when every order does (minimum 0). Mirrors
 * the storefront's "Envío gratis superando los $200.000,00".
 */
export function freeShippingCondition(minimumArs) {
  return minimumArs > 0 ? `en compras superiores a ${formatPrice(minimumArs)}` : "a todo el país";
}

// The free-shipping promise, from the minimum synced from Tiendanube. Never
// write "envío gratis" copy by hand: the checkout decides, and this follows it.
export const FREE_SHIPPING_CONDITION = freeShippingCondition(FREE_SHIPPING_MINIMUM_ARS);
export const FREE_SHIPPING_PHRASE = `Envío gratis ${FREE_SHIPPING_CONDITION}`;

export const STORE_LOCATION = {
  locality: "Rosario",
  region: "Santa Fe",
  countryCode: "AR",
  label: "Rosario, Santa Fe, Argentina",
};

// Owner-confirmed pickup point. There is no storefront open to the public,
// published street address or opening hours: never describe it as a "local"
// or "showroom". Lowercase, to go inside a sentence.
export const STORE_PICKUP_PHRASE = "retiro coordinado por WhatsApp en Puerto Norte";
