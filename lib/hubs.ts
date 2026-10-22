import { canonicalBrand } from "@/lib/brand-directory";
import type { CatalogProduct } from "@/lib/catalog";
import { hubMetaDescription } from "@/lib/collection-hubs.mjs";
import { formatPrice } from "@/lib/format";
import { getProductSeo } from "@/lib/product-meta";
import { listPhrase } from "@/lib/product-seo.mjs";
import {
  CHECKOUT_PHRASE,
  INSTALLMENTS_PHRASE,
  TRANSFER_DISCOUNT_PHRASE,
} from "@/lib/store-facts";

// Copy for collection hubs: meta descriptions and the visible intro under each
// hub's H1. Intros are generated from the build-time catalog (models in stock,
// lines, starting price) so they never claim something the catalog does not.

const INTRO_MIN_WORDS = 40;
const INTRO_MAX_WORDS = 60;
const HIGHLIGHT_ITEMS = 4;

function countWords(text: string): number {
  return text.split(/\s+/).filter((word) => /[\p{L}\p{N}]/u.test(word)).length;
}

function lowestPrice(products: CatalogProduct[]): number | null {
  const prices = products
    .map((product) => product.promotionalPrice ?? product.price)
    .filter((price): price is number => typeof price === "number" && price > 0);
  return prices.length > 0 ? Math.min(...prices) : null;
}

function titleCase(label: string): string {
  return label
    .toLowerCase()
    .replace(/(^|\s)(\p{L})/gu, (_, space, letter) => `${space}${letter.toUpperCase()}`);
}

function topLabels(labels: string[], max = HIGHLIGHT_ITEMS): { items: string[]; more: boolean } {
  const counts = new Map<string, number>();
  for (const label of labels) counts.set(label, (counts.get(label) ?? 0) + 1);
  const sorted = [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([label]) => label);
  return { items: sorted.slice(0, max), more: sorted.length > max };
}

/**
 * "Incluye las líneas Round, Wayfarer, Blaze y Erika, entre otras." from the
 * products' own subcategories. Variants of a line ("ROUND METAL", "ROUND
 * FOLDING") count as the line itself ("Round").
 */
export function categoryLineHighlight(
  products: CatalogProduct[],
  exclude: string[] = [],
): string | undefined {
  const excluded = new Set(exclude.map((value) => value.toLowerCase()));
  const leaves = products
    .map((product) => product.categories[product.categories.length - 1] ?? "")
    .filter((leaf) => leaf && isLineCategory(leaf, excluded));
  const byFirstWord = new Map<string, string>();
  for (const leaf of leaves) {
    const key = leaf.split(/\s+/)[0].toLowerCase();
    const current = byFirstWord.get(key);
    if (!current || leaf.length < current.length) byFirstWord.set(key, leaf);
  }
  const { items, more } = topLabels(
    leaves.map((leaf) => titleCase(byFirstWord.get(leaf.split(/\s+/)[0].toLowerCase()) ?? leaf)),
  );
  if (items.length === 0) return undefined;
  return `Incluye ${items.length === 1 ? "la línea" : "las líneas"} ${listPhrase(items)}${more ? ", entre otras" : ""}.`;
}

function isLineCategory(leaf: string, excluded: Set<string>): boolean {
  const normalized = leaf.toLowerCase();
  return !excluded.has(normalized) && !/^(lentes de sol|relojes)$/.test(normalized);
}

/**
 * Model lines read from product names once brand, product type and model
 * numbers are removed: "Reloj Invicta Pro Diver 49277" -> "Pro Diver".
 */
export function nameLineHighlight(
  products: CatalogProduct[],
  strip: RegExp = /$^/,
): string | undefined {
  const lines = products
    .map((product) => {
      const { displayName, brand } = getProductSeo(product);
      return displayName
        .replace(/^reloj\s+/i, "")
        .replace(brand, "")
        .replace(strip, "")
        .replace(/\b\S*\d\S*\b/g, "")
        .replace(/[|–—-]/g, " ")
        .replace(/\s+/g, " ")
        .trim();
    })
    .filter(Boolean);
  const { items, more } = topLabels(lines);
  if (items.length === 0) return undefined;
  return `Incluye ${items.length === 1 ? "la línea" : "las líneas"} ${listPhrase(items)}${more ? ", entre otras" : ""}.`;
}

