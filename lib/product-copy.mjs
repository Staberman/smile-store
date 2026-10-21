// Pure helpers for product description copy: Tiendanube's description HTML
// split into lines, the "Clave: valor" spec lines pulled out of it for the
// product page's spec table and Product.additionalProperty, and the fallback
// copy for products without a description. Plain JavaScript so node:test can
// exercise it directly; lib/product-meta.ts wires it to the catalog and
// scripts/tiendanube reuses the entity decoder and the fallback.
import { extractModelCode, listPhrase, normalizeEyewearTerms, plainName } from "./product-seo.mjs";
import { isWatch } from "./storefront.mjs";

const NAMED_ENTITIES = {
  nbsp: " ",
  amp: "&",
  quot: '"',
  apos: "'",
  lt: "<",
  gt: ">",
  aacute: "á",
  eacute: "é",
  iacute: "í",
  oacute: "ó",
  uacute: "ú",
  Aacute: "Á",
  Eacute: "É",
  Iacute: "Í",
  Oacute: "Ó",
  Uacute: "Ú",
  ntilde: "ñ",
  Ntilde: "Ñ",
  uuml: "ü",
  Uuml: "Ü",
  Egrave: "È",
  deg: "°",
  bull: "•",
  middot: "·",
  ldquo: "“",
  rdquo: "”",
  lsquo: "‘",
  rsquo: "’",
  ndash: "–",
  mdash: "—",
  hellip: "…",
  reg: "®",
  copy: "©",
  trade: "™",
};

export function decodeHtmlEntities(value) {
  return String(value ?? "").replace(/&(#x?[0-9a-fA-F]+|[a-zA-Z][a-zA-Z0-9]+);/g, (entity, token) => {
    if (token.startsWith("#x") || token.startsWith("#X")) {
      const codePoint = Number.parseInt(token.slice(2), 16);
      return Number.isFinite(codePoint) ? String.fromCodePoint(codePoint) : entity;
    }

    if (token.startsWith("#")) {
      const codePoint = Number.parseInt(token.slice(1), 10);
      return Number.isFinite(codePoint) ? String.fromCodePoint(codePoint) : entity;
    }

    return NAMED_ENTITIES[token] ?? entity;
  });
}

const LINE_BREAK = /<br\b[^>]*>|<\/?(?:p|div|li|ul|ol|h[1-6]|tr|table|blockquote)\b[^>]*>/gi;
const LEADING_BULLET = /^[•·▪◦*–-]\s*/u;

/**
 * Description HTML as plain-text lines: one per paragraph, list item or line
 * break, without list bullets. Empty for HTML with no text.
 */
export function descriptionLines(html) {
  const text = String(html ?? "")
    .replace(/\s+/g, " ")
    .replace(LINE_BREAK, "\n")
    .replace(/<[^>]+>/g, "");
  return decodeHtmlEntities(text)
    .split("\n")
    .map((line) => line.replace(/\s+/g, " ").trim().replace(LEADING_BULLET, "").trim())
    .filter(Boolean);
}

/** Lowercase alphanumerics only: "Material de la Caja/Banda" -> "materialdelacajabanda". */
function labelKey(value) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");
}

// Labels of the "Clave: valor" lines read as specs, as the spec table shows
// them. Other lines with a colon ("Lentes de cristal mineral: Alta calidad
// óptica…") are marketing copy and stay in the prose.
const SPEC_LABELS = [
  // Sunglasses
  "Género",
  "Formato",
  "Formato de cara recomendado",
  "Talle",
  "Talles disponibles",
  "Lentes disponibles",
  "Protección",
  "Material del lente",
  "Material del marco",
  "Peso",
  "Medidas",
  // Watches
  "Movimiento",
  "Material de la caja",
  "Material de la caja/banda",
  "Material de la malla",
  "Color de la esfera",
  "Diámetro de la caja",
  "Cristal",
  "Resistencia al agua",
  "Funciones",
  "Bisel",
  "Color del bisel",
];

const SPEC_LABEL_BY_KEY = new Map([
  ...SPEC_LABELS.map((label) => [labelKey(label), label]),
  [labelKey("Formato de cara recomendada"), "Formato de cara recomendado"],
]);

function specValue(value) {
  return normalizeEyewearTerms(value)
    .replace(/\s+([,;.])/g, "$1")
    .replace(/[\s,;.]+$/u, "")
    .trim();
}

/**
 * Splits description lines into prose paragraphs and specs. Spec lines leave
 * the prose so nothing is shown twice, and so do labels left with nothing
 * under them: "Características:" right before the specs, or a trailing
 * "Packaging:" whose photo is not part of the text. Everything else is kept
 * as written, with eyewear terms normalized.
 */
