// Google Merchant Center product feed (RSS 2.0 with the g: namespace) for
// free listings in Shopping, Search, Images and AI shopping answers.
// Plain JavaScript so node:test can exercise it directly;
// app/feeds/google-merchant.xml/route.ts wires it to the catalog, the display
// names and the description pipeline in lib/product-meta.
// Spec: https://support.google.com/merchants/answer/7052112
import { productAudience, productKind } from "./product-copy.mjs";
import { dedupeImages, truncateWords } from "./product-seo.mjs";
import { getAvailableVariants, getDisplayPrice } from "./storefront.mjs";

export const MERCHANT_CURRENCY = "ARS";
export const MAX_TITLE_LENGTH = 150;
export const MAX_DESCRIPTION_LENGTH = 5000;
export const MAX_ADDITIONAL_IMAGES = 10;
const MAX_PRODUCT_TYPE_LENGTH = 750;
const MAX_COLOR_LENGTH = 100;
const MAX_COLOR_PART_LENGTH = 40;

// Google product taxonomy IDs (taxonomy version 2021-09-21):
// https://www.google.com/basepages/producttype/taxonomy-with-ids.en-US.txt
export const GOOGLE_PRODUCT_CATEGORIES = {
  // Apparel & Accessories > Clothing Accessories > Sunglasses
  sunglasses: 178,
  // Apparel & Accessories > Jewelry > Watches
  watch: 201,
};

/**
 * The variant the product page selects on load: the first in-stock, priced
 * one. The page has no URL parameter to preselect another, so the feed lists
 * one item per product with this variant's price, color and photo.
 */
export function defaultVariant(product) {
  return getAvailableVariants(product)[0] ?? null;
}

/**
 * "182700.00 ARS". The product page shows whole pesos (formatPrice has no
 * fraction digits), so the amount is rounded the same way.
 */
export function merchantPrice(amount) {
  return `${Math.round(amount).toFixed(2)} ${MERCHANT_CURRENCY}`;
}

// Sentences about the store rather than the product: its name, checkout and
// contact channel, payment terms, shipping, sales and links. Merchant Center
// asks for product information only in descriptions; the site copy (the
// catalog-facts fallback in particular) mentions all of these.
const STORE_TEXT = [
  /\bsmile\b/i,
  /\btiendanube\b/i,
  /\bcheckout\b/i,
  /\bwhats\s?app\b/i,
  /\bcuotas?\b/i,
  /\btransferencias?\b/i,
  /\bdescuentos?\b/i,
  /\d+\s?%\s?off\b/i,
  /\benv[ií]os?\b/i,
  /\bgratis\b/i,
  /\bofertas?\b/i,
  /\bpromoci[oó]n(es)?\b/i,
  /\bliquidaci[oó]n\b/i,
  /https?:\/\/|www\./i,
  /\$\s?\d/,
];

// Characters XML 1.0 does not allow, even escaped.
const INVALID_XML_CHARS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F￾￿]/g;

function plainText(value) {
  return String(value ?? "")
    .replace(/<[^>]*>/g, " ")
    .replace(INVALID_XML_CHARS, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** Ends a line with a period unless it already ends a sentence or a label. */
function asSentence(line) {
  const text = plainText(line);
  return !text || /[.!?…:;]$/u.test(text) ? text : `${text}.`;
}

/**
 * Plain-text description from the product copy the page shows (prose plus
 * the spec lines), without HTML or sentences about the store, payment terms
 * or shipping, cut at a word boundary to Merchant Center's 5000 characters.
 */
export function feedDescription({ paragraphs = [], specs = [] }) {
  const text = [
    ...paragraphs.map(asSentence),
    ...specs.map((spec) => asSentence(`${spec.name}: ${spec.value}`)),
  ]
    .filter(Boolean)
    .join(" ");
  const sentences = text
    .split(/(?<=[.!?…])\s+/u)
    .filter((sentence) => !STORE_TEXT.some((pattern) => pattern.test(sentence)));
  return truncateWords(plainText(sentences.join(" ")), MAX_DESCRIPTION_LENGTH);
}

// Variant options that are sizes, not colors: "STANDARD (M)", "LARGE (L)".
const SIZE_OPTION = /^(?:x{0,3}[sml]|small|medium|standard|large|extra\s+large)(?:\s*\([^)]*\))?$/i;

function capitalize(value) {
  return value ? `${value[0].toUpperCase()}${value.slice(1)}` : value;
}

/**
 * Color of a variant as its option reads on the page ("Negro/Verde",
 * "Dorado/Marrón degradé"): frame and lens colors, at most three, without
 * notes in parentheses. Null when the variant has no color option.
 */
export function variantColor(variant) {
  const option = (variant?.options ?? [])
    .map((value) => String(value ?? "").trim())
    .find((value) => value && !SIZE_OPTION.test(value));
  if (!option) return null;

  const parts = option
    .replace(/\([^)]*\)/g, " ")
    .split("/")
    .map((part) => capitalize(part.replace(/\s+/g, " ").trim()))
    .filter((part) => part && part.length <= MAX_COLOR_PART_LENGTH && !/\d/.test(part));
  const color = [...new Set(parts)].slice(0, 3).join("/");
  return color && color.length <= MAX_COLOR_LENGTH ? color : null;
}

