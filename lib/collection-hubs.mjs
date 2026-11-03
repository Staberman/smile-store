// Collection hubs built from catalog data: the Ray-Ban model hubs
// (/tienda/marcas/ray-ban/<modelo>), the sunglasses hub and the audience hubs
// (anteojos de sol y relojes para hombre o mujer). Product matching, the
// index/noindex rule and the visible copy (intro, FAQ, meta description) are
// plain JavaScript so node:test can check them against the real catalog;
// lib/hub-pages.ts wires them to the catalog, the brand directory and the
// price formatter.
import { descriptionLines, productAudience, productKind, splitDescription } from "./product-copy.mjs";
import { fitDescription, listPhrase } from "./product-seo.mjs";
import {
  CHECKOUT_PHRASE,
  INSTALLMENTS_PHRASE,
  STORE_LOCATION,
  STORE_PICKUP_PHRASE,
  TRANSFER_DISCOUNT_PHRASE,
} from "./store-copy.mjs";
import { PICKUP_FAQ_ANSWER } from "./store-faqs.mjs";
import { getInstallmentPrice, getTransferPrice } from "./storefront.mjs";

/**
 * A hub is indexed when the catalog has at least this many of its products,
 * in stock or not. The hourly sync keeps sold-out products in the catalog,
 * so a sale or a restock never flips a hub between index and noindex.
 */
export const MIN_INDEXABLE_PRODUCTS = 3;
/** With fewer products than this in stock, a hub suggests in-stock alternatives. */
export const MIN_IN_STOCK_PRODUCTS = 3;
const ALTERNATIVES_LIMIT = 4;

export function isIndexableHub(catalogCount) {
  return catalogCount >= MIN_INDEXABLE_PRODUCTS;
}

/**
 * An audience hub (hombre / mujer) is indexed only when it leaves out at
 * least this share of its parent section's catalog: otherwise it repeats the
 * parent's listing (today every pair of sunglasses is unisex) and would
 * compete with it as a near-duplicate page.
 */
export const MIN_AUDIENCE_EXCLUSION = 0.2;

/** True when a hub's catalog leaves out enough of its parent's catalog. */
export function isDistinctFromParent(catalogCount, parentCount) {
  return parentCount > 0 && (parentCount - catalogCount) / parentCount >= MIN_AUDIENCE_EXCLUSION;
}

function normalize(value) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/** Ray-Ban products, whatever the catalog spelling: "Ray Ban", "RAY BAN", "Rayban". */
export function isRayBanProduct(product) {
  return [product.brand, ...(product.categories ?? [])].some((value) =>
    normalize(value).replace(/\s+/g, "").includes("rayban"),
  );
}

export function isSunglassesProduct(product) {
  return productKind(product) === "sunglasses";
}

// Description specs ("Género: Unisex", "Formato: Aviador"…), parsed once per product.
const specCache = new WeakMap();

function productSpecs(product) {
  let specs = specCache.get(product);
  if (!specs) {
    specs = new Map(
      splitDescription(descriptionLines(product.descriptionHtml)).specs.map((spec) => [
        spec.name,
        spec.value,
      ]),
    );
    specCache.set(product, specs);
  }
  return specs;
}

function audienceFromText(value) {
  const text = normalize(value);
  const women = /\b(mujer|mujeres|dama|damas)\b/.test(text);
  const men = /\b(hombre|hombres|caballero|caballeros)\b/.test(text);
  if (/\bunisex\b/.test(text) || (women && men)) return "unisex";
  if (women) return "women";
  if (men) return "men";
  return null;
}

/**
 * Who a product is for: its gender tags and store categories ("dama",
 * "caballero"), else the "Género" line of its description. Null when the
 * catalog does not say.
 */
export function productGender(product) {
  return productAudience(product) ?? audienceFromText(productSpecs(product).get("Género"));
}

// --- Hub definitions -------------------------------------------------------

