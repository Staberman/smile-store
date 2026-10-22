import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import {
  COLLECTION_HUBS,
  countWords,
  hubFacts,
  isIndexableHub,
  RAY_BAN_MODEL_HUBS,
  SUNGLASSES_HUB,
} from "../../lib/collection-hubs.mjs";
import {
  buildGuides,
  GUIDE_LINKS,
  GUIDES_INDEX,
  guideLinks,
  guideText,
  isPolarizedProduct,
  stripLinks,
} from "../../lib/guides/guides.mjs";
import {
  META_DESCRIPTION_MAX_LENGTH,
  META_DESCRIPTION_MIN_LENGTH,
  MAX_TITLE_LENGTH,
  TITLE_SUFFIX,
} from "../../lib/product-seo.mjs";
import {
  FREE_SHIPPING_CONDITION,
  FREE_SHIPPING_PHRASE,
  INSTALLMENTS_PHRASE,
  STORE_PICKUP_PHRASE,
  TRANSFER_DISCOUNT_PHRASE,
} from "../../lib/store-copy.mjs";

const projectRoot = process.cwd();
const read = (relativePath) => fs.readFileSync(path.join(projectRoot, relativePath), "utf8");
const catalog = JSON.parse(read("data/tiendanube-catalog.json"));

// Same rule as hasPurchasableStock in lib/catalog.ts.
const isPurchasable = (product) =>
  product.variants.some(
    (variant) =>
      product.tiendanubeProductId !== null && variant.id !== null && variant.available && variant.stock > 0,
  );
const inStock = catalog.filter(isPurchasable);
const context = { catalog, inStock, displayName: (product) => product.name };
const guides = buildGuides(context);

const hubPaths = new Set([
  ...COLLECTION_HUBS.filter((hub) => isIndexableHub(catalog.filter(hub.matches).length)).map((hub) => hub.path),
  "/tienda/marcas/ray-ban",
  "/tienda/marcas/ray-ban/ferrari",
  "/tienda/marcas/premium",
  "/tienda/relojes",
]);
const productPaths = new Set(catalog.map((product) => `/tienda/productos/${product.slug}`));
const knownPaths = new Set([
  ...hubPaths,
  ...productPaths,
  ...guides.map((guide) => guide.path),
  GUIDES_INDEX.path,
  "/guia-de-estilo",
  "/contacto",
]);

/** Guide text with the shared store phrases removed: what was written by hand. */
function handWritten(text) {
  return [FREE_SHIPPING_PHRASE, FREE_SHIPPING_CONDITION, INSTALLMENTS_PHRASE, TRANSFER_DISCOUNT_PHRASE].reduce(
    (rest, phrase) => rest.split(phrase).join(" "),
    text,
  );
}

const guideSourceFiles = fs
  .readdirSync(path.join(projectRoot, "lib/guides"))
  .filter((file) => file.endsWith(".mjs"))
  .map((file) => `lib/guides/${file}`);

test("there are three guides with unique slugs, titles, headings and descriptions", () => {
  assert.equal(guides.length, 3);
  for (const field of ["slug", "path", "title", "h1", "description", "crumb"]) {
    const values = guides.map((guide) => guide[field]);
    assert.equal(new Set(values).size, values.length, `duplicate ${field}`);
  }
  assert.ok(!guides.some((guide) => guide.title === GUIDES_INDEX.title));
});

test("titles fit 60 characters with the site suffix and descriptions fit 140-155", () => {
  for (const page of [...guides, GUIDES_INDEX]) {
    assert.ok(
      `${page.title}${TITLE_SUFFIX}`.length <= MAX_TITLE_LENGTH,
      `${page.title} is ${`${page.title}${TITLE_SUFFIX}`.length} characters with the suffix`,
    );
    assert.ok(
      page.description.length >= META_DESCRIPTION_MIN_LENGTH && page.description.length <= META_DESCRIPTION_MAX_LENGTH,
      `${page.path}: description is ${page.description.length} characters`,
    );
  }
});

test("every guide is dated with real ISO dates, modified on or after publication", () => {
  for (const guide of guides) {
    for (const date of [guide.datePublished, guide.dateModified]) {
      assert.match(date, /^\d{4}-\d{2}-\d{2}$/, guide.slug);
      assert.equal(new Date(`${date}T00:00:00Z`).toISOString().slice(0, 10), date, guide.slug);
      assert.ok(new Date(`${date}T00:00:00Z`) <= new Date(), `${guide.slug}: ${date} is in the future`);
    }
    assert.ok(guide.dateModified >= guide.datePublished, guide.slug);
  }
});

