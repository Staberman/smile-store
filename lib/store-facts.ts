import {
  INTEREST_FREE_INSTALLMENTS,
  TRANSFER_DISCOUNT_PERCENT,
} from "@/lib/storefront.mjs";

// Verified store facts reused by page copy, metadata, structured data and
// llms.txt. Keep claims here factual: no shipping times, costs or warranty
// terms the owner has not confirmed.

export const INSTALLMENTS_PHRASE = `${INTEREST_FREE_INSTALLMENTS} cuotas sin interés`;
export const TRANSFER_DISCOUNT_PHRASE = `${TRANSFER_DISCOUNT_PERCENT}% off por transferencia`;
export const CHECKOUT_PHRASE = "checkout seguro de Tiendanube";

// Contact and location, as published on the store's own channels.
export const STORE_ALTERNATE_NAME = "Smile Tienda";
export const WHATSAPP_NUMBER = "5493412613504";
export const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER}`;
export const PHONE_DISPLAY = "+54 9 341 261 3504";
export const PHONE_E164 = `+${WHATSAPP_NUMBER}`;
export const STORE_EMAIL = "smiletiendaimportados@gmail.com";
export const INSTAGRAM_URL = "https://www.instagram.com/smiletienda.ar";
export const STORE_LOCATION = {
  locality: "Rosario",
  region: "Santa Fe",
  countryCode: "AR",
  label: "Rosario, Santa Fe, Argentina",
} as const;

// Consumer-protection links (Argentina). The cancellation form is the store's
// own Tiendanube "botón de arrepentimiento".
export const TIENDANUBE_STORE_URL = "https://smiletienda.mitiendanube.com";
export const ORDER_CANCELLATION_URL = `${TIENDANUBE_STORE_URL}/contacto/?order_cancellation_without_id=true`;
export const CONSUMER_DEFENSE_URL =
  "https://www.argentina.gob.ar/produccion/defensadelconsumidor/formulario";
