import fs from "node:fs/promises";
import path from "node:path";
import { TextDecoder } from "node:util";
import {
  extractAssignedJson,
  htmlToText,
  normalizeImageUrl,
  parseCategoryField,
  parseTiendanubePrice,
  stripBase64Images,
} from "./catalog-utils.mjs";

const CSV_PATH =
  process.argv[2] ??
  "/Users/lautaroantunez/Downloads/tiendanube-3759046-17823966794630592303951883044.csv";
const STORE_ORIGIN = "https://www.smiletiendaimp.com.ar";
const OUT_DIR = path.resolve("data");
const CSV_DECODER = new TextDecoder("windows-1252");

function parseCsvLine(line) {
  const cells = [];
  let current = "";
  let quoted = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const next = line[index + 1];

    if (char === '"' && quoted && next === '"') {
      current += '"';
      index += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === ";" && !quoted) {
      cells.push(current);
      current = "";
    } else {
      current += char;
    }
  }

  cells.push(current);
  return cells;
}

function parseCsv(text) {
  const rows = [];
  let row = "";
  let quoted = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];

    if (char === '"' && quoted && next === '"') {
      row += char + next;
      index += 1;
    } else if (char === '"') {
      quoted = !quoted;
      row += char;
    } else if ((char === "\n" || char === "\r") && !quoted) {
      if (row.trim()) rows.push(parseCsvLine(row.replace(/\r$/, "")));
      row = "";
      if (char === "\r" && next === "\n") index += 1;
    } else {
      row += char;
    }
  }

  if (row.trim()) rows.push(parseCsvLine(row));

  const [headers = [], ...records] = rows;
  return records.map((cells) =>
    Object.fromEntries(headers.map((header, index) => [header, cells[index] ?? ""])),
  );
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function numberOrNull(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function positiveNumberOrNull(value) {
  const parsed = numberOrNull(value);
  return parsed !== null && parsed > 0 ? parsed : null;
}

function nonEmptyString(value) {
  const normalized = String(value ?? "").trim();
  return normalized ? normalized : null;
}

function normalizeTokenText(value) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toUpperCase()
    .replace(/[^A-Z0-9&]+/g, " ")
    .trim();
}

const DIRECT_BRAND_TOKEN_RULES = [
  { brand: "Tommy Hilfiger", tokens: ["TOMMY HILFIGER"] },
  { brand: "Invicta", tokens: ["INVICTA"] },
  { brand: "OMEGA x Swatch", tokens: ["OMEGA X SWATCH"] },
  { brand: "Ray Ban", tokens: ["RAY BAN", "RAYBAN"] },
  { brand: "Prada", tokens: ["PRADA"] },
  { brand: "Gucci", tokens: ["GUCCI"] },
  { brand: "Saint Laurent", tokens: ["SAINT LAURENT"] },
  { brand: "Louis Vuitton", tokens: ["LOUIS VUITTON"] },
  { brand: "Versace", tokens: ["VERSACE"] },
  { brand: "Christian Dior", tokens: ["CHRISTIAN DIOR", " DIOR "] },
  { brand: "Balenciaga", tokens: ["BALENCIAGA"] },
  { brand: "Cartier", tokens: ["CARTIER"] },
  { brand: "Fendi", tokens: ["FENDI"] },
  { brand: "Dolce&Gabbana", tokens: ["DOLCE&GABBANA", "DOLCE GABBANA", "DOLCEGABBANA"] },
  { brand: "Celine Paris", tokens: ["CELINE PARIS", " CELINE "] },
  { brand: "Off-White", tokens: ["OFF-WHITE", "OFF WHITE"] },
];

const RAY_BAN_MODEL_TOKENS = [
  "4375 POLARIZADO",
  "AMORE FASHION",
  "AVIADOR",
  "BIO BASED",
  "BLAZE SHOOTER",
  "CLUB ROUND",
  "ERIKA",
  "HEXAGONAL",
  "HIGHSTREET",
  "JUSTIN",
  "MEGA WAYFARER",
  "SQUARE II",
  "STATE STREET",
  "WAYFARER",
];

const RAY_BAN_STRONG_TOKENS = ["4375 POLARIZADO", "BIO BASED", "SQUARE II"];

function decodeJsString(value) {
  if (!value) return "";

  try {
    return JSON.parse(`"${value.replace(/"/g, '\\"')}"`);
  } catch {
    return value;
  }
}