// `fact` is one verifiable sentence about the model, checked against the
// source noted above it. Leave a model without one rather than guess.
// `leads` open the meta description, most detailed first (hubMetaDescription).
const RAY_BAN_MODELS = [
  {
    slug: "aviador",
    name: "Aviador",
    // The catalog spells it both ways: "Aviador Classic 3025", "Aviator Outdoorsman".
    words: ["aviador", "aviator"],
    // https://en.wikipedia.org/wiki/Aviator_sunglasses
    fact: "Los Ray-Ban Aviador nacieron como anteojos para pilotos: Bausch & Lomb los desarrolló junto al Cuerpo Aéreo del Ejército de los Estados Unidos y salieron a la venta en 1937.",
    leads: [
      "Ray-Ban Aviador precio en Argentina: anteojos de sol originales, creados para pilotos en 1937.",
      "Ray-Ban Aviador precio en Argentina: anteojos de sol originales.",
    ],
  },
  {
    slug: "wayfarer",
    name: "Wayfarer",
    words: ["wayfarer"],
    // https://en.wikipedia.org/wiki/Ray-Ban_Wayfarer
    fact: "El Wayfarer fue diseñado en 1952 por Raymond Stegeman, diseñador óptico de Bausch & Lomb, la empresa dueña de Ray-Ban en ese momento.",
    leads: [
      "Ray-Ban Wayfarer precio en Argentina: anteojos de sol originales, el diseño de 1952.",
      "Ray-Ban Wayfarer precio en Argentina: anteojos de sol originales.",
    ],
  },
  {
    slug: "round",
    name: "Round",
    words: ["round"],
    // Ray-Ban's RB3447 copy: "inspired by the 1960s counter-culture when this
    // style first originated" (as published by Ray-Ban and its retailers).
    fact: "Ray-Ban presenta el Round Metal (RB3447) como un diseño inspirado en la contracultura de los años 60, cuando se originó este estilo de armazón redondo.",
    leads: [
      "Ray-Ban Round precio en Argentina: anteojos de sol originales, Round Metal, Blaze y más.",
      "Ray-Ban Round precio en Argentina: anteojos de sol originales.",
    ],
  },
  {
    slug: "hexagonal",
    name: "Hexagonal",
    words: ["hexagonal"],
    // Ray-Ban's RB3548N copy: "the evolution of round featuring flat crystal
    // lenses", on a thin metal frame.
    fact: "Ray-Ban presenta el Hexagonal (RB3548) como una evolución de su clásico Round, con armazón fino de metal y lentes planos.",
    leads: [
      "Ray-Ban Hexagonal precio en Argentina: anteojos originales, la evolución del Round.",
      "Ray-Ban Hexagonal precio en Argentina: anteojos de sol originales.",
    ],
  },
  {
    slug: "erika",
    name: "Erika",
    words: ["erika"],
    // RB4171 retailer specs: oversized round shape. (Its nylon frame is left
    // out: the store's own sheets list other Erika versions in acetate.)
    fact: "El Erika (RB4171) es un modelo de forma redonda y tamaño oversize.",
    leads: [
      "Ray-Ban Erika precio en Argentina: anteojos de sol originales, redondos y oversize.",
      "Ray-Ban Erika precio en Argentina: anteojos de sol originales.",
    ],
  },
];

export const RAY_BAN_MODEL_HUBS = RAY_BAN_MODELS.map((model) => {
  const pattern = new RegExp(`\\b(?:${model.words.join("|")})\\b`);
  return {
    key: `ray-ban-${model.slug}`,
    group: "model",
    parent: "ray-ban",
    slug: model.slug,
    path: `/tienda/marcas/ray-ban/${model.slug}`,
    name: model.name,
    title: `Ray-Ban ${model.name}: precio en Argentina`,
    h1: `Anteojos de sol Ray-Ban ${model.name}`,
    eyebrow: "Modelos Ray-Ban",
    crumb: model.name,
    linkLabel: `Ray-Ban ${model.name}`,
    subject: `anteojos de sol Ray-Ban ${model.name}`,
    gridLabel: `Ray-Ban ${model.name} con stock`,
    summary: `Anteojos de sol Ray-Ban ${model.name}. ${model.fact}`,
    fact: model.fact,
    descriptionLeads: model.leads,
    alternativesTitle: "Otros modelos Ray-Ban disponibles",
    // Model names only: categories are not reliable ("Erika Polarizado 4171"
    // is filed under CHRIS, "Blaze Shooter" under AVIADOR).
    matches: (product) => isRayBanProduct(product) && pattern.test(normalize(product.name)),
    inParent: isRayBanProduct,
  };
});

