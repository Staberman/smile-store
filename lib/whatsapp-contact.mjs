// The message a visitor sends when opening a chat with the store, and the
// reference code at its end: "(Ref <SRC>-<productRef>)" or "(Ref <SRC>-WEB)".
// SRC is the session's traffic source (lib/traffic-source.mjs); productRef is
// the product's Tiendanube id. The owner copies the code into the manual
// Tiendanube order (docs/utm-links.md), and the WhatsApp pageview records the
// same code (lib/visitor-events.mjs), so the two can be reconciled.
// Plain JavaScript so node:test checks the same text the site sends.

import { DIRECT_SOURCE, isSourceCode } from "./traffic-source.mjs";

/** The reference used when the chat is not about one product. */
export const GENERIC_REF = "WEB";

// A Tiendanube product id: digits only, so the code cannot be misread and
// matches the admin URL (/admin/products/<id>) and the Merchant feed's g:id.
const PRODUCT_REF = /^[1-9]\d{0,14}$/;
// The code always closes the message, so a product name cannot fake one.
const REF_AT_END = /\(Ref ([A-Z])-([1-9]\d{0,14}|WEB)\)$/;

/**
 * The reference for a product: its Tiendanube id as a string, or null when it
 * has none.
 */
export function productRef(tiendanubeProductId) {
  const ref =
    typeof tiendanubeProductId === "number" || typeof tiendanubeProductId === "string"
      ? String(tiendanubeProductId).trim()
      : "";
  return PRODUCT_REF.test(ref) ? ref : null;
}

function productName(product) {
  return typeof product?.name === "string" ? product.name.replace(/\s+/g, " ").trim() : "";
}

/**
 * The prefilled message: about the product when one is given, about the store
 * otherwise. An unknown source is written as D and a missing product
 * reference as WEB.
 */
export function contactMessage({ source, product = null } = {}) {
  const code = isSourceCode(source) ? source : DIRECT_SOURCE;
  const ref = productRef(product?.ref) ?? GENERIC_REF;
  const name = productName(product);
  const opening = name
    ? `Hola! Te escribo desde la web por el ${name}.`
    : "Hola! Te escribo desde la web de Smile.";
  return `${opening} (Ref ${code}-${ref})`;
}

/**
 * The message in the server-rendered HTML, before the browser knows the
 * source: generic, with Ref D-WEB. Links keep it when JavaScript does not run.
 */
export const SERVER_CONTACT_MESSAGE = contactMessage({ source: DIRECT_SOURCE });

/** A wa.me chat link (`baseUrl` is https://wa.me/<number>) that opens with `message` typed in. */
export function whatsAppContactUrl(baseUrl, message) {
  return `${baseUrl}?text=${encodeURIComponent(message)}`;
}

/**
 * The reference a contact link's message carries, as { source, productRef }
 * (productRef null for WEB), or null when the link has no message or the
 * message does not end with a reference.
 */
export function contactRefFromHref(href) {
  let text;
  try {
    text = new URL(href).searchParams.get("text");
  } catch {
    return null;
  }
  const match = typeof text === "string" ? REF_AT_END.exec(text.trim()) : null;
  if (!match || !isSourceCode(match[1])) return null;
  return { source: match[1], productRef: match[2] === GENERIC_REF ? null : match[2] };
}
