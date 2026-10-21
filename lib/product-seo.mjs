// Pure SEO text helpers for product and collection pages: display names,
// <title> text, meta descriptions, manufacturer model codes and image dedupe.
// Plain JavaScript with no imports so node:test can exercise it directly;
// lib/product-meta.ts wires it to the catalog and the brand directory.

/** Appended by the root layout's title template. Keep both in sync. */
export const TITLE_SUFFIX = " | Smile";
export const MAX_TITLE_LENGTH = 60;
/** Room left for the page's own title once the suffix is appended. */
export const MAX_PAGE_TITLE_LENGTH = MAX_TITLE_LENGTH - TITLE_SUFFIX.length;

export const META_DESCRIPTION_MIN_LENGTH = 140;
export const META_DESCRIPTION_MAX_LENGTH = 155;

// Store-wide default SEO copy that Tiendanube fills in when a product has no
// SEO fields of its own. It says nothing about the product.
const GENERIC_SEO_TEXTS = [
  "lentes sol importados originales",
  "grandes descuentos en toda la web + envios gratis!",
  "¡todo la tienda online con envio gratis en rosario!",
  "¡tienda online con promociones y envios gratis en rosario!",
  "¡toda la tienda online con promociones y envios gratis en rosario!",
  "¡toda la tienda online tiene promociones y envios gratis en rosario!",
];

function stripAccents(value) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

/** Lowercase alphanumerics only, "&" spelled "and": "Ray-Ban" -> "rayban". */
function squash(value) {
  return stripAccents(value)
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "");
}