export const SUNGLASSES_HUB = {
  key: "anteojos-de-sol",
  group: "category",
  parent: null,
  slug: "anteojos-de-sol",
  path: "/tienda/anteojos-de-sol",
  name: "Anteojos de sol",
  title: "Anteojos de sol originales en Argentina",
  h1: "Anteojos de sol originales",
  eyebrow: "Colección",
  crumb: "Anteojos de sol",
  linkLabel: "Anteojos de sol",
  subject: "anteojos de sol",
  gridLabel: "Anteojos de sol con stock",
  summary: "Todos los anteojos de sol: Ray-Ban, Scuderia Ferrari y marcas premium.",
  descriptionLeads: [
    // The page for both audiences while most models are unisex.
    "Anteojos de sol originales para hombre y mujer en Argentina: Ray-Ban, Prada, Versace y más.",
    "Anteojos de sol originales en Argentina.",
  ],
  alternativesTitle: "Otros productos disponibles",
  matches: isSunglassesProduct,
  inParent: isSunglassesProduct,
};

const AUDIENCE_WORDS = {
  men: { label: "hombre", watchTerm: "caballero" },
  women: { label: "mujer", watchTerm: "dama" },
};

function audienceHub({ kind, audience, leads }) {
  const { label, watchTerm } = AUDIENCE_WORDS[audience];
  const watch = kind === "watch";
  const parent = watch ? "relojes" : "anteojos-de-sol";
  const noun = watch ? "Relojes" : "Anteojos de sol";
  return {
    key: `${parent}-${label}`,
    group: "audience",
    parent,
    slug: label,
    path: `/tienda/${parent}/${label}`,
    name: `${noun} para ${label}`,
    kind,
    audience,
    audienceLabel: label,
    // Watches follow the store's own categories ("dama" / "caballero").
    storeTerm: watch ? watchTerm : label,
    title: `${noun} para ${label} en Argentina`,
    h1: `${noun} para ${label}`,
    eyebrow: noun,
    crumb: label === "hombre" ? "Hombre" : "Mujer",
    linkLabel: `${noun} para ${label}`,
    subject: `${noun.toLowerCase()} para ${label}`,
    gridLabel: `${noun} para ${label} con stock`,
    summary: watch
      ? `Relojes para ${label}: los modelos que el catálogo clasifica para ${label} (${watchTerm}).`
      : `Anteojos de sol para ${label}, incluidos los modelos unisex.`,
    descriptionLeads: leads,
    alternativesTitle: watch ? "Otros relojes disponibles" : "Otros anteojos de sol disponibles",
    matches: (product) => {
      if (productKind(product) !== kind) return false;
      const gender = productGender(product);
      return gender === audience || gender === "unisex";
    },
    inParent: (product) => productKind(product) === kind,
  };
}

export const AUDIENCE_HUBS = [
  audienceHub({
    kind: "sunglasses",
    audience: "men",
    leads: [
      "Anteojos de sol para hombre originales en Argentina: Ray-Ban, Prada, Versace y más marcas.",
      "Anteojos de sol para hombre originales en Argentina.",
    ],
  }),
  audienceHub({
    kind: "sunglasses",
    audience: "women",
    leads: [
      "Anteojos de sol para mujer originales en Argentina: Ray-Ban, Prada, Christian Dior y más marcas.",
      "Anteojos de sol para mujer originales en Argentina.",
    ],
  }),
  audienceHub({
    kind: "watch",
    audience: "men",
    leads: [
      "Relojes para hombre originales en Argentina: modelos Tommy Hilfiger de la línea caballero.",
      "Relojes para hombre originales en Argentina.",
    ],
  }),
  audienceHub({
    kind: "watch",
    audience: "women",
    leads: [
      "Relojes para mujer originales en Argentina: modelos Tommy Hilfiger de la línea dama.",
      "Relojes para mujer originales en Argentina.",
    ],
  }),
];

/** Every hub this module builds, parents before children. */
export const COLLECTION_HUBS = [SUNGLASSES_HUB, ...AUDIENCE_HUBS, ...RAY_BAN_MODEL_HUBS];

/**
 * The Ray-Ban model hub that lists a product ("Aviador Classic 3025" ->
 * Aviador), or null. Model hubs match by model name, so no catalog product
 * is in two of them.
 */
export function modelHubOf(product) {
  return RAY_BAN_MODEL_HUBS.find((hub) => hub.matches(product)) ?? null;
}

// --- Catalog facts -----------------------------------------------------------

function comparablePrice(product) {
  const price = product.promotionalPrice ?? product.price;
  return typeof price === "number" && price > 0 ? price : null;
}

