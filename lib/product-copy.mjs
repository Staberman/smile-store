// Pure helpers for product description copy: Tiendanube's description HTML
// split into lines, and the "Clave: valor" spec lines pulled out of it for the
// product page's spec table and Product.additionalProperty. Plain JavaScript
// so node:test can exercise it directly; lib/product-meta.ts wires it to the
// catalog and scripts/tiendanube reuses the entity decoder.
import { normalizeEyewearTerms } from "./product-seo.mjs";

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
