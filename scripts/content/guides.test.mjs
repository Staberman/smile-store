import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import {
  AUDIENCE_HUBS,
  COLLECTION_HUBS,
  countWords,
  hubFacts,
  isIndexableHub,
  priceRange,
  RAY_BAN_MODEL_HUBS,
  SUNGLASSES_HUB,
} from "../../lib/collection-hubs.mjs";
import { descriptionLines, productKind, splitDescription } from "../../lib/product-copy.mjs";
import {
  buildGuides,
  CATALOG_LIST_LIMIT,
  catalogBlocks,
  GUIDE_LINKS,
  GUIDE_SLUGS,
  GUIDE_TOPICS,
  GUIDES_INDEX,
  guideAuthoredText,
  guideLinks,
  guidesOfTopic,
  guideText,
  isInvictaProduct,
  isPolarizedProduct,
  stripLinks,
} from "../../lib/guides/guides.mjs";
import { waterUse } from "../../lib/guides/resistencia-al-agua.mjs";
import { pesosRange, waterResistance } from "../../lib/guides/watch-facts.mjs";
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

// The hourly sync runs these tests before it publishes stock and price
// updates, so nothing here may depend on what is in stock today or on a
// price: every expectation is derived from the catalog the test reads, and
// the rules are checked for many stock scenarios built from that catalog.

const projectRoot = process.cwd();
const read = (relativePath) => fs.readFileSync(path.join(projectRoot, relativePath), "utf8");
const catalog = JSON.parse(read("data/tiendanube-catalog.json"));

// Same rule as hasPurchasableStock in lib/catalog.ts.
const isPurchasable = (product) =>
  product.variants.some(
    (variant) =>
      product.tiendanubeProductId !== null && variant.id !== null && variant.available && variant.stock > 0,
  );
const isWatch = (product) => productKind(product) === "watch";
const displayName = (product) => product.name;
const context = { catalog, inStock: catalog.filter(isPurchasable), displayName };
const guides = buildGuides(context);

/** A deterministic pseudo-random sequence in [0, 1), for repeatable stock scenarios. */
function seeded(seed) {
  let state = seed;
  return () => {
    state = (state * 1103515245 + 12345) % 2 ** 31;
    return state / 2 ** 31;
  };
}

/** Prices moved by a factor, as a sync can do: the guides must follow them. */
const repriced = (products, factor) =>
  products.map((product) => ({
    ...product,
    price: product.price === null ? null : Math.round(product.price * factor),
    promotionalPrice: product.promotionalPrice === null ? null : Math.round(product.promotionalPrice * factor),
  }));

// Stock the sync can produce: the same products, any of them in stock, any price.
const STOCK_SCENARIOS = [
  ["the current stock", context.inStock],
  ["nothing in stock", []],
  ["everything in stock", catalog],
  [
    "every Invicta and Tommy Hilfiger in stock",
    catalog.filter((product) => ["Invicta", "Tommy Hilfiger"].includes(product.brand) || isPurchasable(product)),
  ],
  ["no watch in stock", context.inStock.filter((product) => !isWatch(product))],
  ["only watches in stock", catalog.filter(isWatch)],
  ["new prices", repriced(context.inStock, 1.37)],
  ...Array.from({ length: 20 }, (_, index) => {
    const random = seeded(index + 1);
    const share = random();
    return [`random stock #${index + 1}`, catalog.filter(() => random() < share)];
  }),
].map(([name, inStock]) => ({ name, inStock, guides: buildGuides({ ...context, inStock }) }));

/** The guide built for a GUIDE_SLUGS key, from these guides or a rebuilt set. */
const guideOf = (key, list = guides) => list.find((guide) => guide.slug === GUIDE_SLUGS[key]);
const blocksOf = (guide) => guide.sections.flatMap((section) => section.blocks);
const sectionOf = (guide, id) => guide.sections.find((section) => section.id === id);
const productHref = (product) => `/tienda/productos/${product.slug}`;
const productHrefs = (hrefs) => hrefs.filter((href) => href.startsWith("/tienda/productos/"));
const tableHrefs = (table) => table.rows.map((row) => row[0].match(/\]\(([^)]+)\)/)[1]);
const modelsPhrase = (count) => `${count} ${count === 1 ? "modelo" : "modelos"}`;