/** Lowest and highest price among products, or null without prices. */
export function priceRange(products) {
  const prices = products.map(comparablePrice).filter((price) => price !== null);
  if (prices.length === 0) return null;
  return { min: Math.min(...prices), max: Math.max(...prices) };
}

/** Labels by how many products carry them, most frequent first. */
function rankLabels(labels) {
  const counts = new Map();
  for (const label of labels) {
    if (label) counts.set(label, (counts.get(label) ?? 0) + 1);
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([label, count]) => ({ label, count }));
}

const LENS_TYPES = [
  ["clasico", "clásicos"],
  ["degrade", "degradé"],
  ["espejado", "espejados"],
  ["polarizado", "polarizados"],
];

/** "Clásicos, Degrade y Espejados" (spec) plus "Polarizado" in the name. */
function lensTypes(product) {
  const text = normalize(`${productSpecs(product).get("Lentes disponibles") ?? ""} ${product.name}`);
  return LENS_TYPES.filter(([word]) => new RegExp(`\\b${word}s?\\b`).test(text)).map(
    ([, label]) => label,
  );
}

function lensMaterial(product) {
  const value = normalize(productSpecs(product).get("Material del lente"));
  if (value.startsWith("cristal mineral")) return "cristal mineral";
  if (value.startsWith("policarbonato")) return "policarbonato";
  return null;
}

function frameMaterial(product) {
  const value = normalize(productSpecs(product).get("Material del marco"));
  if (value.startsWith("acetato")) return "acetato";
  if (value.startsWith("metal")) return "metal";
  return null;
}

const FORMAT_LABELS = new Map([
  ["redondo", "redondo"],
  ["redondos", "redondo"],
  ["cuadrado", "cuadrado"],
  ["cuadrados", "cuadrado"],
  ["octagonal", "octogonal"],
  ["octogonal", "octogonal"],
  ["cat eye", "cat eye"],
  ["rectangular", "rectangular"],
  ["aviador", "aviador"],
  ["hexagonal", "hexagonal"],
  ["ovalado", "ovalado"],
]);

function frameFormat(product) {
  return FORMAT_LABELS.get(normalize(productSpecs(product).get("Formato"))) ?? null;
}

const SIZE_OPTION = /\b(standard|small|large)\b|\([sml]\)/i;
const COLORWAY_OPTION = /^[\p{L} ]+\/[\p{L} ]+$/u;

/** In-stock "Armazón/Lente" variant options: "Dorado/Verde" -> "dorado/verde". */
function colorways(product) {
  const values = (product.variants ?? [])
    .filter((variant) => variant.available && variant.stock > 0)
    .flatMap((variant) => variant.options ?? [])
    .map((option) => String(option).replace(/\s*\/\s*/g, "/").replace(/\s+/g, " ").trim())
    .filter((option) => !SIZE_OPTION.test(option) && COLORWAY_OPTION.test(option))
    .map((option) =>
      option
        .toLowerCase()
        .replace(/(?<!\p{L})degrade(?!\p{L})/gu, "degradé")
        .replace(/(?<!\p{L})mar+[oó]n(?!\p{L})/gu, "marrón"),
    );
  return [...new Set(values)];
}

/**
 * Facts the hub copy states, computed from the given products: brands,
 * lens types and materials, frame materials and formats (description specs),
 * in-stock colorways and genders. `brandLabel` maps a raw catalog brand to
 * its display name.
 */
export function hubFacts(products, { brandLabel = (brand) => brand } = {}) {
  const genders = { unisex: 0, men: 0, women: 0, unknown: 0 };
  for (const product of products) genders[productGender(product) ?? "unknown"] += 1;
  const orderedLensTypes = new Set(products.flatMap(lensTypes));

  return {
    count: products.length,
    price: priceRange(products),
    brands: rankLabels(products.map((product) => brandLabel(product.brand))),
    lensTypes: LENS_TYPES.map(([, label]) => label).filter((label) => orderedLensTypes.has(label)),
    lensMaterials: rankLabels(products.map(lensMaterial)).map((entry) => entry.label),
    frameMaterials: rankLabels(products.map(frameMaterial)).map((entry) => entry.label),
    formats: rankLabels(products.map(frameFormat)).map((entry) => entry.label),
    colorways: rankLabels(products.flatMap(colorways)).map((entry) => entry.label),
    genders,
  };
}

// --- Copy --------------------------------------------------------------------

