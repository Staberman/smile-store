// Catalog facts the watch guides read: the "Clave: valor" spec lines of each
// product sheet (parsed by lib/product-copy.mjs), the watch hubs, and peso
// amounts written without the currency sign. Guide copy never writes "$" or
// a price by hand: every amount comes from the catalog at build time.
import { AUDIENCE_HUBS, priceRange } from "../collection-hubs.mjs";
import { descriptionLines, productKind, splitDescription } from "../product-copy.mjs";
import { listPhrase } from "../product-seo.mjs";
import { link, normalize } from "./shared.mjs";

export const WATCHES_PATH = "/tienda/relojes";

/** Brand hubs of the watch section, in the order the store lists them. */
export const WATCH_BRAND_HUBS = [
  { brand: "Tommy Hilfiger", label: "Tommy Hilfiger", path: "/tienda/marcas/tommy-hilfiger" },
  { brand: "Invicta", label: "Invicta", path: "/tienda/marcas/invicta" },
  { brand: "OMEGA x Swatch", label: "OMEGA x Swatch", path: "/tienda/relojes/omega-swatch" },
];

/** Hombre / mujer watch hubs (lib/collection-hubs.mjs). */
export const WATCH_AUDIENCE_HUBS = AUDIENCE_HUBS.filter((hub) => hub.kind === "watch");

export function isWatchProduct(product) {
  return productKind(product) === "watch";
}

// Spec lines by label, parsed once per product.
const specCache = new WeakMap();

/** A spec line of the product sheet ("Movimiento", "Resistencia al agua"…), or "". */
export function watchSpec(product, label) {
  let specs = specCache.get(product);
  if (!specs) {
    specs = new Map(
      splitDescription(descriptionLines(product.descriptionHtml)).specs.map((spec) => [spec.name, spec.value]),
    );
    specCache.set(product, specs);
  }
  return specs.get(label) ?? "";
}

/**
 * Water resistance the sheet states: "100 metros (10 ATM), apto para…" ->
 * { meters: 100, atm: 10 }. One bar or atmosphere is about 10 metres, so a
 * sheet that gives only one of the two still resolves. Null without a figure.
 */
export function waterResistance(product) {
  const text = normalize(watchSpec(product, "Resistencia al agua"));
  const atm = text.match(/\b(\d+)\s*(?:atm|bar)\b/);
  const meters = text.match(/\b(\d+)\s*(?:m|mts|metros)\b/);
  if (!atm && !meters) return null;
  const atmValue = atm ? Number(atm[1]) : Number(meters[1]) / 10;
  return { atm: atmValue, meters: meters ? Number(meters[1]) : atmValue * 10 };
}

/** "100 m (10 ATM)". */
export function waterResistanceLabel({ meters, atm }) {
  return `${meters} m (${atm} ATM)`;
}

/** Movement type the sheet states, or null: "Cuarzo Japonés (calibre PC32)" -> "cuarzo". */
export function movementType(product) {
  const text = normalize(watchSpec(product, "Movimiento"));
  if (/\bautomatico\b/.test(text)) return "automático";
  if (/\bcuarzo\b/.test(text)) return "cuarzo";
  return null;
}

/** Case diameter in millimetres the sheet states ("43 mm"), or null. */
export function caseDiameter(product) {
  const match = normalize(watchSpec(product, "Diámetro de la caja")).match(/\b(\d{2})\s*mm\b/);
  return match ? Number(match[1]) : null;
}

/** Rotating bezel named in the "Bisel" or "Color del bisel" line. */
export function hasRotatingBezel(product) {
  return [watchSpec(product, "Bisel"), watchSpec(product, "Color del bisel")].some((value) =>
    /\bgiratorio\b/.test(normalize(value)),
  );
}

const PESOS = new Intl.NumberFormat("es-AR", { maximumFractionDigits: 0 });

/** "<min> pesos" or "<min> a <max> pesos", es-AR grouping, from priceRange(). */
export function pesosRange(range) {
  if (range.min === range.max) return `${PESOS.format(range.min)} pesos`;
  return `${PESOS.format(range.min)} a ${PESOS.format(range.max)} pesos`;
}

/** Price range of the products in pesos, or null when none has a price. */
export function productsPriceLabel(products) {
  const range = priceRange(products);
  return range ? pesosRange(range) : null;
}

/** "1 modelo", "3 modelos". */
export function modelsPhrase(count) {
  return `${count} ${count === 1 ? "modelo" : "modelos"}`;
}

/** Brands of the products, in the store's hub order, then any other. */
export function brandsOf(products) {
  const present = new Set(products.map((product) => product.brand));
  const ordered = WATCH_BRAND_HUBS.map((hub) => hub.brand).filter((brand) => present.has(brand));
  return [...ordered, ...[...present].filter((brand) => !ordered.includes(brand)).sort()];
}

/** "[Invicta](/tienda/marcas/invicta)", or the plain name for a brand without hub. */
export function brandLink(brand) {
  const hub = WATCH_BRAND_HUBS.find((entry) => entry.brand === brand);
  return hub ? link(hub.label, hub.path) : brand;
}

/** "Invicta", "Invicta y Tommy Hilfiger", with links to the brand hubs. */
export function brandLinksPhrase(brands) {
  return listPhrase(brands.map(brandLink));
}

/**
 * Whose products these are, to close a sentence: "todos de Invicta" when
 * several share one brand, else "de Invicta y Tommy Hilfiger". Brands link
 * to their hubs unless `links` is false.
 */
export function fromBrandsPhrase(products, { links = true } = {}) {
  const brands = brandsOf(products);
  const names = links ? brandLinksPhrase(brands) : listPhrase(brands);
  return brands.length === 1 && products.length > 1 ? `todos de ${names}` : `de ${names}`;
}