/** Color of the variant on offer, or the one color every variant shares. */
function productColor(product, variant) {
  if (variant) return variantColor(variant);
  const colors = new Set((product.variants ?? []).map(variantColor));
  return colors.size === 1 ? [...colors][0] : null;
}

// Color words the catalog's own variant options and names use, in Spanish
// (accents optional, as the data writes them). English words and shades of a
// product line ("Super Blue Moonphase", "Lava") are deliberately absent: a
// name only gives a color when every word of its color run is listed here.
const COLOR_WORDS = new Set([
  "negro", "blanco", "gris", "plateado", "dorado", "azul", "celeste", "verde", "rojo", "rosa",
  "amarillo", "naranja", "violeta", "marron", "beige", "bordo", "turquesa", "bronce", "cobre",
  "carey", "transparente", "gunmetal",
]);
// Words that qualify the color before them ("Marron liso", "Gris degradé").
const COLOR_MODIFIERS = new Set(["degrade", "liso", "espejado", "mate", "oscuro", "claro"]);

const plainWord = (word) =>
  word
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();

/**
 * Colors written at the end of a product name, or after its " | " ("Round
 * Folding | Gunmetal/Gris Degradé", "Hexagonal Classic 3548 Dorado/Verde",
 * "Aviador Classic Dorado Verde"), in the name's own spelling and joined with
 * "/". Only the trailing run of color words counts, and every word of it must
 * be a known color or modifier; a name with no such run gives null, never a
 * guess.
 */
export function nameColor(name) {
  const text = String(name ?? "").replace(/\([^)]*\)/g, " ");
  const segment = text.includes("|") ? text.split("|").at(-1) : text;
  // Words in order; a "/" before a word means it opens a new color.
  const words = [];
  let afterSlash = false;
  for (const piece of segment.split(/(\/)|\s+/)) {
    if (piece === "/") afterSlash = true;
    else if (piece) {
      words.push({ text: piece, opensColor: afterSlash });
      afterSlash = false;
    }
  }

  // Trailing run of color words and modifiers.
  let start = words.length;
  while (start > 0) {
    const word = plainWord(words[start - 1].text);
    if (!COLOR_WORDS.has(word) && !COLOR_MODIFIERS.has(word)) break;
    start -= 1;
  }
  const run = words.slice(start);
  if (!run.some((word) => COLOR_WORDS.has(plainWord(word.text)))) return null;
  // A modifier cannot open the run: it qualifies a color that is not there.
  if (COLOR_MODIFIERS.has(plainWord(run[0].text))) return null;

  const parts = [];
  for (const word of run) {
    if (!COLOR_MODIFIERS.has(plainWord(word.text))) parts.push([word.text]);
    // "Gris/Mate": a modifier after a slash qualifies nothing.
    else if (word.opensColor) return null;
    else parts[parts.length - 1].push(word.text.toLowerCase());
  }
  const color = [...new Set(parts.map((part) => capitalize(part.join(" "))))].slice(0, 3).join("/");
  return color && color.length <= MAX_COLOR_LENGTH ? color : null;
}

/**
 * Dial color a watch's spec table states ("Color de la esfera: Turquesa
 * (Turquoise Dial)" -> "Turquesa"). Other color lines (the bezel's) describe
 * a part, not the product, and are left out.
 */
export function specColor(specs = []) {
  const stated = specs.find((spec) => normalizeWords(spec.name) === "color de la esfera");
  if (!stated) return null;
  return variantColor({ options: [stated.value] });
}

/**
 * The item's color, most explicit source first: the variant on offer, the
 * dial color on a watch's spec table, then color words at the end of the
 * product name. Null when none says, rather than a guess.
 */
export function merchantColor(product, variant, specs = []) {
  return productColor(product, variant) ?? specColor(specs) ?? nameColor(product.name);
}

function normalizeWords(value) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();
}

function genderFromText(value) {
  const text = normalizeWords(value);
  if (/\bunisex\b/.test(text)) return "unisex";
  const women = /\b(mujer(es)?|damas?|femenino)\b/.test(text);
  const men = /\b(hombres?|caballeros?|masculino)\b/.test(text);
  if (women && men) return "unisex";
  if (women) return "female";
  if (men) return "male";
  return null;
}

const GENDER_BY_AUDIENCE = { unisex: "unisex", women: "female", men: "male" };

/**
 * Who the product is for: the "Género" line of its spec table, else the
 * gender tags and store categories the site copy reads. Null when neither
 * says, rather than a guess.
 */