export function splitDescription(lines) {
  const parsed = lines.map((line) => {
    const match = String(line).match(/^([^:]{1,40}):\s*(.*)$/u);
    const label = match ? SPEC_LABEL_BY_KEY.get(labelKey(match[1])) : undefined;
    const value = match ? specValue(match[2]) : "";
    if (label && value) return { spec: { name: label, value } };
    return { text: normalizeEyewearTerms(line), isLabel: Boolean(match) && !match[2].trim() };
  });

  const paragraphs = [];
  const specs = [];
  parsed.forEach((entry, index) => {
    if (entry.spec) {
      const repeated = specs.some(
        (spec) => spec.name === entry.spec.name && spec.value === entry.spec.value,
      );
      if (!repeated) specs.push(entry.spec);
      return;
    }
    const next = parsed[index + 1];
    if (entry.isLabel && (!next || next.spec)) return;
    paragraphs.push(entry.text);
  });

  return { paragraphs, specs };
}

/** Product type read from the catalog categories. */
export function productKind(product) {
  if (isWatch(product)) return "watch";
  const topCategory = String(product.categories?.[0] ?? "").toLowerCase();
  return topCategory.includes("lentes") || topCategory.includes("anteojos") ? "sunglasses" : null;
}

/** Who the product is for, from its gender tags and the store categories. */
export function productAudience(product) {
  const tags = new Set((product.tags ?? []).map((tag) => String(tag).toLowerCase().trim()));
  const categories = (product.categories ?? []).join(" ").toLowerCase();
  const women = tags.has("mujer") || categories.includes("dama");
  const men = tags.has("hombre") || categories.includes("caballero");
  if (tags.has("unisex") || (women && men)) return "unisex";
  if (women) return "women";
  if (men) return "men";
  return null;
}

/** " para dama", " unisex"…, to follow the product type in a sentence. */
export function audiencePhrase(audience, kind) {
  if (audience === "unisex") return " unisex";
  // Watches follow the store's own categories ("dama" / "caballero").
  if (audience === "women") return kind === "watch" ? " para dama" : " para mujer";
  if (audience === "men") return kind === "watch" ? " para caballero" : " para hombre";
  return "";
}

// At most one well-known, verifiable fact per brand, for the fallback copy.
const BRAND_FACTS = {
  "Tommy Hilfiger": "una marca estadounidense fundada en 1985",
  "Ray-Ban": "una marca nacida en Estados Unidos en 1937",
};

/**
 * Description for a product that has none in Tiendanube, built only from
 * catalog facts: display name, brand (plus one well-known fact about it),
 * model code, store section, gender and variants, and the store's payment
 * terms when given. It never states specs (materials, movement, water
 * resistance, sizes), warranty or shipping terms: it points to WhatsApp for
 * those instead. `collection` is the store trail below the home page, e.g.
 * ["Relojes", "Tommy Hilfiger"].
 */
export function fallbackDescription(product, { brand, name, collection = [], payment = null }) {
  const kind = productKind(product);
  const audience = audiencePhrase(productAudience(product), kind);
  const model = plainName(name).replace(/^reloj\s+/i, "");
  const variantList = product.variants ?? [];
  const code = extractModelCode({ brand, name: product.name, skus: variantList.map((variant) => variant.sku) });
  const variants = [
    ...new Set(variantList.map((variant) => (variant.options ?? []).filter(Boolean).join(" / ")).filter(Boolean)),
  ];
  const plural = kind === "sunglasses";
  const pronoun = plural ? "los" : "lo";
  const section = collection[collection.length - 1];
  const parent = collection[collection.length - 2];

  return [
    kind === "watch"
      ? `El ${model} es un reloj${audience}.`
      : kind === "sunglasses"
        ? `Los ${model} son anteojos de sol${audience}.`
        : `${model} es un producto de ${brand}.`,
    BRAND_FACTS[brand] ? `${brand} es ${BRAND_FACTS[brand]}.` : "",
    code ? `Su número de modelo es ${code}.` : "",
    section
      ? `En Smile ${pronoun} encontrás en la sección ${section}${parent ? `, dentro de ${parent}` : ""}.`
      : "",
    variants.length > 0
      ? `Se ${plural ? "publican" : "publica"} en ${variants.length === 1 ? "la variante" : "las variantes"} ${listPhrase(variants)}.`
      : "",
    payment
      ? `Podés pagar${pronoun} en ${payment.installments} o con ${payment.transferDiscount}, a través del ${payment.checkout}.`
      : "",
    "Si querés confirmar medidas, materiales u otros detalles antes de comprar, consultanos por WhatsApp.",
  ]
    .filter(Boolean)
    .join(" ");
}
