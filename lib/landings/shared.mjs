// Shared pieces of the landing pages (lib/landings/*.mjs): their paths, the
// summer season, product selections and the catalog facts their copy states.
// Plain JavaScript so node:test can check the pages against the real catalog.
// Prices, counts and model lists come from the products passed in (the
// catalog synced at build time); store terms come from lib/store-copy.mjs.
import {
  AUDIENCE_HUBS,
  frameFormat,
  isRayBanProduct,
  isSunglassesProduct,
  priceRange,
  productGender,
  SUNGLASSES_HUB,
} from "../collection-hubs.mjs";
import { link } from "../guides/shared.mjs";
import { formatPrice } from "../price-format.mjs";
import { descriptionLines } from "../product-copy.mjs";
import { listPhrase } from "../product-seo.mjs";
import { cardPrice, defaultVariant, getAvailableVariants } from "../storefront.mjs";

export const LANDING_PATHS = {
  rosario: "/anteojos-de-sol-rosario",
  summer: "/anteojos-de-sol-verano",
};

export const SUNGLASSES_PATH = SUNGLASSES_HUB.path;
export const RAY_BAN_PATH = "/tienda/marcas/ray-ban";
export const PREMIUM_PATH = "/tienda/marcas/premium";
export const STYLE_GUIDE_PATH = "/guia-de-estilo";

/** Most products a landing page's product grid shows. */
export const LANDING_GRID_LIMIT = 8;

// --- Summer season -----------------------------------------------------------

const SEASON_TIME_ZONE = "America/Argentina/Buenos_Aires";
const DAY_PARTS = new Intl.DateTimeFormat("en-US", {
  timeZone: SEASON_TIME_ZONE,
  year: "numeric",
  month: "numeric",
  day: "numeric",
});

/** Year, month (1-12) and day of a date, in Argentina. */
function argentinaDay(date) {
  const parts = Object.fromEntries(DAY_PARTS.formatToParts(date).map((part) => [part.type, part.value]));
  return { year: Number(parts.year), month: Number(parts.month), day: Number(parts.day) };
}