export function merchantGender(product, specs = []) {
  const stated = specs.find((spec) => normalizeWords(spec.name) === "genero");
  return (
    (stated ? genderFromText(stated.value) : null) ??
    GENDER_BY_AUDIENCE[productAudience(product)] ??
    null
  );
}

function absoluteImage(url, siteUrl) {
  const value = String(url ?? "").trim();
  if (!value) return null;
  const absolute = value.startsWith("/") ? `${siteUrl}${value}` : value;
  return absolute.startsWith("https://") ? absolute : null;
}

/**
 * One feed item per product, or the reason it is left out. `facts` carries
 * what the site derives elsewhere: the display name, canonical brand, model
 * code, canonical URL, stock status and description copy.
 */
export function toMerchantItem(product, facts, siteUrl) {
  const excluded = (reason) => ({ excluded: { id: String(product.id), slug: product.slug, reason } });
  const variant = defaultVariant(product);

  // The page gallery: the selected variant's photo first, then the product's.
  const images = dedupeImages([variant?.image, ...(product.images ?? [])])
    .map((url) => absoluteImage(url, siteUrl))
    .filter(Boolean);
  if (images.length === 0) return excluded("no image");

  const amount = getDisplayPrice(product, variant);
  if (typeof amount !== "number" || !Number.isFinite(amount) || Math.round(amount) <= 0) {
    return excluded("no price");
  }

  const description = feedDescription(facts.copy);
  if (!description) return excluded("no description");

  const kind = productKind(product);
  const productType = (product.categories ?? [])
    .map((category) => String(category).trim())
    .filter(Boolean)
    .join(" > ");

  return {
    item: {
      id: String(product.id),
      title: truncateWords(plainText(facts.title), MAX_TITLE_LENGTH),
      description,
      link: facts.link,
      imageLink: images[0],
      additionalImageLinks: images.slice(1, 1 + MAX_ADDITIONAL_IMAGES),
      // Same rule as the page's "Sin stock" badge.
      availability: facts.purchasable && variant ? "in_stock" : "out_of_stock",
      // Only the price the page shows. The page does not show the regular
      // price next to a promotional one, and sale_price requires both on the
      // landing page, so promotions go out as the price itself.
      price: merchantPrice(amount),
      condition: "new",
      brand: plainText(facts.brand) || null,
      mpn: facts.mpn || null,
      // No GTINs in the catalog: without an MPN the item has no identifiers.
      identifierExists: facts.mpn ? null : "no",
      googleProductCategory: kind ? GOOGLE_PRODUCT_CATEGORIES[kind] : null,
      productType: productType ? truncateWords(productType, MAX_PRODUCT_TYPE_LENGTH) : null,
      gender: merchantGender(product, facts.copy.specs),
      ageGroup: "adult",
      color: merchantColor(product, variant, facts.copy.specs),
    },
  };
}

function escapeXml(value) {
  return String(value)
    .replace(INVALID_XML_CHARS, "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

// Item fields in output order, with their feed attribute names.
const ITEM_FIELDS = [
  ["id", "g:id"],
  ["title", "g:title"],
  ["description", "g:description"],
  ["link", "g:link"],
  ["imageLink", "g:image_link"],
  ["additionalImageLinks", "g:additional_image_link"],
  ["availability", "g:availability"],
  ["price", "g:price"],
  ["condition", "g:condition"],
  ["brand", "g:brand"],
  ["mpn", "g:mpn"],
  ["identifierExists", "g:identifier_exists"],
  ["googleProductCategory", "g:google_product_category"],
  ["productType", "g:product_type"],
  ["gender", "g:gender"],
  ["ageGroup", "g:age_group"],
  ["color", "g:color"],
];

function element(name, value, indent) {
  return `${indent}<${name}>${escapeXml(value)}</${name}>`;
}

function renderItem(item) {
  const lines = ITEM_FIELDS.flatMap(([key, name]) => {
    const value = item[key];
    if (Array.isArray(value)) return value.map((entry) => element(name, entry, "      "));
    return value === null || value === undefined || value === "" ? [] : [element(name, value, "      ")];
  });
  return ["    <item>", ...lines, "    </item>"].join("\n");
}

/** The RSS 2.0 document Merchant Center fetches. */
export function renderMerchantFeed(channel, items) {
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">',
    "  <channel>",
    element("title", channel.title, "    "),
    element("link", channel.link, "    "),
    element("description", channel.description, "    "),
    ...items.map(renderItem),
    "  </channel>",
    "</rss>",
    "",
  ].join("\n");
}

/** Items, the products left out (with the reason) and the feed document. */
export function buildMerchantFeed({ channel, siteUrl, entries }) {
  const items = [];
  const excluded = [];
  for (const { product, facts } of entries) {
    const result = toMerchantItem(product, facts, siteUrl);
    if (result.item) items.push(result.item);
    else excluded.push(result.excluded);
  }
  return { xml: renderMerchantFeed(channel, items), items, excluded };
}
