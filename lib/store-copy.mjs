// Payment phrases and location shared by page copy, metadata and structured
// data. Plain JavaScript so node:test can check copy built from them;
// lib/store-facts.ts re-exports them for the rest of the app.
import { INTEREST_FREE_INSTALLMENTS, TRANSFER_DISCOUNT_PERCENT } from "./storefront.mjs";

export const INSTALLMENTS_PHRASE = `${INTEREST_FREE_INSTALLMENTS} cuotas sin interés`;
export const TRANSFER_DISCOUNT_PHRASE = `${TRANSFER_DISCOUNT_PERCENT}% off por transferencia`;
export const CHECKOUT_PHRASE = "checkout seguro de Tiendanube";

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
