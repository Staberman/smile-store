// Verified store facts reused by page copy, metadata, structured data and
// llms.txt. Keep claims here factual: no shipping times, costs or warranty
// terms the owner has not confirmed.

// Payment phrases, location and the pickup point live in lib/store-copy.mjs,
// where the node:test suites can read them too.
export {
  CHECKOUT_PHRASE,
  INSTALLMENTS_PHRASE,
  STORE_LOCATION,
  STORE_PICKUP_PHRASE,
  TRANSFER_DISCOUNT_PHRASE,
} from "@/lib/store-copy.mjs";

// Contact and location, as published on the store's own channels.
export const STORE_ALTERNATE_NAME = "Smile Tienda";
export const WHATSAPP_NUMBER = "5493412613504";
export const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER}`;
export const PHONE_DISPLAY = "+54 9 341 261 3504";
export const PHONE_E164 = `+${WHATSAPP_NUMBER}`;
export const STORE_EMAIL = "smiletiendaimportados@gmail.com";
export const INSTAGRAM_URL = "https://www.instagram.com/smiletienda.ar";

// Consumer-protection links (Argentina). The cancellation form is the store's
// own Tiendanube "botón de arrepentimiento".
export const TIENDANUBE_STORE_URL = "https://smiletienda.mitiendanube.com";
export const ORDER_CANCELLATION_URL = `${TIENDANUBE_STORE_URL}/contacto/?order_cancellation_without_id=true`;
export const CONSUMER_DEFENSE_URL =
  "https://www.argentina.gob.ar/produccion/defensadelconsumidor/formulario";
