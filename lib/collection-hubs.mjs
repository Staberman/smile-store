// Collection hubs built from catalog data: the Ray-Ban model hubs
// (/tienda/marcas/ray-ban/<modelo>). Product matching, the index/noindex
// rule and the visible copy (intro, FAQ, meta description) are plain
// JavaScript so node:test can check them against the real catalog;
// lib/hub-pages.ts wires them to the catalog, the brand directory and the
// price formatter.
import { descriptionLines, productAudience, splitDescription } from "./product-copy.mjs";
import { fitDescription, listPhrase } from "./product-seo.mjs";
import {
  CHECKOUT_PHRASE,
  INSTALLMENTS_PHRASE,
  STORE_LOCATION,
  STORE_PICKUP_PHRASE,
  TRANSFER_DISCOUNT_PHRASE,
} from "./store-copy.mjs";

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
      "Anteojos de sol Ray-Ban Aviador originales en Argentina, el modelo creado para pilotos en 1937.",
      "Anteojos de sol Ray-Ban Aviador originales en Argentina.",
    ],
  },
  {
    slug: "wayfarer",
    name: "Wayfarer",
    words: ["wayfarer"],
    // https://en.wikipedia.org/wiki/Ray-Ban_Wayfarer
    fact: "El Wayfarer fue diseñado en 1952 por Raymond Stegeman, diseñador óptico de Bausch & Lomb, la empresa dueña de Ray-Ban en ese momento.",
    leads: [
      "Anteojos de sol Ray-Ban Wayfarer originales en Argentina, el diseño de 1952 de Raymond Stegeman.",
      "Anteojos de sol Ray-Ban Wayfarer originales en Argentina.",
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
      "Anteojos de sol Ray-Ban Round originales en Argentina: Round Metal, Double Bridge, Blaze y más.",
      "Anteojos de sol Ray-Ban Round originales en Argentina.",
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
      "Anteojos Ray-Ban Hexagonal originales en Argentina: la evolución del Round, con lentes planos.",
      "Anteojos de sol Ray-Ban Hexagonal originales en Argentina.",
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
      "Anteojos de sol Ray-Ban Erika originales en Argentina, de forma redonda y oversize.",
      "Anteojos de sol Ray-Ban Erika originales en Argentina.",
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
    title: `Ray-Ban ${model.name}: precios y modelos en Argentina`,
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

/** Every hub this module builds. */
export const COLLECTION_HUBS = [...RAY_BAN_MODEL_HUBS];

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
 * Facts the hub copy states, computed from the given products: lens types
 * and materials and frame materials (description specs), in-stock colorways
 * and genders.
 */
export function hubFacts(products) {
  const genders = { unisex: 0, men: 0, women: 0, unknown: 0 };
  for (const product of products) genders[productGender(product) ?? "unknown"] += 1;
  const orderedLensTypes = new Set(products.flatMap(lensTypes));

  return {
    count: products.length,
    price: priceRange(products),
    lensTypes: LENS_TYPES.map(([, label]) => label).filter((label) => orderedLensTypes.has(label)),
    lensMaterials: rankLabels(products.map(lensMaterial)).map((entry) => entry.label),
    frameMaterials: rankLabels(products.map(frameMaterial)).map((entry) => entry.label),
    colorways: rankLabels(products.flatMap(colorways)).map((entry) => entry.label),
    genders,
  };
}

// --- Copy --------------------------------------------------------------------

const PAYMENT_SENTENCE = `Podés pagar en ${INSTALLMENTS_PHRASE} o con ${TRANSFER_DISCOUNT_PHRASE}, con ${CHECKOUT_PHRASE}.`;
const LOCATION_SENTENCE = `Smile es una tienda online de ${STORE_LOCATION.locality}, ${STORE_LOCATION.region}, con envíos a todo el país y ${STORE_PICKUP_PHRASE}.`;
const STOCK_SYNC_ANSWER =
  "El stock de Smile se sincroniza con Tiendanube cada hora. Los modelos agotados siguen publicados con la etiqueta «Sin stock» y podés consultarnos por WhatsApp por su reposición.";
// Shipping cost and free-shipping threshold are not confirmed: not stated.
const PICKUP_FAQ = {
  question: `¿Puedo retirar en ${STORE_LOCATION.locality}?`,
  answer: `Sí: hay ${STORE_PICKUP_PHRASE}, ${STORE_LOCATION.locality}. Si estás en otra ciudad, hacemos envíos a todo el país.`,
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
  return `En Smile hay ${count} de ${hub.subject} con stock${from}${tail}.`;
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

/** Visible intro under the H1: 60-120 words of catalog facts and store terms. */
export function hubIntro(hub, page, ctx) {
  return modelIntro(hub, page, ctx).filter(Boolean).join(" ");
}

/**
 * 3-4 buyer questions answered from catalog data and store facts only: the
 * hub's most useful questions that apply, in order, then the pickup one.
 */
export function hubFaqs(hub, page, ctx) {
  return [...modelFaqs(hub, page, ctx).slice(0, 3), PICKUP_FAQ];
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
 * In-stock products of the hub's parent section that the hub does not list,
 * closest in price to the hub's own products first. Empty while the hub has
 * enough products in stock.
 */
export function hubAlternatives(hub, page, limit = ALTERNATIVES_LIMIT) {
  const { inStock, catalog, parentInStock } = page;
  if (inStock.length >= MIN_IN_STOCK_PRODUCTS) return [];
  const listed = new Set(catalog.map((product) => product.id));
  const reference = priceRange(catalog)?.min ?? null;
  const distance = (product) => {
    const price = comparablePrice(product);
    return reference === null || price === null ? Number.POSITIVE_INFINITY : Math.abs(price - reference);
  };
  return parentInStock
    .filter((product) => !listed.has(product.id))
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
  return {
    catalogCount: page.catalog.length,
    indexable: isIndexableHub(page.catalog.length),
    description: hubMetaDescription(hub.descriptionLeads),
    intro: hubIntro(hub, page, ctx),
    faqs: hubFaqs(hub, page, ctx),
    alternatives: hubAlternatives(hub, page),
  };
}