const PAYMENT_SENTENCE = `Podés pagar en ${INSTALLMENTS_PHRASE} o con ${TRANSFER_DISCOUNT_PHRASE}, con ${CHECKOUT_PHRASE}.`;
const LOCATION_SENTENCE = `Smile es una tienda online de ${STORE_LOCATION.locality}, ${STORE_LOCATION.region}, con envíos a todo el país y ${STORE_PICKUP_PHRASE}.`;
const STOCK_SYNC_ANSWER =
  "El stock de Smile se sincroniza con Tiendanube cada hora. Los modelos agotados siguen publicados con la etiqueta «Sin stock» y podés consultarnos por WhatsApp por su reposición.";
const PICKUP_FAQ = {
  question: `¿Puedo retirar en ${STORE_LOCATION.locality}?`,
  answer: PICKUP_FAQ_ANSWER,
};

export function countWords(text) {
  return String(text).split(/\s+/).filter((word) => /[\p{L}\p{N}]/u.test(word)).length;
}

/** "a", "a o b", "a, b o c". */
function orPhrase(items) {
  return listPhrase(items).replace(/ y ([^,]+)$/, " o $1");
}

function modelsWord(count) {
  return count === 1 ? "modelo" : "modelos";
}

/** "182.700" or "entre 182.700 y 215.000", with the given formatter. */
function priceSpan(range, formatPrice) {
  if (range.min === range.max) return formatPrice(range.min);
  return `entre ${formatPrice(range.min)} y ${formatPrice(range.max)}`;
}

/** Up to three model names without the brand: "Aviador Classic 3025, … y …". */
function modelNames(products, { displayName, brandLabel }, max = 3) {
  const names = products.map((product) => {
    const name = displayName(product);
    const brand = brandLabel(product.brand);
    return name.startsWith(`${brand} `) ? name.slice(brand.length + 1) : name;
  });
  const listed = listPhrase(names.slice(0, max));
  return names.length > max ? `${listed}, entre otros` : listed;
}

function brandPhrase(facts, max = 4) {
  const brands = facts.brands.map((entry) => entry.label);
  const listed = listPhrase(brands.slice(0, max));
  return brands.length > max ? `${listed}, entre otras marcas` : listed;
}

function formatPhrase(facts, max = 5) {
  const listed = listPhrase(facts.formats.slice(0, max));
  return facts.formats.length > max ? `${listed}, entre otros` : listed;
}

/** "En Smile hay 12 modelos de … con stock, desde $ 99.000…" or the no-stock sentence. */
function stockSentence(hub, page, tail, formatPrice) {
  const { inStock, outOfStock } = page;
  if (inStock.length === 0) {
    const soldOut = outOfStock.length > 0 ? " o mirá los modelos agotados más abajo" : "";
    return `Por el momento no hay unidades disponibles de ${hub.subject}: consultanos por WhatsApp por su reposición${soldOut}.`;
  }
  const range = priceRange(inStock);
  const from = range ? `, desde ${formatPrice(range.min)}` : "";
  const count = `${inStock.length} ${modelsWord(inStock.length)}`;
  // Audience hubs already named what they list in the sentence before.
  const lead =
    hub.group === "audience" ? `Hoy hay ${count}` : `En Smile hay ${count} de ${hub.subject}`;
  return `${lead} con stock${from}${tail}.`;
}

function priceAnswer(hub, inStock, formatPrice) {
  const range = priceRange(inStock);
  if (inStock.length === 0 || !range) {
    return `Por el momento no hay unidades disponibles de ${hub.subject}. Consultanos por WhatsApp por precio y reposición; cuando vuelvan a estar en stock, podés pagar en ${INSTALLMENTS_PHRASE} o con ${TRANSFER_DISCOUNT_PHRASE}.`;
  }
  const lead =
    inStock.length === 1
      ? `El único modelo de ${hub.subject} con stock cuesta ${formatPrice(range.min)}.`
      : `Los ${inStock.length} modelos de ${hub.subject} con stock cuestan ${priceSpan(range, formatPrice)}.`;
  return `${lead} ${PAYMENT_SENTENCE}`;
}

