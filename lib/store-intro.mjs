// Who Smile is, in one short paragraph: the homepage's "Sobre Smile" section,
// right before the FAQ (components/brand/AboutSection.tsx). Location, pickup,
// shipping and checkout come from lib/store-copy.mjs; brands come from the
// catalog, so it never names a brand without stock. Plain JavaScript so
// node:test can check it. Server-only.
import { listPhrase } from "./product-seo.mjs";
import {
  CHECKOUT_PHRASE,
  FREE_SHIPPING_PHRASE,
  STORE_LOCATION,
  STORE_PICKUP_PHRASE,
} from "./store-copy.mjs";

export const STORE_INTRO_MIN_WORDS = 40;
export const STORE_INTRO_MAX_WORDS = 70;
/** Sunglasses brands named before "y otras marcas". */
export const STORE_INTRO_SUNGLASSES_BRANDS = 3;

/** "anteojos de sol originales de A, B, C y otras marcas". */
function offerPhrase(noun, brands, max = brands.length) {
  if (brands.length === 0) return noun;
  const named = brands.slice(0, max);
  return `${noun} de ${listPhrase(brands.length > max ? [...named, "otras marcas"] : named)}`;
}

/**
 * The homepage intro: an online store in Rosario selling original sunglasses
 * and watches of these brands (in the order given), nationwide shipping, the
 * pickup point, the synced free-shipping terms and the Tiendanube checkout.
 * Payment and returns terms are left to the FAQ; warranty terms are not
 * confirmed, so no page states them.
 */
export function storeIntro({ sunglassesBrands = [], watchBrands = [] } = {}) {
  const sunglasses = offerPhrase(
    "anteojos de sol originales",
    sunglassesBrands,
    STORE_INTRO_SUNGLASSES_BRANDS,
  );
  const watches = offerPhrase("relojes originales", watchBrands);
  // "de A, B y otras marcas, y relojes…": the comma closes a list of brands.
  const separator = sunglassesBrands.length > 1 ? ", y" : " y";
  return [
    `Smile es una tienda online de ${STORE_LOCATION.locality}, ${STORE_LOCATION.region}, que vende ${sunglasses}${separator} ${watches}.`,
    `Hacemos envíos a todo el país y hay ${STORE_PICKUP_PHRASE}, ${STORE_LOCATION.locality}.`,
    `${FREE_SHIPPING_PHRASE}.`,
    `Pagás en el ${CHECKOUT_PHRASE}.`,
  ].join(" ");
}