function extractAssignmentBlock(html, assignmentName) {
  const source = String(html ?? "");
  const assignmentIndex = source.indexOf(assignmentName);
  if (assignmentIndex === -1) return null;

  let index = assignmentIndex + assignmentName.length;
  while (index < source.length && /\s/.test(source[index])) index += 1;
  if (source[index] !== "=") return null;

  index += 1;
  while (index < source.length && /\s/.test(source[index])) index += 1;

  const open = source[index];
  const close = open === "[" ? "]" : open === "{" ? "}" : null;
  if (!close) return null;

  const stack = [open];
  let quoted = null;
  let escaped = false;

  for (let scan = index + 1; scan < source.length; scan += 1) {
    const char = source[scan];

    if (quoted) {
      if (escaped) {
        escaped = false;
      } else if (char === "\\") {
        escaped = true;
      } else if (char === quoted) {
        quoted = null;
      }
      continue;
    }

    if (char === '"' || char === "'") {
      quoted = char;
      continue;
    }

    if (char === "[" || char === "{") {
      stack.push(char);
      continue;
    }

    if (char === "]" || char === "}") {
      const last = stack[stack.length - 1];
      if ((last === "[" && char !== "]") || (last === "{" && char !== "}")) {
        return null;
      }

      stack.pop();
      if (stack.length === 0) return source.slice(index, scan + 1);
    }
  }

  return null;
}

function parseProductAssignment(html) {
  const payload = extractAssignmentBlock(html, "LS.product");
  if (!payload) return null;

  const id = numberOrNull(payload.match(/\bid\s*:\s*(\d+)/)?.[1]);
  const name = decodeJsString(payload.match(/\bname\s*:\s*'((?:\\.|[^'])*)'/)?.[1]);
  const brand = decodeJsString(payload.match(/\bbrand\s*:\s*'((?:\\.|[^'])*)'/)?.[1]);
  const tagsBlock = payload.match(/\btags\s*:\s*\[([\s\S]*?)\]/)?.[1] ?? "";
  const tags = [...tagsBlock.matchAll(/'((?:\\.|[^'])*)'/g)].map((match) =>
    decodeJsString(match[1]).trim(),
  );

  return {
    id,
    name,
    brand,
    tags: tags.filter(Boolean),
  };
}

function extractGalleryImages(html) {
  const urls = [
    ...html.matchAll(/data-zoom-url="([^"]+)"/g),
    ...html.matchAll(/property="og:image:secure_url"\s+content="([^"]+)"/g),
    ...html.matchAll(/property="og:image"\s+content="([^"]+)"/g),
  ]
    .map((match) => normalizeImageUrl(match[1]))
    .filter(Boolean);

  return unique(urls);
}