/** How many of the products are unisex, or "" when none is. */
function unisexNote(hub, facts) {
  const { unisex } = facts.genders;
  const { count } = facts;
  if (unisex === 0) return "";
  // The sunglasses hub is the page for both audiences: say so plainly.
  if (hub.group === "category") {
    if (unisex === count) return "Todos son modelos unisex, para hombre y mujer, según la ficha de cada producto.";
    if (unisex * 2 > count) {
      return `La mayoría son modelos unisex, para hombre y mujer: ${unisex} de los ${count} lo indican en su ficha.`;
    }
    return `${unisex} de los ${count} modelos son unisex, para hombre y mujer, según su ficha.`;
  }
  if (unisex < count) return `${unisex} de los ${count} modelos son unisex según su ficha.`;
  const other = hub.audience === "men" ? "mujer" : "hombre";
  return `Todos son modelos unisex según la ficha de cada producto, así que también figuran en la sección para ${other}.`;
}

/** "También hay 3 modelos para hombre y 5 modelos para mujer.", or "" without any. */
function genderSplit({ genders }) {
  const parts = [
    genders.men > 0 ? `${genders.men} ${modelsWord(genders.men)} para hombre` : "",
    genders.women > 0 ? `${genders.women} ${modelsWord(genders.women)} para mujer` : "",
  ].filter(Boolean);
  return parts.length > 0 ? `También hay ${listPhrase(parts)}.` : "";
}

function modelIntro(hub, page, ctx) {
  const { inStock, catalog } = page;
  const facts = hubFacts(inStock.length > 0 ? inStock : catalog, ctx);
  const names = inStock.length > 0 ? `: ${modelNames(inStock, ctx)}` : "";
  const lenses = facts.lensTypes.length > 0
    ? `Según sus fichas, hay lentes ${listPhrase(facts.lensTypes)}${
        facts.lensMaterials.length > 0 ? `, de ${orPhrase(facts.lensMaterials)}` : ""
      }.`
    : "";
  return [hub.fact, stockSentence(hub, page, names, ctx.formatPrice), lenses, PAYMENT_SENTENCE, LOCATION_SENTENCE];
}

function listingIntro(hub, page, ctx) {
  const { inStock, catalog, parentCatalog } = page;
  const facts = hubFacts(inStock.length > 0 ? inStock : catalog, ctx);
  const brands = facts.brands.length > 0 ? `, de ${brandPhrase(facts)}` : "";
  const formats = facts.formats.length > 0 ? `Hay formatos ${formatPhrase(facts)}.` : "";
  const parts = [];

  if (hub.group === "audience") {
    const unisex = catalog.some((product) => productGender(product) === "unisex") ? " o como unisex" : "";
    const term = hub.storeTerm !== hub.audienceLabel ? ` (${hub.storeTerm})` : "";
    parts.push(
      `Esta sección reúne ${hub.kind === "watch" ? "los relojes" : "los anteojos de sol"} que el catálogo de Smile clasifica para ${hub.audienceLabel}${term}${unisex}.`,
    );
  }
  parts.push(stockSentence(hub, page, brands, ctx.formatPrice));
  if (hub.kind === "watch") parts.push(unclassifiedNote(hub, parentCatalog, ctx));
  else parts.push(unisexNote(hub, facts), formats);
  parts.push(PAYMENT_SENTENCE, LOCATION_SENTENCE);
  return parts;
}

/** Brands of the parent section the catalog gives no gender for. */
function unclassifiedBrands(parentCatalog, ctx) {
  return rankLabels(
    parentCatalog
      .filter((product) => productGender(product) === null)
      .map((product) => ctx.brandLabel(product.brand)),
  ).map((entry) => entry.label);
}

function unclassifiedNote(hub, parentCatalog, ctx) {
  const brands = unclassifiedBrands(parentCatalog, ctx);
  if (brands.length === 0) return "";
  return `Los relojes ${listPhrase(brands)} no tienen clasificación por género en el catálogo y están en la sección Relojes.`;
}

/** Visible intro under the H1: 60-120 words of catalog facts and store terms. */
export function hubIntro(hub, page, ctx) {
  const parts = hub.group === "model" ? modelIntro(hub, page, ctx) : listingIntro(hub, page, ctx);
  return parts.filter(Boolean).join(" ");
}

/**
 * 3-4 buyer questions answered from catalog data and store facts only.
 * Model and audience hubs end with the pickup question; the rest are the
 * hub's most useful questions that apply, in order.
 */
export function hubFaqs(hub, page, ctx) {
  const questions = hub.group === "model" ? modelFaqs(hub, page, ctx) : listingFaqs(hub, page, ctx);
  if (hub.group === "category") return questions.slice(0, 4);
  return [...questions.slice(0, 3), PICKUP_FAQ];
}