function editDistance(a, b) {
  const previous = Array.from({ length: b.length + 1 }, (_, index) => index);
  for (let i = 1; i <= a.length; i += 1) {
    let diagonal = previous[0];
    previous[0] = i;
    for (let j = 1; j <= b.length; j += 1) {
      const above = previous[j];
      previous[j] = Math.min(
        previous[j] + 1,
        previous[j - 1] + 1,
        diagonal + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
      diagonal = above;
    }
  }
  return previous[b.length];
}

/**
 * True for SEO copy that does not describe the product: Tiendanube's
 * store-wide defaults, the bare product name, or anything too short to say
 * more than the name does.
 */
export function isGenericSeoText(value, productName = "") {
  const text = String(value ?? "").replace(/\s+/g, " ").trim();
  if (text.length < 20) return true;
  const normalized = stripAccents(text).toLowerCase();
  if (GENERIC_SEO_TEXTS.some((generic) => stripAccents(generic) === normalized)) return true;
  if (/env[ií]os? gratis en rosario/i.test(stripAccents(text))) return true;
  return squash(text) === squash(productName);
}

/** Spain-Spanish eyewear terms to the Argentine ones used across the site. */
export function normalizeEyewearTerms(value) {
  return String(value ?? "")
    .replace(/\bgafas de sol\b/gi, (match) => (match[0] === "G" ? "Anteojos de sol" : "anteojos de sol"))
    .replace(/\bgafas\b/gi, (match) => (match[0] === "G" ? "Anteojos" : "anteojos"));
}

const LEADING_TYPE_WORDS = new Set(["reloj"]);

function isAllCaps(value) {
  const letters = String(value).replace(/[^A-Za-zÀ-ÿ]/g, "");
  return letters.length >= 4 && letters === letters.toUpperCase();
}

function hasDigit(token) {
  return /\d/.test(token);
}

function titleCaseWord(word) {
  if (hasDigit(word)) return word.toUpperCase();
  return word
    .toLowerCase()
    .replace(/(^|[/(-])(\p{L})/gu, (_, separator, letter) => `${separator}${letter.toUpperCase()}`);
}

/**
 * Number of tokens, starting at `start`, that spell the brand (any alias, any
 * casing or spacing). Tolerates a one-letter typo in long brand names, e.g.
 * "Catier" for "Cartier". Returns 0 when the brand is not there.
 */
function brandTokenSpan(tokens, start, brandKeys) {
  for (let count = Math.min(4, tokens.length - start); count >= 1; count -= 1) {
    const key = squash(tokens.slice(start, start + count).join(""));
    if (!key) continue;
    if (brandKeys.has(key)) return count;
    for (const brandKey of brandKeys) {
      if (
        brandKey.length >= 6 &&
        key[0] === brandKey[0] &&
        Math.abs(brandKey.length - key.length) <= 1 &&
        editDistance(key, brandKey) <= 1
      ) {
        return count;
      }
    }
  }
  return 0;
}

/**
 * Product name as shown in the H1 and in Product JSON-LD: always carries the
 * canonical brand ("4375 Polarizado" -> "Ray-Ban 4375 Polarizado",
 * "RAY BAN WAYFARER FOLDING 4105" -> "Ray-Ban Wayfarer Folding 4105").
 * `brand.label` is the canonical display name, `brand.aliases` its spellings.
 */
export function productDisplayName(name, brand) {
  const cleaned = normalizeEyewearTerms(String(name ?? "").replace(/\s+/g, " ").trim());
  const label = String(brand?.label ?? "").trim();
  if (!label) return cleaned;

  const brandKeys = new Set([label, ...(brand.aliases ?? [])].map(squash).filter(Boolean));
  const tokens = cleaned.split(" ").filter(Boolean);
  const start = tokens.length > 1 && LEADING_TYPE_WORDS.has(squash(tokens[0])) ? 1 : 0;
  const span = brandTokenSpan(tokens, start, brandKeys);

  // The brand appears somewhere else in the name: leave the name alone.
  if (span === 0 && [...brandKeys].some((key) => squash(cleaned).includes(key))) {
    return cleaned;
  }

  const allCaps = isAllCaps(cleaned);
  const rest = tokens.slice(start + span).map((token) => {
    if (allCaps) return titleCaseWord(token);
    // Model references read in capitals: "Th1782698" -> "TH1782698".
    return /[a-z]/i.test(token) && hasDigit(token) && /^[a-z0-9]+$/i.test(token)
      ? token.toUpperCase()
      : token;
  });
  const lead = tokens.slice(0, start).map((token) => titleCaseWord(token));

  return [...lead, label, ...rest].join(" ");
}

/** Cuts at a word boundary and drops dangling separators or connectors. */
export function truncateWords(value, maxLength) {
  const text = String(value ?? "").replace(/\s+/g, " ").trim();
  if (text.length <= maxLength) return text;
  let cut = text.slice(0, maxLength + 1).replace(/\s+\S*$/, "");
  cut = cut.replace(/(\s+(de|del|con|y|e|para|en|la|el|-|\||·))+$/i, "").replace(/[\s,;:|·-]+$/, "");
  return cut;
}

/** Display name without " | " / " - " separators, for titles and sentences. */
export function plainName(displayName) {
  return normalizeEyewearTerms(displayName)
    .replace(/\s+[|–—-]\s+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Page <title> (before the " | Smile" suffix) for a product:
 * "Anteojos de sol Ray-Ban Aviador Classic 3025" or "Reloj Invicta Pro Diver
 * 49277". The product type is dropped, then words are trimmed, when the title
 * would not fit in 60 characters including the suffix.
 */
export function productPageTitle(displayName, kind) {
  const plain = plainName(displayName);
  const withoutType = plain.replace(/^reloj\s+/i, "");
  const typed =
    kind === "watch"
      ? `Reloj ${withoutType}`
      : kind === "sunglasses"
        ? `Anteojos de sol ${withoutType}`
        : withoutType;

  for (const candidate of [typed, withoutType]) {
    if (candidate.length <= MAX_PAGE_TITLE_LENGTH) return candidate;
  }
  return truncateWords(withoutType, MAX_PAGE_TITLE_LENGTH);
}

/** "a", "a y b", "a, b y c". */
export function listPhrase(items) {
  const values = items.filter(Boolean);
  if (values.length <= 1) return values[0] ?? "";
  return `${values.slice(0, -1).join(", ")} y ${values[values.length - 1]}`;
}

function* orderedSubsets(items) {
  const total = 1 << items.length;
  // Larger subsets first, earlier items preferred: the first candidate that
  // fits is the most informative one.
  const masks = Array.from({ length: total }, (_, mask) => mask).sort((a, b) => {
    const bitsA = a.toString(2).replace(/0/g, "").length;
    const bitsB = b.toString(2).replace(/0/g, "").length;
    if (bitsA !== bitsB) return bitsB - bitsA;
    for (let index = 0; index < items.length; index += 1) {
      const bit = 1 << index;
      if ((a & bit) !== (b & bit)) return (a & bit) ? -1 : 1;
    }
    return 0;
  });
  for (const mask of masks) {
    yield items.filter((_, index) => mask & (1 << index));
  }
}

/**
 * Picks the most informative description that lands within the target length.
 * `leads` and `offers` are alternatives from most to least detailed; `extras`
 * are optional sentences appended in order. Falls back to the longest
 * candidate under the maximum, then to a word-boundary cut.
 */
export function fitDescription(
  { leads, offers = [""], extras = [] },
  min = META_DESCRIPTION_MIN_LENGTH,
  max = META_DESCRIPTION_MAX_LENGTH,
) {
  const candidates = [];
  for (const lead of leads) {
    for (const offer of offers) {
      for (const subset of orderedSubsets(extras)) {
        candidates.push([lead, offer, ...subset].filter(Boolean).join(" ").replace(/\s+/g, " ").trim());
      }
    }
  }

  const fitting = candidates.find((text) => text.length >= min && text.length <= max);
  if (fitting) return fitting;

  const underMax = candidates
    .filter((text) => text.length <= max)
    .sort((a, b) => b.length - a.length)[0];
  if (underMax) return underMax;

  return `${truncateWords(candidates[candidates.length - 1] ?? "", max - 1).replace(/[.,;:]$/, "")}.`;
}

/**
 * Manufacturer model code for Product.mpn, only when it can be read reliably
 * from the product name in the brand's official format. Returns null when the
 * name has none, has several, or the variant SKUs point to a different model.
 */
export function extractModelCode({ brand, name, skus = [] }) {
  const text = String(name ?? "");
  const skuList = skus.map((sku) => String(sku ?? "").trim()).filter(Boolean);

  const single = (matches) => {
    const unique = [...new Set(matches.map((match) => match.toUpperCase()))];
    return unique.length === 1 ? unique[0] : null;
  };

  const officialPattern = (pattern, prefix = "") => {
    const code = single([...text.matchAll(new RegExp(`\\b${pattern}\\b`, "gi"))].map((m) => m[0]));
    if (!code) return null;
    const skuCodes = skuList.flatMap((sku) =>
      [...sku.matchAll(new RegExp(`\\b${pattern}\\b`, "gi"))].map((m) => m[0].toUpperCase()),
    );
    if (skuCodes.some((skuCode) => skuCode !== code)) return null;
    return `${prefix}${code}`;
  };

  switch (brand) {
    case "Ray-Ban": {
      const explicit = text.match(/\bRB\s?(\d{4}[A-Z]{0,2})\b/i)?.[1];
      const code =
        explicit?.toUpperCase() ??
        single([...text.matchAll(/\b\d{4}[A-Z]{0,2}\b/gi)].map((m) => m[0]));
      if (!code) return null;
      const digits = code.slice(0, 4);
      const skuDigits = skuList.map((sku) => sku.match(/\d{4}/)?.[0]).filter(Boolean);
      if (skuDigits.some((skuCode) => skuCode !== digits)) return null;
      return `RB${code}`;
    }
    case "Invicta":
      return single([...text.matchAll(/\b\d{5}\b/g)].map((m) => m[0]));
    case "Tommy Hilfiger":
      return single([...text.matchAll(/\d{7}/g)].map((m) => m[0]));
    case "Gucci":
      return officialPattern("GG\\d{4}S");
    case "Versace":
      return officialPattern("VE\\d{4}[A-Z]?");
    case "Celine":
      return officialPattern("CL\\d{5}[A-Z]");
    case "Prada":
      return officialPattern("S?PR\\d{2}[A-Z]{1,2}");
    default:
      return null;
  }
}

/**
 * Drops repeated renditions of the same Tiendanube image ("…-1024-1024.webp"
 * and "…-640-0.webp" are one photo), keeping the first position and the
 * widest rendition.
 */
export function dedupeImages(urls) {
  const byBase = new Map();
  for (const url of urls ?? []) {
    if (!url) continue;
    const match = String(url).match(/^(.*)-(\d+)-(\d+)(\.[a-z0-9]+)$/i);
    const base = match ? `${match[1]}${match[4]}` : url;
    const width = match ? Number(match[2]) : Number.POSITIVE_INFINITY;
    const existing = byBase.get(base);
    if (!existing || width > existing.width) byBase.set(base, { url, width });
  }
  return [...byBase.values()].map((entry) => entry.url);
}