// Each watch hub is its own route (app/tienda/marcas/*, app/tienda/relojes/*).
const WATCH_BRAND_HUB_PATHS = ["/tienda/marcas/invicta", "/tienda/marcas/tommy-hilfiger", "/tienda/relojes/omega-swatch"];
const WATCH_AUDIENCE_HUBS = AUDIENCE_HUBS.filter((hub) => hub.kind === "watch");

// Indexable hubs count every catalog product, in stock or not: stock never changes them.
const hubPaths = new Set([
  ...COLLECTION_HUBS.filter((hub) => isIndexableHub(catalog.filter(hub.matches).length)).map((hub) => hub.path),
  "/tienda/marcas/ray-ban",
  "/tienda/marcas/ray-ban/ferrari",
  "/tienda/marcas/premium",
  "/tienda/relojes",
  ...WATCH_BRAND_HUB_PATHS,
]);
const knownPaths = new Set([
  ...hubPaths,
  ...catalog.map(productHref),
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

/** Products a catalog block lists (table rows or link chips), without its "y N más" link. */
function listedProducts(block) {
  if (block.type === "table") return productHrefs(tableHrefs(block));
  if (block.type === "links") return productHrefs(block.items.map((item) => item.href));
  return [];
}

/**
 * Rules every guide keeps whatever the stock: a lead within 60 words and a
 * 40-60 word answer per section, question headings, 700-1200 words of
 * authored copy, catalog blocks within CATALOG_LIST_LIMIT products, internal
 * links that resolve, no hand-written store terms and no warranty, returns
 * or authorized-dealer claims.
 */
function assertGuideRules(guide, label = "") {
  const where = `${guide.slug}${label ? ` (${label})` : ""}`;
  const leadWords = countWords(stripLinks(guide.lead));
  assert.ok(leadWords >= 25 && leadWords <= 60, `${where}: lead has ${leadWords} words`);
  for (const section of guide.sections) {
    const words = countWords(stripLinks(section.answer));
    assert.ok(words >= 40 && words <= 60, `${where} / ${section.id}: answer has ${words} words`);
    assert.match(section.heading, /^¿.+\?$/, section.heading);
  }
  const authored = countWords(guideAuthoredText(guide));
  assert.ok(authored >= 700 && authored <= 1200, `${where} has ${authored} authored words`);
  for (const block of catalogBlocks(guide)) {
    assert.ok(listedProducts(block).length <= CATALOG_LIST_LIMIT, `${where}: a catalog block lists too many products`);
  }
  for (const href of guideLinks(guide)) {
    assert.ok(knownPaths.has(href.split("#")[0]), `${where} links to unknown ${href}`);
  }
  const text = handWritten(guideText(guide));
  assert.doesNotMatch(text, /%/, `${where} writes a percentage by hand`);
  assert.doesNotMatch(text, /\bcuotas?\b/i, `${where} writes installments by hand`);
  assert.doesNotMatch(text, /\$/, `${where} writes a price by hand`);
  assert.doesNotMatch(text, /env[ií]os? gratis/i, `${where} promises free shipping by hand`);
  assert.doesNotMatch(text, /garant[ií]a/i, where);
  assert.doesNotMatch(text, /devoluci[oó]n|devolver|reembolso/i, where);
  for (const sentence of text.split(/(?<=[.!?])\s+/).filter((entry) => /\bSmile\b/.test(entry))) {
    assert.doesNotMatch(sentence, /autorizad|oficial|certificad/i, `${where}: "${sentence}"`);
  }
}

test("the guides are the six published ones, with unique slugs, titles, headings and descriptions", () => {
  assert.deepEqual(new Set(guides.map((guide) => guide.slug)), new Set(Object.values(GUIDE_SLUGS)));
  assert.equal(guides.length, 6);
  for (const field of ["slug", "path", "title", "h1", "description", "crumb"]) {
    const values = guides.map((guide) => guide[field]);
    assert.equal(new Set(values).size, values.length, `duplicate ${field}`);
  }
  assert.ok(!guides.some((guide) => guide.title === GUIDES_INDEX.title));
});

test("the index groups every guide under one topic, sunglasses and watches alike", () => {
  const topics = GUIDE_TOPICS.map((topic) => topic.key);
  assert.deepEqual(topics, ["anteojos", "relojes"]);
  for (const guide of guides) assert.ok(topics.includes(guide.topic), `${guide.slug} has topic ${guide.topic}`);
  assert.deepEqual(
    guidesOfTopic(guides, "relojes").map((guide) => guide.slug),
    [GUIDE_SLUGS.invictaOriginals, GUIDE_SLUGS.waterResistance, GUIDE_SLUGS.watchGift],
  );
  assert.equal(guidesOfTopic(guides, "anteojos").length, 3);
  // Display order follows the topics, so the index never interleaves them.
  assert.deepEqual(
    guides.map((guide) => guide.topic),
    GUIDE_TOPICS.flatMap((topic) => guidesOfTopic(guides, topic.key).map(() => topic.key)),
  );
  for (const field of ["title", "description", "intro"]) {
    assert.match(GUIDES_INDEX[field], /anteojos de sol/i, `index ${field} names sunglasses`);
    assert.match(GUIDES_INDEX[field], /reloj/i, `index ${field} names watches`);
  }
  assert.match(read("app/guias/page.tsx"), /GUIDE_TOPICS\.map\(/);
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

test("sections are asked as questions with unique anchors, and FAQ answers are plain text", () => {
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

test("every guide keeps its rules for any stock and price the sync can produce", () => {
  for (const scenario of STOCK_SCENARIOS) {
    for (const guide of scenario.guides) assertGuideRules(guide, scenario.name);
  }
});

test("the word-count rule reads the authored copy: catalog tables and lists are left out", () => {
  const full = STOCK_SCENARIOS.find((scenario) => scenario.name === "everything in stock").guides;
  const withCatalog = full.filter((guide) => catalogBlocks(guide).length > 0);
  assert.deepEqual(
    new Set(withCatalog.map((guide) => guide.slug)),
    new Set([GUIDE_SLUGS.polarized, GUIDE_SLUGS.invictaOriginals, GUIDE_SLUGS.waterResistance, GUIDE_SLUGS.watchGift]),
  );
  for (const guide of withCatalog) {
    const authored = guideAuthoredText(guide);
    assert.ok(countWords(authored) < countWords(guideText(guide)), guide.slug);
    for (const block of catalogBlocks(guide)) {
      const firstCells = block.type === "table" ? block.rows.map((row) => stripLinks(row[0])) : [];
      const labels = block.type === "links" ? block.items.map((item) => item.label) : [];
      for (const name of [...firstCells, ...labels].filter((entry) => catalog.some((product) => product.name === entry))) {
        assert.ok(!authored.includes(name), `${guide.slug}: "${name}" counts as authored`);
        assert.ok(guideText(guide).includes(name), `${guide.slug}: "${name}" is not on the page`);
      }
    }
  }
  // Blocks built from the catalog's specs, not its stock, stay in the authored copy.
  assert.equal(catalogBlocks(guideOf("rayBanModels")).length, 0);
});

test("catalog blocks list at most CATALOG_LIST_LIMIT products and link the rest from the hub", () => {
  // More products than the limit, as no current catalog has: copies with new slugs.
  const copies = (products, count) =>
    Array.from({ length: count }, (_, index) => {
      const source = products[index % products.length];
      return { ...source, id: `${source.id}-copy-${index}`, slug: `${source.slug}-copia-${index}`, name: `${source.name} ${index}` };
    });
  const extra = CATALOG_LIST_LIMIT + 3;
  const polarized = copies(catalog.filter(isPolarizedProduct), extra);
  const invicta = copies(catalog.filter((product) => isInvictaProduct(product) && waterResistance(product)), extra);
  const inStock = [...polarized, ...invicta];
  const crowded = buildGuides({ catalog: [...catalog, ...inStock], inStock, displayName });

  const chips = blocksOf(guideOf("polarized", crowded)).find((block) => block.catalog && block.type === "links");
  assert.equal(listedProducts(chips).length, CATALOG_LIST_LIMIT);
  assert.deepEqual(chips.items.at(-1), { label: "Y 3 modelos más en anteojos de sol", href: SUNGLASSES_HUB.path });

  const invictaStore = sectionOf(guideOf("invictaOriginals", crowded), "invicta-en-smile");
  assert.equal(invictaStore.blocks.find((block) => block.type === "table").rows.length, CATALOG_LIST_LIMIT);
  assert.ok(invictaStore.blocks.some((block) => block.catalog && block.text === "Y 3 modelos más en la [colección Invicta](/tienda/marcas/invicta)."));
  assert.match(stripLinks(invictaStore.answer), new RegExp(`Hoy hay ${extra} modelos de Invicta`));

  const waterStore = sectionOf(guideOf("waterResistance", crowded), "relojes-en-smile");
  assert.equal(waterStore.blocks.find((block) => block.type === "table").rows.length, CATALOG_LIST_LIMIT);
  assert.ok(waterStore.blocks.some((block) => block.catalog && block.text === "Y 3 modelos más en la sección [Relojes](/tienda/relojes)."));

  for (const guide of crowded) {
    for (const block of catalogBlocks(guide)) assert.ok(listedProducts(block).length <= CATALOG_LIST_LIMIT, guide.slug);
  }
});

test("in-page anchors point to a section of the linked guide", () => {
  for (const guide of guides) {
    for (const href of guideLinks(guide).filter((entry) => entry.includes("#"))) {
      const [target, anchor] = href.split("#");
      const linked = guides.find((entry) => entry.path === target);
      assert.ok(linked?.sections.some((section) => section.id === anchor), `${guide.slug} links to ${href}`);
    }
  }
});

test("each guide links to a hub and to the other guides of its topic, whatever the stock", () => {
  for (const scenario of STOCK_SCENARIOS) {
    for (const guide of scenario.guides) {
      const links = new Set(guideLinks(guide).map((href) => href.split("#")[0]));
      assert.ok([...links].some((href) => hubPaths.has(href)), `${guide.slug} (${scenario.name}) links to no hub`);
      for (const other of guidesOfTopic(scenario.guides, guide.topic).filter((entry) => entry.slug !== guide.slug)) {
        assert.ok(links.has(other.path), `${guide.slug} (${scenario.name}) does not link to ${other.slug}`);
      }
    }
  }
});

test("the watch guides link the watch hubs they are about, whatever the stock", () => {
  for (const scenario of STOCK_SCENARIOS) {
    const linksOf = (key) => new Set(guideLinks(guideOf(key, scenario.guides)).map((href) => href.split("#")[0]));
    assert.ok(linksOf("invictaOriginals").has("/tienda/marcas/invicta"), scenario.name);
    assert.ok(linksOf("waterResistance").has("/tienda/relojes"), scenario.name);
    const gift = linksOf("watchGift");
    for (const hubPath of ["/tienda/relojes", ...WATCH_BRAND_HUB_PATHS, ...WATCH_AUDIENCE_HUBS.map((hub) => hub.path)]) {
      assert.ok(gift.has(hubPath), `the gift guide (${scenario.name}) does not link ${hubPath}`);
    }
  }
});

test("store terms come from the shared phrases, and no source file writes them or a price", () => {
  for (const scenario of STOCK_SCENARIOS) {
    const all = scenario.guides.map(guideText).join("\n");
    for (const phrase of [INSTALLMENTS_PHRASE, TRANSFER_DISCOUNT_PHRASE, FREE_SHIPPING_PHRASE, STORE_PICKUP_PHRASE]) {
      assert.ok(all.includes(phrase), `the guides (${scenario.name}) do not state "${phrase}"`);
    }
  }
  for (const file of guideSourceFiles) {
    // Source URLs may carry percent-encoding ("disposici%C3%B3n").
    const source = read(file).replace(/https?:\/\/[^"\s]+/g, "");
    assert.doesNotMatch(source, /\bcuotas?\b/i, file);
    assert.doesNotMatch(source, /\d\s*%/, file);
    // Peso amounts ("$ 200.000", "$15000"), not regex backreferences ("$1").
    assert.doesNotMatch(source, /\$\s?\d{1,3}(?:\.\d{3})+|\$\s?\d{4,}/, file);
    // Nor peso amounts in words ("<amount> pesos"): prices come from the catalog.
    assert.doesNotMatch(source, /\d{1,3}(?:\.\d{3})+\s*pesos/i, file);
    assert.doesNotMatch(source, /env[ií]os? gratis/i, file);
  }
});

// --- Sunglasses guides ---------------------------------------------------------

test("the polarized guide links in-stock models the catalog names polarized, or the sunglasses hub", () => {
  for (const scenario of STOCK_SCENARIOS) {
    const guide = guideOf("polarized", scenario.guides);
    const expected = new Set(scenario.inStock.filter(isPolarizedProduct).map(productHref));
    const chips = blocksOf(guide).find((block) => block.type === "links");
    if (expected.size === 0) {
      assert.equal(chips, undefined, `${scenario.name}: no product links`);
      assert.ok(guideLinks(guide).includes(SUNGLASSES_HUB.path), scenario.name);
      continue;
    }
    const linked = listedProducts(chips);
    assert.ok(linked.every((href) => expected.has(href)), `${scenario.name}: links a model that is not polarized in stock`);
    assert.equal(linked.length, Math.min(expected.size, CATALOG_LIST_LIMIT), scenario.name);
    const more = expected.size - linked.length;
    assert.equal(chips.items.length, linked.length + (more > 0 ? 1 : 0), scenario.name);
  }
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
  const table = blocksOf(guideOf("rayBanModels")).find((block) => block.type === "table");
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
  const guide = guideOf("rayBanModels", buildGuides({ ...context, catalog: withoutSpecs }));
  const table = blocksOf(guide).find((block) => block.type === "table");
  const column = table.head.indexOf("Armazón en Smile");
  for (const row of table.rows) assert.equal(row[column], "Sin dato en las fichas");
});

// --- Watch guides --------------------------------------------------------------

/** A spec line as the catalog's spec parser reads it, or undefined. */
const specOf = (product, name) =>
  splitDescription(descriptionLines(product.descriptionHtml)).specs.find((spec) => spec.name === name)?.value;

test("water-resistance specs parse into metres and atmospheres", () => {
  const sheet = (value) => ({ descriptionHtml: `<p>Resistencia al agua: ${value}</p>` });
  assert.deepEqual(waterResistance(sheet("100 metros (10 ATM), apto para nadar")), { atm: 10, meters: 100 });
  assert.deepEqual(waterResistance(sheet("200 metros (20 ATM), apto para buceo ligero")), { atm: 20, meters: 200 });
  assert.deepEqual(waterResistance(sheet("50 m")), { atm: 5, meters: 50 });
  assert.deepEqual(waterResistance(sheet("3 bar")), { atm: 3, meters: 30 });
  assert.equal(waterResistance(sheet("Sí")), null, "a line without a figure states nothing");
  assert.equal(waterResistance({ descriptionHtml: "<p>Movimiento: Cuarzo</p>" }), null);
  // Uses follow the table in the guide, and point to the brand off it.
  assert.match(waterUse(3), /no para nadar/);
  assert.match(waterUse(5), /natación/);
  assert.match(waterUse(20), /no para buceo con tanque/);
  assert.match(waterUse(30), /tabla de la marca/);
});

test("the water guide lists in-stock watches whose sheet states water resistance, or falls back to the hub", () => {
  for (const scenario of STOCK_SCENARIOS) {
    const guide = guideOf("waterResistance", scenario.guides);
    const store = sectionOf(guide, "relojes-en-smile");
    const table = store.blocks.find((block) => block.type === "table");
    const expected = scenario.inStock.filter((product) => isWatch(product) && specOf(product, "Resistencia al agua"));
    // The table explaining each rating never depends on the catalog.
    assert.equal(sectionOf(guide, "que-significa-cada-indicacion").blocks[0].rows.length, 5);
    if (expected.length === 0) {
      assert.equal(table, undefined, `${scenario.name}: no product table`);
      assert.match(stripLinks(store.answer), /ningún reloj con stock en Smile indica la resistencia al agua/);
      assert.ok(guideLinks(guide).includes("/tienda/relojes"), scenario.name);
      continue;
    }
    assert.match(stripLinks(store.answer), new RegExp(`^Hoy hay ${modelsPhrase(expected.length)} con stock`));
    const byHref = new Map(expected.map((product) => [productHref(product), product]));
    assert.equal(table.rows.length, Math.min(expected.length, CATALOG_LIST_LIMIT), scenario.name);
    for (const row of table.rows) {
      const product = byHref.get(tableHrefs({ rows: [row] })[0]);
      assert.ok(product, `${scenario.name}: lists a watch without a stated rating`);
      const { meters, atm } = waterResistance(product);
      // The rating is the sheet's own figure, and the use follows the guide's table.
      assert.ok(specOf(product, "Resistencia al agua").includes(String(meters)), product.name);
      assert.equal(row[1], `${meters} m (${atm} ATM)`);
      assert.equal(row[2], waterUse(atm));
    }
  }
});

test("without water-resistance specs on any sheet, the water guide falls back to the watches hub", () => {
  const stripped = catalog.map((product) => (isWatch(product) ? { ...product, descriptionHtml: "" } : product));
  const guide = guideOf("waterResistance", buildGuides({ ...context, catalog: stripped, inStock: stripped }));
  const store = sectionOf(guide, "relojes-en-smile");
  assert.ok(!store.blocks.some((block) => block.type === "table"), "no product table");
  assert.match(stripLinks(store.answer), /ningún reloj con stock en Smile indica la resistencia al agua/);
  assert.ok(!guideLinks(guide).some((href) => href.startsWith("/tienda/productos/")), "no product links");
  assertGuideRules(guide, "no specs");
});

test("the Invicta guide tabulates the Invicta watches in stock from their sheets, or points to the hub", () => {
  for (const scenario of STOCK_SCENARIOS) {
    const guide = guideOf("invictaOriginals", scenario.guides);
    const store = sectionOf(guide, "invicta-en-smile");
    const table = store.blocks.find((block) => block.type === "table");
    const expected = scenario.inStock.filter(isInvictaProduct);
    assert.ok(guideLinks(guide).includes("/tienda/marcas/invicta"), scenario.name);
    if (expected.length === 0) {
      assert.equal(table, undefined, `${scenario.name}: no product table`);
      assert.match(stripLinks(store.answer), /no hay relojes Invicta con stock/);
      continue;
    }
    assert.match(stripLinks(store.answer), new RegExp(`^Hoy hay ${modelsPhrase(expected.length)} de Invicta`));
    const byHref = new Map(expected.map((product) => [productHref(product), product]));
    assert.equal(table.rows.length, Math.min(expected.length, CATALOG_LIST_LIMIT), scenario.name);
    for (const row of table.rows) {
      const product = byHref.get(tableHrefs({ rows: [row] })[0]);
      assert.ok(product, `${scenario.name}: lists a watch that is not an Invicta in stock`);
      const movement = (specOf(product, "Movimiento") ?? "").toLowerCase();
      const expectedMovement = movement.includes("automático") ? "Automático" : movement.includes("cuarzo") ? "Cuarzo" : "Sin dato en la ficha";
      assert.equal(row[table.head.indexOf("Movimiento")], expectedMovement, product.name);
      const diameter = specOf(product, "Diámetro de la caja")?.match(/\d+/)?.[0];
      assert.equal(row[table.head.indexOf("Diámetro de la caja")], diameter ? `${diameter} mm` : "Sin dato en la ficha");
    }
  }
});

test("the Invicta line summary follows the movements on every Invicta sheet, in stock or not", () => {
  const movements = new Set(
    catalog
      .filter((product) => isInvictaProduct(product) && /pro diver/i.test(product.name))
      .map((product) => (specOf(product, "Movimiento") ?? "").toLowerCase())
      .map((movement) => (movement.includes("automático") ? "automático" : movement.includes("cuarzo") ? "cuarzo" : null))
      .filter(Boolean),
  );
  const text = guideText(guideOf("invictaOriginals", buildGuides({ ...context, inStock: [] })));
  if (movements.size === 2) assert.match(text, /la línea Pro Diver tiene modelos de cuarzo y automáticos/);
  else if (movements.has("cuarzo")) assert.match(text, /la línea Pro Diver tiene modelos de cuarzo/);
  else if (movements.has("automático")) assert.match(text, /la línea Pro Diver tiene modelos automáticos/);
  else assert.doesNotMatch(text, /la línea Pro Diver/);
});

test("the gift guide's budget table follows the stock and prices per brand and audience", () => {
  for (const scenario of STOCK_SCENARIOS) {
    const guide = guideOf("watchGift", scenario.guides);
    const budget = sectionOf(guide, "presupuesto");
    const table = budget.blocks.find((block) => block.type === "table");
    const watches = scenario.inStock.filter(isWatch);
    if (watches.length === 0) {
      assert.equal(table, undefined, `${scenario.name}: no price table`);
      assert.match(stripLinks(budget.answer), /no hay relojes con stock en Smile/);
      assert.ok(guideLinks(guide).includes("/tienda/relojes"), scenario.name);
      continue;
    }
    const watchesPhrase = `${watches.length} ${watches.length === 1 ? "reloj" : "relojes"}`;
    assert.match(stripLinks(budget.answer), new RegExp(`Hoy hay ${watchesPhrase} con stock en Smile`));
    const expectRow = (href, products) => {
      const row = table.rows.find((cells) => cells[0].includes(`](${href})`));
      assert.ok(row, `${scenario.name}: the table has a row for ${href}`);
      assert.equal(row[1], String(products.length), `${scenario.name}: ${href}`);
      const range = priceRange(products);
      const expected = products.length === 0 ? "Sin stock por el momento" : range ? pesosRange(range) : "Consultar por WhatsApp";
      assert.equal(row[2], expected, `${scenario.name}: ${href}`);
    };
    expectRow("/tienda/marcas/invicta", watches.filter((product) => product.brand === "Invicta"));
    expectRow("/tienda/marcas/tommy-hilfiger", watches.filter((product) => product.brand === "Tommy Hilfiger"));
    expectRow("/tienda/relojes/omega-swatch", watches.filter((product) => product.brand === "OMEGA x Swatch"));
    for (const hub of WATCH_AUDIENCE_HUBS) expectRow(hub.path, watches.filter(hub.matches));
  }
});

test("gift-guide prices are read from the catalog, not written in the guide", () => {
  const invicta = catalog.filter(isInvictaProduct);
  const rowOf = (inStock) =>
    sectionOf(guideOf("watchGift", buildGuides({ ...context, inStock })), "presupuesto")
      .blocks.find((block) => block.type === "table")
      .rows.find((cells) => cells[0].includes("](/tienda/marcas/invicta)"))[2];
  const doubled = repriced(invicta, 2);
  assert.equal(rowOf(invicta), pesosRange(priceRange(invicta)));
  assert.equal(rowOf(doubled), pesosRange(priceRange(doubled)));
  assert.notEqual(rowOf(doubled), rowOf(invicta));
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
  const relojes = read("app/tienda/relojes/page.tsx");
  for (const key of ["watchGift", "waterResistance", "invictaOriginals"]) {
    assert.match(relojes, new RegExp(`GUIDE_LINKS\\.${key}`), `/tienda/relojes links ${key}`);
  }
  assert.match(read("app/tienda/marcas/invicta/page.tsx"), /GUIDE_LINKS\.invictaOriginals/);
  for (const page of [
    "app/tienda/marcas/invicta/page.tsx",
    "app/tienda/marcas/tommy-hilfiger/page.tsx",
    "app/tienda/relojes/omega-swatch/page.tsx",
    "app/tienda/relojes/[audience]/page.tsx",
  ]) {
    assert.match(read(page), /GUIDE_LINKS\.watchGift/, page);
    assert.match(read(page), /GUIDE_LINKS\.waterResistance/, page);
  }
});