function modelFaqs(hub, page, ctx) {
  const { inStock, catalog } = page;
  const facts = hubFacts(inStock.length > 0 ? inStock : catalog, ctx);
  const faqs = [
    {
      question: `¿Cuánto cuestan los Ray-Ban ${hub.name} en Smile?`,
      answer: priceAnswer(hub, inStock, ctx.formatPrice),
    },
  ];

  const colors = facts.colorways.slice(0, 4);
  if (facts.lensTypes.length > 0 || colors.length > 0) {
    faqs.push({
      question: `¿Qué lentes y colores tienen los Ray-Ban ${hub.name}?`,
      answer: [
        facts.lensTypes.length > 0
          ? `Según las fichas de producto, hay lentes ${listPhrase(facts.lensTypes)}${
              facts.lensMaterials.length > 0 ? ` de ${orPhrase(facts.lensMaterials)}` : ""
            }${facts.frameMaterials.length > 0 ? `, con armazón de ${orPhrase(facts.frameMaterials)}` : ""}.`
          : "",
        colors.length > 0
          ? `Algunas combinaciones de armazón y lente con stock: ${listPhrase(colors)}.`
          : "",
      ]
        .filter(Boolean)
        .join(" "),
    });
  }

  // Only when every product whose sheet states a gender says unisex.
  const { genders, count } = hubFacts(catalog, ctx);
  const known = count - genders.unknown;
  if (known > 0 && genders.unisex === known) {
    faqs.push({
      question: `¿Los Ray-Ban ${hub.name} son unisex?`,
      answer:
        genders.unknown === 0
          ? `Sí. Las fichas de los Ray-Ban ${hub.name} de Smile los indican como unisex: sirven para hombre y para mujer.`
          : `Sí. Todos los Ray-Ban ${hub.name} de Smile que indican el género en su ficha son unisex: sirven para hombre y para mujer.`,
    });
  }

  faqs.push({ question: `¿Cómo sé si un Ray-Ban ${hub.name} tiene stock?`, answer: STOCK_SYNC_ANSWER });
  return faqs;
}

function listingFaqs(hub, page, ctx) {
  const { inStock, catalog, parentCatalog } = page;
  const facts = hubFacts(inStock.length > 0 ? inStock : catalog, ctx);
  const faqs = [];
  const price = { question: `¿Cuánto cuestan los ${hub.subject}?`, answer: priceAnswer(hub, inStock, ctx.formatPrice) };

  faqs.push({
    question: `¿Qué marcas de ${hub.subject} hay en Smile?`,
    answer:
      inStock.length > 0
        ? `Hoy hay ${inStock.length} ${modelsWord(inStock.length)} con stock: ${listPhrase(
            facts.brands.map((entry) => `${entry.label} (${entry.count})`),
          )}.`
        : `Por el momento no hay ${hub.subject} con stock. Consultanos por WhatsApp por la reposición de los modelos agotados.`,
  });

  if (hub.kind === "watch") {
    const brands = unclassifiedBrands(parentCatalog, ctx);
    if (brands.length > 0) {
      faqs.push({
        question: `¿Por qué no aparecen los relojes ${listPhrase(brands)}?`,
        answer: `Porque el catálogo de Smile no los clasifica para hombre ni para mujer. Los encontrás en la sección Relojes, junto con el resto de los modelos.`,
      });
    }
  } else {
    const note = unisexNote(hub, facts);
    if (note) {
      faqs.push({
        question: hub.group === "audience"
          ? `¿Los ${hub.subject} son unisex?`
          : "¿Hay anteojos de sol para hombre y para mujer?",
        answer: hub.group === "audience" ? note : [`Sí. ${note}`, genderSplit(facts)].filter(Boolean).join(" "),
      });
    }
    const formats =
      facts.formats.length > 0
        ? {
            question: `¿Qué formatos de ${hub.subject} hay?`,
            answer: `Según las fichas de producto, hay formatos ${formatPhrase(facts, 8)}. Si no sabés cuál te queda mejor, la guía de estilo explica qué formato favorece a cada forma de rostro.`,
          }
        : null;
    // The sunglasses hub has room for formats before prices; audience hubs
    // keep prices among their first three (the pickup question comes last).
    if (formats && hub.group === "category") faqs.push(formats);
    faqs.push(price);
    if (formats && hub.group !== "category") faqs.push(formats);
    faqs.push({ question: "¿Cómo sé si un modelo tiene stock?", answer: STOCK_SYNC_ANSWER });
    return faqs;
  }

  faqs.push(price, { question: "¿Cómo sé si un modelo tiene stock?", answer: STOCK_SYNC_ANSWER });
  return faqs;
}