/** "Incluye los modelos G023 y G020." from the products' display names. */
export function modelHighlight(products: CatalogProduct[], max = 3): string | undefined {
  const models = products.map((product) => {
    const { displayName, brand } = getProductSeo(product);
    return displayName
      .replace(/^reloj\s+/i, "")
      .replace(brand, "")
      .replace(/^[\s|–—-]+/, "")
      .trim();
  });
  if (models.length === 0) return undefined;

  // "Symbole PR20YS", "Symbole SPR19W"…: name the shared line once.
  const firstWords = new Set(models.map((model) => model.split(" ")[0]));
  const sharedLine =
    firstWords.size === 1 && models.every((model) => model.includes(" ") && /\d/.test(model))
      ? [...firstWords][0]
      : null;
  const codes = sharedLine ? models.map((model) => model.slice(sharedLine.length + 1)) : models;
  const listed = codes.slice(0, max);
  const more = codes.length > max ? ", entre otros" : "";
  const noun = listed.length === 1 ? "el modelo" : "los modelos";
  return sharedLine
    ? `Incluye la línea ${sharedLine}, con ${noun} ${listPhrase(listed)}${more}.`
    : `Incluye ${noun} ${listPhrase(listed)}${more}.`;
}

/** "Incluye Prada, Christian Dior, Versace y Louis Vuitton, entre otras marcas." */
export function brandHighlight(products: CatalogProduct[]): string | undefined {
  const { items, more } = topLabels(products.map((product) => canonicalBrand(product.brand)));
  if (items.length === 0) return undefined;
  return `Incluye ${listPhrase(items)}${more ? ", entre otras marcas" : ""}.`;
}

/**
 * Visible 40-60 word intro for a hub: models in stock, a highlight sentence,
 * starting price and the store's payment benefits.
 */
export function hubIntro({
  subject,
  products,
  outOfStock = [],
  highlight,
}: {
  /** What the hub sells, lowercase: "anteojos de sol Ray-Ban". */
  subject: string;
  /** In-stock products listed on the hub. */
  products: CatalogProduct[];
  outOfStock?: CatalogProduct[];
  highlight?: string;
}): string {
  const count = products.length;
  const price = lowestPrice(products);
  const payment = `Podés pagar en ${INSTALLMENTS_PHRASE} o con ${TRANSFER_DISCOUNT_PHRASE}, con ${CHECKOUT_PHRASE}.`;
  const advice = "Si tenés dudas, te asesoramos por WhatsApp.";
  const restock =
    outOfStock.length > 0
      ? "Los modelos sin stock figuran más abajo y podés consultarnos por su reposición."
      : "";

  if (count === 0) {
    return [
      `Por el momento no hay ${subject} con stock en Smile.`,
      restock,
      advice,
      payment,
    ]
      .filter(Boolean)
      .join(" ");
  }

  const opening = `En Smile hay ${count} ${count === 1 ? "modelo" : "modelos"} de ${subject} con stock${
    price !== null ? `, desde ${formatPrice(price)}` : ""
  }.`;
  const variants = [
    [opening, highlight, payment, advice],
    [opening, highlight, payment],
    [opening, payment, advice],
  ].map((parts) => parts.filter(Boolean).join(" "));

  for (const text of variants) {
    const words = countWords(text);
    if (words >= INTRO_MIN_WORDS && words <= INTRO_MAX_WORDS) return text;
    if (words < INTRO_MIN_WORDS && restock) {
      const longer = `${text} ${restock}`;
      if (countWords(longer) <= INTRO_MAX_WORDS) return longer;
    }
  }
  return variants[variants.length - 1];
}

/**
 * Hub meta description: a hand-written lead plus the store's payment
 * benefits, fitted to 140-155 characters (lib/collection-hubs.mjs).
 */
export function hubDescription(leads: string[]): string {
  return hubMetaDescription(leads);
}