function normalizeDescriptionHtml(html) {
  let cleaned = stripBase64Images(String(html ?? ""));

  const dataImagePattern = /<img\b[\s\S]*?\bsrc=(["'])data:image\//i;
  while (true) {
    const match = cleaned.match(dataImagePattern);
    if (!match || match.index === undefined) break;

    const tagEnd = cleaned.indexOf(">", match.index);
    cleaned =
      tagEnd === -1
        ? cleaned.slice(0, match.index)
        : `${cleaned.slice(0, match.index)}${cleaned.slice(tagEnd + 1)}`;
  }

  return cleaned
    .replace(/(src|href)=(["'])\/\/([^"']+)\2/gi, '$1=$2https://$3$2')
    .replace(/(src|href)=(["'])http:\/\/([^"']+)\2/gi, '$1=$2https://$3$2')
    .trim();
}

async function fetchHtml(url) {
  const response = await fetch(url, {
    headers: {
      "user-agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Safari/537.36",
      accept: "text/html",
    },
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status} for ${url}`);
  }

  return response.text();
}

function variantOptions(variant) {
  return [variant.option0, variant.option1, variant.option2]
    .map((value) => String(value ?? "").trim())
    .filter(Boolean);
}

function inferBrandFromTokens({ row, pageData, category }) {
  const tokenSource = [
    row.Nombre,
    row["Categorías"],
    row.Tags,
    ...(category?.path ?? []),
    ...(category?.tags ?? []),
    pageData.product?.name,
    ...(Array.isArray(pageData.product?.tags) ? pageData.product.tags : []),
  ]
    .map((value) => normalizeTokenText(value))
    .filter(Boolean)
    .join(" | ");

  const tokenHaystack = ` ${tokenSource} `;

  for (const rule of DIRECT_BRAND_TOKEN_RULES) {
    if (rule.tokens.some((token) => tokenHaystack.includes(` ${normalizeTokenText(token)} `))) {
      return rule.brand;
    }
  }

  const categoryHaystack = [
    ...(category?.path ?? []),
    ...(category?.tags ?? []),
  ]
    .map((value) => normalizeTokenText(value))
    .filter(Boolean)
    .join(" | ");

  const isSunglassesProduct =
    categoryHaystack.includes("LENTES DE SOL") || tokenHaystack.includes(" LENTES DE SOL ");
  const matchesRayBanModel = RAY_BAN_MODEL_TOKENS.some((token) =>
    tokenHaystack.includes(` ${normalizeTokenText(token)} `),
  );
  const matchesStrongRayBanToken = RAY_BAN_STRONG_TOKENS.some((token) =>
    tokenHaystack.includes(` ${normalizeTokenText(token)} `),
  );

  if (matchesStrongRayBanToken || (isSunglassesProduct && matchesRayBanModel)) {
    return "Ray Ban";
  }

  return "";
}

function resolveBrand(row, pageData, category) {
  return (
    nonEmptyString(row.Marca) ??
    nonEmptyString(pageData.product?.brand) ??
    inferBrandFromTokens({ row, pageData, category }) ??
    ""
  );
}

function inferCategoryPath(row, pageData, category, brand) {
  if (category.path.length > 0) return category.path;

  const tokenSource = [
    row.Nombre,
    row.Tags,
    pageData.product?.name,
    ...(Array.isArray(pageData.product?.tags) ? pageData.product.tags : []),
  ]
    .map((value) => normalizeTokenText(value))
    .filter(Boolean)
    .join(" | ");

  if (normalizeTokenText(brand) === "RAY BAN") {
    const rayBanPath = ["LENTES DE SOL", "RAY BAN"];
    if (tokenSource.includes("WAYFARER")) return [...rayBanPath, "WAYFARER"];
    if (tokenSource.includes("BIO BASED") || tokenSource.includes("ZURI")) {
      return [...rayBanPath, "BIO BASED"];
    }
    return rayBanPath;
  }

  if (normalizeTokenText(brand) === "TOMMY HILFIGER") return ["RELOJES", "TOMMY HILFIGER"];
  if (normalizeTokenText(brand) === "INVICTA") return ["RELOJES", "INVICTA"];
  if (normalizeTokenText(brand) === "OMEGA X SWATCH") return ["RELOJES", "OMEGA X Swatch"];

  if (brand) return ["SIN CATEGORIA", brand];
  return ["SIN CATEGORIA"];
}

function normalizeVariant(row, variant) {
  const currentPrice = positiveNumberOrNull(variant.price_number);
  const compareAtPrice = positiveNumberOrNull(variant.compare_at_price_number);
  const explicitPromotionalPrice = positiveNumberOrNull(variant.promotional_price_number);
  const fallbackPrice = parseTiendanubePrice(row.Precio);
  const fallbackPromotionalPrice = parseTiendanubePrice(row["Precio promocional"]);
  const stock = Number(variant.stock ?? row.Stock ?? 0);
  const salePrice = explicitPromotionalPrice ?? currentPrice ?? fallbackPromotionalPrice;
  const regularPrice =
    compareAtPrice !== null && salePrice !== null && compareAtPrice > salePrice
      ? compareAtPrice
      : fallbackPrice !== null && salePrice !== null && fallbackPrice > salePrice
        ? fallbackPrice
        : null;
  const price = regularPrice ?? salePrice ?? fallbackPrice;
  const promotionalPrice =
    salePrice !== null && price !== null && salePrice < price ? salePrice : null;

  return {
    id: numberOrNull(variant.id),
    sku: String(variant.sku ?? row.SKU ?? "").trim(),
    options: variantOptions(variant),
    price,
    promotionalPrice,
    stock,
    available: Boolean(variant.available) && stock > 0,
    image: normalizeImageUrl(variant.image_url),
  };
}

function normalizeProduct(row, pageData) {
  const slug = String(row["Identificador de URL"] ?? "").trim();
  const category = parseCategoryField(row["Categorías"]);
  const descriptionHtml = normalizeDescriptionHtml(row["Descripción"]);
  const variants = (pageData.variants ?? []).map((variant) => normalizeVariant(row, variant));
  const images = unique([
    ...pageData.galleryImages,
    ...variants.map((variant) => variant.image),
  ]);
  const stock =
    variants.length > 0
      ? variants.reduce((total, variant) => total + (Number.isFinite(variant.stock) ? variant.stock : 0), 0)
      : Number(row.Stock || 0);
  const representativeVariant = variants.find((variant) => variant.available) ?? variants[0];
  const pageTags = Array.isArray(pageData.product?.tags) ? pageData.product.tags : [];
  const csvTags = String(row.Tags ?? "")
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
  const warnings = [...(pageData.warnings ?? [])];

  if (variants.length === 0) {
    warnings.push("No se encontraron variantes Tiendanube para checkout directo.");
  }

  if (images.length === 0) {
    warnings.push("Producto sin imágenes extraídas.");
  }

  const brand = resolveBrand(row, pageData, category);
  const categories = inferCategoryPath(row, pageData, category, brand);
  if (category.path.length === 0) {
    warnings.push(`Categoría inferida: ${categories.join(" > ")}`);
  }

  return {
    id: String(pageData.product?.id ?? slug),
    tiendanubeProductId: pageData.product?.id ?? null,
    slug,
    name: String(row.Nombre ?? "").trim(),
    brand,
    categories,
    tags: unique([...category.tags, ...csvTags, ...pageTags]),
    descriptionHtml,
    descriptionText: htmlToText(descriptionHtml),
    price: representativeVariant?.price ?? parseTiendanubePrice(row.Precio),
    promotionalPrice:
      representativeVariant?.promotionalPrice ?? parseTiendanubePrice(row["Precio promocional"]),
    stock,
    images,
    seoTitle: String(row["Título para SEO"] || row.Nombre || "").trim(),
    seoDescription: String(row["Descripción para SEO"] || "").trim(),
    sourceUrl: `${STORE_ORIGIN}/productos/${slug}/`,
    variants,
    importWarnings: unique(warnings),
  };
}

async function scrapeProduct(slug) {
  const url = `${STORE_ORIGIN}/productos/${slug}/`;
  const html = await fetchHtml(url);
  const product = parseProductAssignment(html);
  const variants = extractAssignedJson(html, "LS.variants");
  const galleryImages = extractGalleryImages(html);
  const warnings = [];

  if (!product?.id) warnings.push("No se pudo extraer LS.product.id.");
  if (!Array.isArray(variants)) warnings.push("No se pudo extraer LS.variants.");
  if (galleryImages.length === 0) warnings.push("No se encontraron imágenes en la galería pública.");

  return {
    product,
    variants: Array.isArray(variants) ? variants : [],
    galleryImages,
    warnings,
  };
}

async function main() {
  const buffer = await fs.readFile(CSV_PATH);
  const rows = parseCsv(CSV_DECODER.decode(buffer));
  const visibleRows = rows.filter(
    (row) => String(row["Mostrar en tienda"] ?? "").trim().toUpperCase() === "SI",
  );

  const products = [];
  const errors = [];
  let productsWithPageData = 0;

  for (const row of visibleRows) {
    const slug = String(row["Identificador de URL"] ?? "").trim();

    try {
      const pageData = await scrapeProduct(slug);
      if (pageData.product?.id || pageData.variants.length > 0 || pageData.galleryImages.length > 0) {
        productsWithPageData += 1;
      }
      products.push(normalizeProduct(row, pageData));
      process.stdout.write(".");
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      errors.push({ slug, message });
      products.push(
        normalizeProduct(row, {
          product: null,
          variants: [],
          galleryImages: [],
          warnings: [message],
        }),
      );
      process.stdout.write("!");
    }
  }

  const summary = {
    csvPath: CSV_PATH,
    csvRowsRead: rows.length,
    visibleProductsImported: products.length,
    productsWithPageData,
    productsWithScrapeErrors: errors.length,
    scrapeErrors: errors,
    productsWithVariants: products.filter((product) => product.variants.length > 0).length,
    productsWithBlankBrand: products.filter((product) => !String(product.brand ?? "").trim()).length,
    productsWithPurchasableStock: products.filter((product) =>
      product.variants.some((variant) => variant.available && variant.stock > 0),
    ).length,
    productsHiddenWithoutStock: products
      .filter((product) => !product.variants.some((variant) => variant.available && variant.stock > 0))
      .map((product) => product.slug),
    productsWithoutImages: products.filter((product) => product.images.length === 0).map((product) => product.slug),
    variantsWithZeroPromotionalPrice: products.reduce(
      (count, product) =>
        count + product.variants.filter((variant) => variant.promotionalPrice === 0).length,
      0,
    ),
  };

  await fs.mkdir(OUT_DIR, { recursive: true });
  await fs.writeFile(
    path.join(OUT_DIR, "tiendanube-catalog.json"),
    `${JSON.stringify(products, null, 2)}\n`,
  );
  await fs.writeFile(
    path.join(OUT_DIR, "tiendanube-import-summary.json"),
    `${JSON.stringify(summary, null, 2)}\n`,
  );

  console.log(`\nImported ${products.length} visible products`);
  console.log(`Scrape errors: ${errors.length}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
