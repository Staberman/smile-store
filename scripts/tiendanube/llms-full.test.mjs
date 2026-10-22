import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { isRayBanProduct, RAY_BAN_MODEL_HUBS } from "../../lib/collection-hubs.mjs";
import { buildLlmsFull, llmsSummary } from "../../lib/llms-text.mjs";
import { formatPrice } from "../../lib/price-format.mjs";
import { descriptionLines, splitDescription } from "../../lib/product-copy.mjs";
import {
  CHECKOUT_PHRASE,
  FREE_SHIPPING_PHRASE,
  INSTALLMENTS_PHRASE,
  STORE_LOCATION,
  STORE_PICKUP_PHRASE,
  TRANSFER_DISCOUNT_PHRASE,
} from "../../lib/store-copy.mjs";
import { STORE_FAQS } from "../../lib/store-faqs.mjs";
import { getAvailableVariants, getDisplayPrice } from "../../lib/storefront.mjs";

const projectRoot = process.cwd();
const read = (relativePath) => fs.readFileSync(path.join(projectRoot, relativePath), "utf8");
const catalog = JSON.parse(read("data/tiendanube-catalog.json"));

const SITE_URL = "https://smiletiendaimp.com.ar";
const STORE = { name: "Smile", alternateName: "Smile Tienda" };
const CONTACT = {
  whatsappUrl: "https://wa.me/5493412613504",
  phone: "+54 9 341 261 3504",
  email: "smiletiendaimportados@gmail.com",
  instagramUrl: "https://www.instagram.com/smiletienda.ar",
};
const aviador = RAY_BAN_MODEL_HUBS.find((hub) => hub.slug === "aviador");
const HUBS = [
  { name: "Anteojos de sol", path: "/tienda/anteojos-de-sol", description: "Todos los anteojos de sol." },
  { name: aviador.linkLabel, path: aviador.path, description: aviador.summary },
];

// Same rule as lib/catalog.ts (hasPurchasableStock).
const purchasable = (product) =>
  product.variants.some(
    (variant) =>
      product.tiendanubeProductId !== null &&
      variant.id !== null &&
      variant.available &&
      variant.stock > 0,
  );
// Stand-in for lib/brand-directory's canonicalBrand, which node:test cannot import.
const brandLabel = (product) => (isRayBanProduct(product) ? "Ray-Ban" : product.brand.trim());

function entriesFor(products) {
  return products.map((product) => ({
    product,
    facts: { name: product.name, brand: brandLabel(product), purchasable: purchasable(product) },
  }));
}

function build(products = catalog) {
  return buildLlmsFull({
    siteUrl: SITE_URL,
    store: STORE,
    contact: CONTACT,
    hubs: HUBS,
    entries: entriesFor(products),
  });
}

const text = build();
const urlOf = (product) => `${SITE_URL}/tienda/productos/${product.slug}`;

/** Product blocks by URL: the "- [name](url)" line and its nested lines. */
function productBlocks(document) {
  const blocks = new Map();
  let current = null;
  let heading = null;
  for (const line of document.split("\n")) {
    if (line.startsWith("#")) heading = line;
    const start = line.match(/^- \[(.+)\]\((https:\/\/[^)]+\/tienda\/productos\/[^)]+)\)$/);
    if (start) {
      current = { name: start[1], heading, lines: [] };
      assert.ok(!blocks.has(start[2]), `${start[2]} is listed once`);
      blocks.set(start[2], current);
    } else if (current && line.startsWith("  - ")) {
      current.lines.push(line.slice(4));
    } else {
      current = null;
    }
  }
  return blocks;
}

const blocks = productBlocks(text);
const field = (block, name) =>
  block.lines.find((line) => line.startsWith(`${name}: `))?.slice(name.length + 2);

test("llms-full.txt opens with the llms.txt summary, then facts, hubs, catalog and FAQ", () => {
  assert.ok(text.startsWith(`# Smile\n\n> ${llmsSummary(STORE)}\n\n`), text.slice(0, 300));
  const sections = text.split("\n").filter((line) => line.startsWith("## "));
  assert.deepEqual(sections, [
    "## Datos de la tienda",
    "## Colecciones",
    "## Catálogo",
    "## Preguntas frecuentes",
  ]);
  for (const hub of HUBS) {
    assert.ok(text.includes(`- [${hub.name}](${SITE_URL}${hub.path}): ${hub.description}\n`), hub.path);
  }
});

test("store facts come from the shared payment, shipping, pickup and contact values", () => {
  const facts = text.slice(text.indexOf("## Datos de la tienda"), text.indexOf("## Colecciones"));
  for (const phrase of [
    STORE_LOCATION.label,
    CHECKOUT_PHRASE,
    INSTALLMENTS_PHRASE,
    TRANSFER_DISCOUNT_PHRASE,
    `${FREE_SHIPPING_PHRASE}.`,
    `${STORE_PICKUP_PHRASE}, ${STORE_LOCATION.locality}.`,
    CONTACT.phone,
    CONTACT.whatsappUrl,
    CONTACT.email,
    "@smiletienda.ar",
  ]) {
    assert.ok(facts.includes(phrase), `facts state ${phrase}`);
  }
  // The summary states the same terms.
  const summary = llmsSummary(STORE);
  for (const phrase of [CHECKOUT_PHRASE, INSTALLMENTS_PHRASE, TRANSFER_DISCOUNT_PHRASE, FREE_SHIPPING_PHRASE]) {
    assert.ok(summary.includes(phrase), `summary states ${phrase}`);
  }
});