/**
 * Meta description: a hand-written lead plus the store's payment terms,
 * fitted to 140-155 characters.
 */
export function hubMetaDescription(leads) {
  return fitDescription({
    leads,
    offers: [
      `Comprá en Smile en ${INSTALLMENTS_PHRASE} o con ${TRANSFER_DISCOUNT_PHRASE}.`,
      `${INSTALLMENTS_PHRASE} o ${TRANSFER_DISCOUNT_PHRASE} en Smile.`,
    ],
    extras: ["Checkout seguro de Tiendanube.", "Atención personalizada por WhatsApp."],
  });
}

/**
 * The price block of a hub page: the price range of the products in stock,
 * the transfer price and one installment of the cheapest, from the same
 * figures as the intro and the price FAQ (priceRange). Null without stock
 * or prices, so the page omits the block.
 */
export function hubPriceBlock(hub, inStock, formatPrice) {
  const range = priceRange(inStock);
  if (inStock.length === 0 || !range) return null;
  return {
    heading: `Precio de ${hub.linkLabel} en Argentina`,
    facts: [
      {
        label: inStock.length === 1 ? "Precio" : "Rango de precios",
        value: range.min === range.max ? formatPrice(range.min) : `${formatPrice(range.min)} a ${formatPrice(range.max)}`,
      },
      {
        label: "Transferencia",
        value: `${formatPrice(getTransferPrice(range.min))} el más económico (${TRANSFER_DISCOUNT_PHRASE})`,
      },
      {
        label: "Cuotas",
        value: `${INSTALLMENTS_PHRASE} de ${formatPrice(getInstallmentPrice(range.min))} el más económico`,
      },
    ],
  };
}

/**
 * In-stock products of the hub's parent section that the hub does not list,
 * closest in price to the hub's own products first. Empty while the hub has
 * enough products in stock.
 */
export function hubAlternatives(hub, page, limit = ALTERNATIVES_LIMIT) {
  const { inStock, catalog, parentInStock } = page;
  if (inStock.length >= MIN_IN_STOCK_PRODUCTS) return [];
  const listed = new Set(catalog.map((product) => product.id));
  // An audience hub never suggests products made for the other audience.
  const suits = (product) => {
    if (hub.group !== "audience") return true;
    const gender = productGender(product);
    return gender === null || gender === "unisex" || gender === hub.audience;
  };
  const reference = priceRange(catalog)?.min ?? null;
  const distance = (product) => {
    const price = comparablePrice(product);
    return reference === null || price === null ? Number.POSITIVE_INFINITY : Math.abs(price - reference);
  };
  return parentInStock
    .filter((product) => !listed.has(product.id) && suits(product))
    .sort((a, b) => distance(a) - distance(b) || a.name.localeCompare(b.name))
    .slice(0, limit);
}

/**
 * Everything a hub page renders besides the product grids. `page.inStock`
 * and `page.outOfStock` are the hub's products; `parentInStock` and
 * `parentCatalog` those of its parent section (Ray-Ban for a model hub).
 */
export function buildHubPage(hub, { inStock, outOfStock, parentInStock, parentCatalog }, ctx) {
  const page = {
    inStock,
    outOfStock,
    catalog: [...inStock, ...outOfStock],
    parentInStock,
    parentCatalog,
  };
  // Both rules count catalog products, in stock or not, so stock changes
  // never flip a hub; tagging gender-specific models in Tiendanube does.
  const indexable =
    isIndexableHub(page.catalog.length) &&
    (hub.group !== "audience" || isDistinctFromParent(page.catalog.length, parentCatalog.length));
  return {
    catalogCount: page.catalog.length,
    indexable,
    description: hubMetaDescription(hub.descriptionLeads),
    intro: hubIntro(hub, page, ctx),
    faqs: hubFaqs(hub, page, ctx),
    alternatives: hubAlternatives(hub, page),
    priceBlock: hubPriceBlock(hub, inStock, ctx.formatPrice),
  };
}