test("every guide lists at least three distinct https sources", () => {
  for (const guide of guides) {
    assert.ok(guide.sources.length >= 3, `${guide.slug} has ${guide.sources.length} sources`);
    const urls = guide.sources.map((source) => source.url);
    assert.equal(new Set(urls).size, urls.length, `${guide.slug} repeats a source`);
    for (const source of guide.sources) {
      assert.equal(new URL(source.url).protocol, "https:", source.url);
      assert.ok(source.publisher.trim() && source.title.trim(), source.url);
    }
  }
});

test("the direct answer comes first: a lead within 60 words and a 40-60 word answer per section", () => {
  for (const guide of guides) {
    const leadWords = countWords(stripLinks(guide.lead));
    assert.ok(leadWords >= 25 && leadWords <= 60, `${guide.slug}: lead has ${leadWords} words`);
    for (const section of guide.sections) {
      const words = countWords(stripLinks(section.answer));
      assert.ok(words >= 40 && words <= 60, `${guide.slug} / ${section.id}: answer has ${words} words`);
    }
  }
});

test("sections are asked as questions and have unique anchors", () => {
  for (const guide of guides) {
    const ids = guide.sections.map((section) => section.id);
    assert.equal(new Set(ids).size, ids.length, guide.slug);
    for (const section of guide.sections) {
      assert.match(section.id, /^[a-z0-9-]+$/, section.id);
      assert.match(section.heading, /^¿.+\?$/, section.heading);
    }
    for (const faq of guide.faqs) {
      assert.match(faq.question, /^¿.+\?$/, faq.question);
      assert.equal(stripLinks(faq.answer), faq.answer, "FAQ answers are plain text for FAQPage");
    }
  }
});

test("each guide runs 700-1200 words", () => {
  for (const guide of guides) {
    const words = countWords(guideText(guide));
    assert.ok(words >= 700 && words <= 1200, `${guide.slug} has ${words} words`);
  }
});

test("every internal link resolves to a published, indexable page", () => {
  for (const guide of guides) {
    for (const href of guideLinks(guide)) {
      assert.ok(knownPaths.has(href.split("#")[0]), `${guide.slug} links to unknown ${href}`);
    }
  }
});

test("each guide links to at least one hub and to the other guides", () => {
  for (const guide of guides) {
    const links = new Set(guideLinks(guide));
    assert.ok([...links].some((href) => hubPaths.has(href)), `${guide.slug} links to no hub`);
    for (const other of guides.filter((entry) => entry.slug !== guide.slug)) {
      assert.ok(links.has(other.path), `${guide.slug} does not link to ${other.slug}`);
    }
  }
});