test("every catalog product is listed once with its URL, brand, availability and specs", () => {
  assert.equal(blocks.size, catalog.length);
  for (const product of catalog) {
    const block = blocks.get(urlOf(product));
    assert.ok(block, `${product.slug} is listed`);
    assert.equal(block.name, product.name);
    assert.equal(field(block, "Marca"), brandLabel(product));
    assert.equal(
      field(block, "Disponibilidad"),
      purchasable(product) && getAvailableVariants(product).length > 0 ? "en stock" : "sin stock",
      product.slug,
    );
    const { specs } = splitDescription(descriptionLines(product.descriptionHtml));
    assert.equal(
      field(block, "Especificaciones"),
      specs.length > 0 ? specs.map((spec) => `${spec.name}: ${spec.value}`).join("; ") : undefined,
      product.slug,
    );
  }
  assert.ok(
    catalog.some((product) => !purchasable(product)),
    "the catalog keeps sold-out products, and so does the file",
  );
});

test("prices are the price the product page displays", () => {
  for (const product of catalog) {
    // ProductDetailClient: getDisplayPrice(product, first available variant).
    const displayed = getDisplayPrice(product, getAvailableVariants(product)[0] ?? null);
    assert.equal(field(blocks.get(urlOf(product)), "Precio"), formatPrice(displayed), product.slug);
  }
  // The page selects the first in-stock variant, even when another is cheaper.
  const firstNotCheapest = catalog.find((product) => {
    const [first, ...rest] = getAvailableVariants(product);
    const price = (variant) => variant.promotionalPrice ?? variant.price;
    return first && rest.some((variant) => price(variant) < price(first));
  });
  if (firstNotCheapest) {
    const [first] = getAvailableVariants(firstNotCheapest);
    assert.equal(
      field(blocks.get(urlOf(firstNotCheapest)), "Precio"),
      formatPrice(first.promotionalPrice ?? first.price),
    );
  }
});

test("the catalog is grouped by brand and, for Ray-Ban, by model hub", () => {
  for (const product of catalog) {
    const { heading } = blocks.get(urlOf(product));
    const model = RAY_BAN_MODEL_HUBS.find((hub) => hub.matches(product));
    if (model) assert.equal(heading, `#### ${model.linkLabel}`, product.slug);
    else if (isRayBanProduct(product)) assert.equal(heading, "#### Otros modelos Ray-Ban", product.slug);
    else assert.equal(heading, `### ${brandLabel(product)}`, product.slug);
  }
  // Model groups link their hub when it is indexed (listed in the hubs).
  assert.ok(text.includes(`#### Ray-Ban Aviador\n\nColección: ${SITE_URL}${aviador.path}\n`));
  assert.ok(!text.includes(`Colección: ${SITE_URL}/tienda/marcas/ray-ban/wayfarer`));
  // Sunglasses brands come before watch brands.
  assert.ok(text.indexOf("### Ray-Ban") < text.indexOf("### Prada"));
  assert.ok(text.indexOf("### Prada") < text.indexOf("### Tommy Hilfiger"));
  // In stock first within a group.
  const rayBanOthers = text.slice(text.indexOf("#### Otros modelos Ray-Ban"), text.indexOf("\n### ", text.indexOf("#### Otros modelos Ray-Ban")));
  const availability = [...rayBanOthers.matchAll(/Disponibilidad: (en stock|sin stock)/g)].map((match) => match[1]);
  assert.deepEqual(availability, [...availability].sort());
});

test("the FAQ is the store FAQ", () => {
  const faq = text.slice(text.indexOf("## Preguntas frecuentes"));
  for (const { question, answer } of STORE_FAQS) {
    assert.ok(faq.includes(`### ${question}\n\n${answer}\n`), question);
  }
});

test("the file is plain text, deterministic and under 200 KB", () => {
  assert.doesNotMatch(text, /<\/?[a-z][^>]*>/i, "no HTML tags");
  assert.doesNotMatch(text, /&(?:[a-z]+|#\d+|#x[0-9a-f]+);/i, "no HTML entities");
  assert.doesNotMatch(text, /[ \t]+$/m, "no trailing spaces");
  assert.doesNotMatch(text, /\n{3,}/, "no runs of blank lines");
  assert.ok(Buffer.byteLength(text) < 200 * 1024, `${Buffer.byteLength(text)} bytes`);
  // Same output whatever the catalog order.
  assert.equal(build([...catalog].reverse()), text);
  assert.equal(build(), text);
});

test("payment and shipping terms are never written by hand; llms.txt links the full version", () => {
  const handWritten =
    /\d+\s?cuotas|cuotas sin inter|% off|por transferencia|env[ií]o gratis|\$\s?\d|Puerto Norte|checkout seguro/i;
  for (const file of [
    "lib/llms-text.mjs",
    "lib/llms-hubs.ts",
    "app/llms.txt/route.ts",
    "app/llms-full.txt/route.ts",
  ]) {
    assert.doesNotMatch(read(file), handWritten, file);
  }

  const llmsTxt = read("app/llms.txt/route.ts");
  const llmsFull = read("app/llms-full.txt/route.ts");
  // Both files open with the same summary.
  assert.match(llmsTxt, /llmsSummary\(\{ name: SITE_NAME, alternateName: STORE_ALTERNATE_NAME \}\)/);
  assert.match(llmsFull, /store: \{ name: SITE_NAME, alternateName: STORE_ALTERNATE_NAME \}/);
  assert.match(llmsTxt, /`Versión completa: \$\{absoluteUrl\("\/llms-full\.txt"\)\}`/);
  for (const source of [llmsTxt, llmsFull]) {
    assert.match(source, /export const dynamic = "force-static";/);
    assert.match(source, /"Content-Type": "text\/plain; charset=utf-8"/);
  }
  // The full catalog, sold-out products included, as the feed lists it.
  assert.match(llmsFull, /allProductsIncludingOutOfStock\.map/);
});