const isoDay = (year, month, day) =>
  `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

/**
 * The summer the page sells for on a date (by default, the build date) and
 * whether it has its Christmas angle. From July on it is next year's summer
 * ("verano 2027" from 1 July 2026); until June, the current year's. The
 * Christmas angle runs from 1 October to 25 December. `since` is the date the
 * page last changed because of the calendar (1 July, 1 October or 26
 * December), for the sitemap's lastmod.
 */
export function summerSeason(date = new Date()) {
  const { year, month, day } = argentinaDay(date);
  const summerYear = month >= 7 ? year + 1 : year;
  const christmas = month >= 10 && !(month === 12 && day > 25);
  let since;
  if (month === 12 && day > 25) since = isoDay(year, 12, 26);
  else if (month >= 10) since = isoDay(year, 10, 1);
  else if (month >= 7) since = isoDay(year, 7, 1);
  else since = isoDay(year - 1, 12, 26);
  return { year: summerYear, label: `verano ${summerYear}`, christmas, since };
}

/** The later of two ISO dates. */
export function laterDate(a, b) {
  return a > b ? a : b;
}

/** Ready-made links to the landing pages, for the hubs, the home and the footer. */
export function landingLinks(date = new Date()) {
  return {
    rosario: { label: "Anteojos de sol en Rosario", href: LANDING_PATHS.rosario },
    summer: { label: `Anteojos de sol ${summerSeason(date).label}`, href: LANDING_PATHS.summer },
  };
}

// --- Catalog facts -------------------------------------------------------------

/** "1 modelo", "3 modelos". */
export function modelsPhrase(count) {
  return `${count} ${count === 1 ? "modelo" : "modelos"}`;
}

/** "1 modelo polarizado", "7 modelos polarizados". */
export function polarizedPhrase(count) {
  return count === 1 ? "1 modelo polarizado" : `${count} modelos polarizados`;
}

/** One formatted price, or "<min> a <max>", from priceRange(). */
export function pricesLabel(range) {
  if (range.min === range.max) return formatPrice(range.min);
  return `${formatPrice(range.min)} a ${formatPrice(range.max)}`;
}

/** The in-stock sunglasses of a product list. */
export function sunglassesOf(products) {
  return products.filter(isSunglassesProduct);
}

/** The price a product's ranges and bands use: the same one as priceRange(). */
function comparablePrice(product) {
  const price = product.promotionalPrice ?? product.price;
  return typeof price === "number" && price > 0 ? price : null;
}

/** Products by brand label, brands with more products first, then by name. */
export function brandGroups(products, brandLabel) {
  const groups = new Map();
  for (const product of products) {
    const brand = brandLabel(product.brand);
    groups.set(brand, [...(groups.get(brand) ?? []), product]);
  }
  return [...groups.entries()]
    .sort(([nameA, a], [nameB, b]) => b.length - a.length || nameA.localeCompare(nameB, "es"))
    .map(([brand, items]) => ({ brand, products: items }));
}

/** "Ray-Ban, Prada y Christian Dior", or "…, entre otras marcas" past `max`. */
export function brandsPhrase(products, brandLabel, max = 3) {
  const brands = brandGroups(products, brandLabel).map((group) => group.brand);
  const listed = listPhrase(brands.slice(0, max));
  return brands.length > max ? `${listed}, entre otras marcas` : listed;
}

/** Products cheapest first (by card price), then by name. New array. */
function cheapestFirst(products) {
  return [...products].sort((a, b) => {
    const priceA = cardPrice(a) ?? Number.POSITIVE_INFINITY;
    const priceB = cardPrice(b) ?? Number.POSITIVE_INFINITY;
    return priceA - priceB || a.name.localeCompare(b.name, "es");
  });
}

/**
 * One product per brand, the cheapest of each, brands with more models
 * first: a sample of the range, not a ranking. At most `limit`.
 */
export function cheapestPerBrand(products, brandLabel, limit = LANDING_GRID_LIMIT) {
  return brandGroups(products, brandLabel)
    .slice(0, limit)
    .map((group) => cheapestFirst(group.products)[0]);
}

/**
 * One product per frame format of the description specs ("Formato:
 * Aviador"), formats with more models first; within a format, a brand not
 * picked yet when there is one, the cheapest first. At most `limit`.
 */
export function onePerFormat(products, brandLabel, limit = LANDING_GRID_LIMIT) {
  const formats = new Map();
  for (const product of products) {
    const format = frameFormat(product);
    if (format) formats.set(format, [...(formats.get(format) ?? []), product]);
  }
  const ordered = [...formats.entries()].sort(
    ([nameA, a], [nameB, b]) => b.length - a.length || nameA.localeCompare(nameB, "es"),
  );
  const brands = new Set();
  const picks = [];
  for (const [format, items] of ordered.slice(0, limit)) {
    const candidates = cheapestFirst(items);
    const pick = candidates.find((product) => !brands.has(brandLabel(product.brand))) ?? candidates[0];
    brands.add(brandLabel(pick.brand));
    picks.push({ format, product: pick });
  }
  return picks;
}

/** Discount of a variant at a promotional price below its list price, else 0. */
function variantDiscount(variant) {
  const price = Number(variant?.price);
  const promotional = Number(variant?.promotionalPrice);
  if (variant?.promotionalPrice === null || variant?.promotionalPrice === undefined) return 0;
  if (!Number.isFinite(price) || !Number.isFinite(promotional) || promotional <= 0 || promotional >= price) return 0;
  return 1 - promotional / price;
}

/**
 * True when the variant a product card shows (lib/storefront defaultVariant)
 * is purchasable at a promotional price below its list price: the price on
 * the card is the reduced one.
 */
export function isOnSale(product) {
  const variant = defaultVariant(product);
  return Boolean(variant) && getAvailableVariants(product).includes(variant) && variantDiscount(variant) > 0;
}

/** Products on sale, the largest reduction first, then cheapest, then by name. */
export function saleProducts(products) {
  return products
    .filter(isOnSale)
    .map((product) => ({ product, discount: variantDiscount(defaultVariant(product)) }))
    .sort(
      (a, b) =>
        b.discount - a.discount ||
        (cardPrice(a.product) ?? 0) - (cardPrice(b.product) ?? 0) ||
        a.product.name.localeCompare(b.product.name, "es"),
    )
    .map((entry) => entry.product);
}

/** Sunglasses whose sheet states UV protection ("Protección UV400", "rayos UV"). */
export function statesUvProtection(product) {
  return descriptionLines(product.descriptionHtml).some((line) => /\bUV(?:A|B|400)?\b/.test(line));
}

/** Gender counts of the products: unisex, men, women and unknown. */
export function genderCounts(products) {
  const counts = { unisex: 0, men: 0, women: 0, unknown: 0 };
  for (const product of products) counts[productGender(product) ?? "unknown"] += 1;
  return counts;
}

/** "de <min> a <max>", "todos a <price>" or, for one model, "a <price>": formatted prices. */
export function pricesSpan(range, count) {
  if (count === 1) return `a ${formatPrice(range.min)}`;
  if (range.min === range.max) return `todos a ${formatPrice(range.min)}`;
  return `de ${formatPrice(range.min)} a ${formatPrice(range.max)}`;
}

/**
 * Who the products are for, as their sheets say: how many are unisex, plus
 * those for one audience. "" when no sheet says unisex. `noun` names the
 * products: { one: "modelo con stock", many: "modelos con stock" }.
 */
export function unisexSentence(products, noun = { one: "modelo con stock", many: "modelos con stock" }) {
  const total = products.length;
  const { unisex, men, women } = genderCounts(products);
  if (unisex === 0) return "";
  if (unisex === total) {
    return total === 1
      ? `Según su ficha, el ${noun.one} es unisex: sirve tanto para mujer como para hombre.`
      : `Según sus fichas, los ${total} ${noun.many} son unisex: sirven tanto para mujer como para hombre.`;
  }
  const others = [women > 0 ? `${women} para mujer` : "", men > 0 ? `${men} para hombre` : ""].filter(Boolean);
  const verb = unisex === 1 ? "es" : "son";
  return `Según sus fichas, ${unisex} de los ${total} ${noun.many} ${verb} unisex, para mujer y para hombre${
    others.length > 0 ? `, y hay ${listPhrase(others)}` : ""
  }.`;
}

/**
 * Where to see the sunglasses by audience: the mujer / hombre sections while
 * they are indexed (`audienceHubs`, lib/hub-pages indexableHubs), else the
 * sunglasses hub, as the site's navigation does.
 */
export function audienceSentence(audienceHubs) {
  if (audienceHubs.length > 0) {
    const links = audienceHubs.map((hub) => link(hub.subject, hub.path));
    return `Si querés ver solo los de un público, entrá a ${links.join(" o ")}.`;
  }
  return `Los encontrás todos juntos en ${link("anteojos de sol", SUNGLASSES_PATH)}, con filtro por marca.`;
}

/**
 * The sunglasses audience hub (mujer / hombre) and the products it would
 * list: those the catalog gives to that audience or as unisex.
 */
export function audienceProducts(products, audience) {
  const hub = AUDIENCE_HUBS.find((entry) => entry.kind === "sunglasses" && entry.audience === audience);
  return { hub, products: products.filter(hub.matches) };
}

/**
 * Price bands for gifts, split at the free-shipping minimum synced from
 * Tiendanube: "hasta" and "más de" that amount, each with its count, range
 * and brands. One band when every order ships free (minimum 0) or every
 * product falls on one side. Bands without products are left out.
 */
export function giftBands(products, { minimumArs, brandLabel }) {
  const priced = products.filter((product) => comparablePrice(product) !== null);
  const upTo = (product) => comparablePrice(product) <= minimumArs;
  const bands =
    minimumArs > 0
      ? [
          { label: `Hasta ${formatPrice(minimumArs)}`, products: priced.filter(upTo) },
          { label: `Más de ${formatPrice(minimumArs)}`, products: priced.filter((product) => !upTo(product)) },
        ]
      : [{ label: "Todos los presupuestos", products: priced }];
  return bands
    .filter((band) => band.products.length > 0)
    .map((band) => ({
      label: band.label,
      count: band.products.length,
      range: priceRange(band.products),
      brands: brandsPhrase(band.products, brandLabel),
      products: band.products,
    }));
}

/** Ray-Ban sunglasses of a product list. */
export function rayBanOf(products) {
  return products.filter(isRayBanProduct);
}