test("payment and shipping terms only come from the shared phrases", () => {
  for (const guide of guides) {
    const text = handWritten(guideText(guide));
    assert.doesNotMatch(text, /%/, `${guide.slug} writes a percentage by hand`);
    assert.doesNotMatch(text, /\bcuotas?\b/i, `${guide.slug} writes installments by hand`);
    assert.doesNotMatch(text, /\$/, `${guide.slug} writes a price by hand`);
    assert.doesNotMatch(text, /env[ií]os? gratis/i, `${guide.slug} promises free shipping by hand`);
  }
  for (const file of guideSourceFiles) {
    // Source URLs may carry percent-encoding ("disposici%C3%B3n").
    const source = read(file).replace(/https?:\/\/[^"\s]+/g, "");
    assert.doesNotMatch(source, /\bcuotas?\b/i, file);
    assert.doesNotMatch(source, /\d\s*%/, file);
    // Peso amounts ("$ 200.000", "$15000"), not regex backreferences ("$1").
    assert.doesNotMatch(source, /\$\s?\d{1,3}(?:\.\d{3})+|\$\s?\d{4,}/, file);
    assert.doesNotMatch(source, /env[ií]os? gratis/i, file);
  }
});

test("the store terms a guide states are the synced ones", () => {
  const all = guides.map(guideText).join("\n");
  for (const phrase of [INSTALLMENTS_PHRASE, TRANSFER_DISCOUNT_PHRASE, FREE_SHIPPING_PHRASE, STORE_PICKUP_PHRASE]) {
    assert.ok(all.includes(phrase), `the guides do not state "${phrase}"`);
  }
});

test("guides make no warranty, returns or authorized-dealer claims", () => {
  for (const guide of guides) {
    const text = handWritten(guideText(guide));
    assert.doesNotMatch(text, /garant[ií]a/i, guide.slug);
    assert.doesNotMatch(text, /devoluci[oó]n|devolver|reembolso/i, guide.slug);
    for (const sentence of text.split(/(?<=[.!?])\s+/).filter((entry) => /\bSmile\b/.test(entry))) {
      assert.doesNotMatch(sentence, /autorizad|oficial|certificad/i, `${guide.slug}: "${sentence}"`);
    }
  }
});

test("the polarized guide links only in-stock models the catalog names polarized", () => {
  const guide = guides.find((entry) => entry.slug === "anteojos-polarizados-que-son-y-cuando-conviene");
  const linked = guide.sections
    .flatMap((section) => section.blocks)
    .filter((block) => block.type === "links")
    .flatMap((block) => block.items.map((item) => item.href));
  const expected = inStock.filter(isPolarizedProduct).map((product) => `/tienda/productos/${product.slug}`);
  assert.ok(expected.length > 0, "the catalog has polarized models in stock");
  assert.deepEqual(new Set(linked), new Set(expected));
});

test("without polarized models in stock, the polarized guide points to the sunglasses hub", () => {
  const [, , guide] = buildGuides({ ...context, inStock: inStock.filter((product) => !isPolarizedProduct(product)) });
  const blocks = guide.sections.flatMap((section) => section.blocks);
  assert.ok(!blocks.some((block) => block.type === "links"), "no product links");
  assert.ok(guideLinks(guide).includes(SUNGLASSES_HUB.path));
});

test("polarized means named polarized: the store-wide SEO tag does not count", () => {
  const tagged = catalog.filter((product) => product.tags.includes("gafas de sol polarizadas"));
  assert.ok(tagged.some((product) => !isPolarizedProduct(product)), "the tag is not a reliable signal");
  assert.ok(isPolarizedProduct({ name: "Aviador Polarizado 3025", categories: ["LENTES DE SOL"] }));
  assert.ok(isPolarizedProduct({ name: "Justin 4165 Polarizados", categories: ["LENTES DE SOL"] }));
  assert.ok(!isPolarizedProduct({ name: "Aviador Classic 3025", categories: ["LENTES DE SOL"] }));
  assert.ok(!isPolarizedProduct({ name: "Reloj Polarizado", categories: ["RELOJES"] }));
});

test("the Ray-Ban comparison links every model hub and reads frame materials from the catalog", () => {
  const guide = guides.find((entry) => entry.slug === "ray-ban-aviador-wayfarer-round-cual-elegir");
  const table = guide.sections.flatMap((section) => section.blocks).find((block) => block.type === "table");
  assert.ok(table, "the guide has a comparison table");
  for (const hub of RAY_BAN_MODEL_HUBS) {
    const row = table.rows.find((cells) => cells[0].includes(`](${hub.path})`));
    assert.ok(row, `the table has a row for ${hub.name}`);
    const facts = hubFacts(catalog.filter(hub.matches));
    const frameCell = row[table.head.indexOf("Armazón en Smile")].toLowerCase();
    for (const material of facts.frameMaterials) assert.ok(frameCell.includes(material), `${hub.name}: ${frameCell}`);
    // Driving and water only where the catalog has a polarized version.
    const useCell = row[table.head.indexOf("Uso típico")];
    assert.equal(/ruta y agua/.test(useCell), facts.lensTypes.includes("polarizados"), `${hub.name}: ${useCell}`);
  }
});

test("a model without frame specs in the catalog says so instead of guessing", () => {
  const withoutSpecs = catalog.map((product) => ({ ...product, descriptionHtml: "" }));
  const [, guide] = buildGuides({ ...context, catalog: withoutSpecs });
  const table = guide.sections.flatMap((section) => section.blocks).find((block) => block.type === "table");
  const column = table.head.indexOf("Armazón en Smile");
  for (const row of table.rows) assert.equal(row[column], "Sin dato en las fichas");
});

test("every ready-made guide link points to a published guide", () => {
  for (const entry of Object.values(GUIDE_LINKS)) {
    assert.ok(guides.some((guide) => guide.path === entry.href), entry.href);
  }
});

test("the guides are in the sitemap with their own dates and linked from the footer and hubs", () => {
  const sitemap = read("app/sitemap.ts");
  assert.match(sitemap, /GUIDES\.map\(/);
  assert.match(sitemap, /lastModified: guide\.dateModified/);
  assert.match(sitemap, /GUIDES_INDEX\.path/);
  assert.match(read("components/layout/Footer.tsx"), /href: "\/guias"/);
  assert.match(read("app/tienda/marcas/ray-ban/page.tsx"), /GUIDE_LINKS\.rayBanModels/);
  assert.match(read("app/tienda/marcas/ray-ban/[model]/page.tsx"), /GUIDE_LINKS\.rayBanModels/);
  assert.match(read("app/tienda/anteojos-de-sol/page.tsx"), /GUIDE_LINKS\.polarized/);
});
