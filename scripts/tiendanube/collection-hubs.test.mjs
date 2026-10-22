import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import {
  buildHubPage,
  COLLECTION_HUBS,
  countWords,
  isIndexableHub,
  MIN_INDEXABLE_PRODUCTS,
  RAY_BAN_MODEL_HUBS,
} from "../../lib/collection-hubs.mjs";
import { MAX_TITLE_LENGTH, TITLE_SUFFIX } from "../../lib/product-seo.mjs";
import {
  INSTALLMENTS_PHRASE,
  STORE_LOCATION,
  STORE_PICKUP_PHRASE,
  TRANSFER_DISCOUNT_PHRASE,
} from "../../lib/store-copy.mjs";

const projectRoot = process.cwd();
const catalog = JSON.parse(
  fs.readFileSync(path.join(projectRoot, "data/tiendanube-catalog.json"), "utf8"),
);

// Same rule as lib/catalog.ts (hasPurchasableStock).
const inStock = (product) =>
  product.variants.some(
    (variant) =>
      product.tiendanubeProductId !== null &&
      variant.id !== null &&
      variant.available &&
      variant.stock > 0,
  );

// Stand-ins for the app's formatter and brand directory (lib/format.ts,
// lib/brand-directory.ts), which node:test cannot import.
const priceFormat = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 0,
});
const context = {
  formatPrice: (value) => priceFormat.format(value),
  brandLabel: (brand) => brand.trim(),
  displayName: (product) => product.name,
};

const model = (slug) => RAY_BAN_MODEL_HUBS.find((hub) => hub.slug === slug);
const names = (hub) => catalog.filter(hub.matches).map((product) => product.name);

function pageOf(hub, products = catalog) {
  const matched = products.filter(hub.matches);
  const parent = products.filter(hub.inParent);
  return buildHubPage(
    hub,
    {
      inStock: matched.filter(inStock),
      outOfStock: matched.filter((product) => !inStock(product)),
      parentInStock: parent.filter(inStock),
      parentCatalog: parent,
    },
    context,
  );
}

/** The catalog with every product of the hub sold out. */
function soldOut(hub) {
  return catalog.map((product) =>
    hub.matches(product)
      ? { ...product, variants: product.variants.map((variant) => ({ ...variant, stock: 0, available: false })) }
      : product,
  );
}

test("Ray-Ban model hubs match model names only, across catalog spellings", () => {
  assert.deepEqual(
    Object.fromEntries(RAY_BAN_MODEL_HUBS.map((hub) => [hub.slug, names(hub).length])),
    // Catalog products, in stock or not; the hourly sync never adds or drops products.
    { aviador: 4, wayfarer: 7, round: 13, hexagonal: 9, erika: 5 },
  );

  for (const hub of RAY_BAN_MODEL_HUBS) {
    const words = hub.slug === "aviador" ? /\b(aviador|aviator)\b/i : new RegExp(`\\b${hub.slug}\\b`, "i");
    for (const product of catalog.filter(hub.matches)) {
      assert.match(product.name, words, `${product.name} is not a Ray-Ban ${hub.name}`);
      assert.match(`${product.brand} ${product.categories.join(" ")}`, /ray\s?ban/i);
    }
  }

  // "Aviator" spelling and an all-caps name.
  assert.ok(names(model("aviador")).includes("Aviator Outdoorsman Craft 3422"));
  assert.ok(names(model("wayfarer")).includes("RAY BAN WAYFARER FOLDING 4105"));
  // Filed under another category in Tiendanube.
  assert.ok(names(model("erika")).includes("Erika Polarizado 4171"));
  // Whole words only, Ray-Ban only, names only.
  assert.ok(!names(model("round")).includes("Roundabout 2192"));
  assert.ok(!names(model("wayfarer")).includes("Saint Laurent Wayfarer SL"));
  assert.ok(!names(model("hexagonal")).some((name) => /octa?gonal/i.test(name)));
  assert.ok(!names(model("aviador")).includes("Blaze Shooter 3581"), "filed under AVIADOR, named Shooter");
});

test("a Scuderia Ferrari Hexagonal is in both the Hexagonal and the Ferrari hubs", () => {
  const ferrariHexagonal = catalog.filter(
    (product) => model("hexagonal").matches(product) && /ferrari/i.test(product.categories.join(" ")),
  );
  assert.ok(ferrariHexagonal.length >= 2);
  assert.ok(ferrariHexagonal.some(inStock));
});

test("hubs are indexed by catalog count, so stock changes never flip them", () => {
  assert.equal(MIN_INDEXABLE_PRODUCTS, 3);
  assert.equal(isIndexableHub(2), false);
  assert.equal(isIndexableHub(3), true);

  for (const hub of COLLECTION_HUBS) {
    const page = pageOf(hub);
    const sold = pageOf(hub, soldOut(hub));
    assert.equal(page.catalogCount, catalog.filter(hub.matches).length);
    assert.equal(page.indexable, page.catalogCount >= MIN_INDEXABLE_PRODUCTS);
    assert.equal(sold.indexable, page.indexable, `${hub.path} flips index state when sold out`);
    assert.equal(page.indexable, true, `${hub.path} has too few catalog products`);
  }

  // A model with two catalog products is noindex, in stock or not.
  const two = new Set(catalog.filter(model("aviador").matches).slice(0, 2).map((product) => product.id));
  const tiny = { ...model("aviador"), matches: (product) => two.has(product.id) };
  assert.equal(pageOf(tiny).indexable, false);
});

test("a hub with nothing in stock says so and suggests in-stock alternatives", () => {
  for (const hub of COLLECTION_HUBS) {
    const page = pageOf(hub, soldOut(hub));
    const text = [page.intro, ...page.faqs.map((faq) => faq.answer)].join(" ");
    assert.match(page.intro, /Por el momento no hay unidades disponibles/, hub.path);
    assert.doesNotMatch(text, /\b0 modelos?\b|desde \$?\s*0\b|NaN|undefined/, hub.path);
    assert.ok(countWords(page.intro) >= 60 && countWords(page.intro) <= 120, `${hub.path} intro length`);
    assert.ok(page.alternatives.length > 0, `${hub.path} suggests alternatives`);
    assert.ok(page.alternatives.every((product) => inStock(product) && !hub.matches(product)));
  }
});

test("hubs with enough stock suggest no alternatives; one in stock reads naturally", () => {
  for (const hub of COLLECTION_HUBS) {
    const stocked = catalog.filter((product) => hub.matches(product) && inStock(product)).length;
    assert.equal(pageOf(hub).alternatives.length === 0, stocked >= 3, hub.path);
  }

  const hub = RAY_BAN_MODEL_HUBS.find((entry) => catalog.some((p) => entry.matches(p) && inStock(p)));
  const first = catalog.find((product) => hub.matches(product) && inStock(product));
  const onlyOne = catalog.map((product) =>
    hub.matches(product) && product !== first
      ? { ...product, variants: product.variants.map((variant) => ({ ...variant, stock: 0 })) }
      : product,
  );
  const page = pageOf(hub, onlyOne);
  assert.match(page.intro, /En Smile hay 1 modelo de/);
  assert.match(page.faqs[0].answer, /^El único modelo de/);
  assert.ok(page.alternatives.length > 0);
});

test("every new hub has its own title, description and H1 within SEO limits", () => {
  const pages = COLLECTION_HUBS.map((hub) => ({ hub, page: pageOf(hub) }));
  for (const field of ["title", "h1", "path"]) {
    const values = COLLECTION_HUBS.map((hub) => hub[field]);
    assert.equal(new Set(values).size, values.length, `duplicate ${field}`);
  }
  const descriptions = pages.map(({ page }) => page.description);
  assert.equal(new Set(descriptions).size, descriptions.length, "duplicate description");

  for (const { hub, page } of pages) {
    assert.ok(`${hub.title}${TITLE_SUFFIX}`.length <= MAX_TITLE_LENGTH, `${hub.path} title too long`);
    assert.ok(
      page.description.length >= 140 && page.description.length <= 155,
      `${hub.path} description is ${page.description.length} characters`,
    );
    assert.ok(page.description.startsWith(hub.descriptionLeads[0]), `${hub.path} lost its lead`);

    const words = countWords(page.intro);
    assert.ok(words >= 60 && words <= 120, `${hub.path} intro has ${words} words`);
    assert.ok(page.intro.includes(INSTALLMENTS_PHRASE) && page.intro.includes(TRANSFER_DISCOUNT_PHRASE));
    assert.equal(page.intro.split(STORE_LOCATION.locality).length - 1, 1, `${hub.path} names the city once`);

    assert.ok(page.faqs.length >= 3 && page.faqs.length <= 4, `${hub.path} has ${page.faqs.length} FAQs`);
    for (const faq of page.faqs) assert.match(faq.question, /^¿.+\?$/);
    // Unconfirmed store terms stay out of the hub copy, and the pickup point
    // is not a storefront: no address, opening hours or "local".
    const text = [page.intro, ...page.faqs.map((faq) => faq.answer)].join(" ");
    assert.doesNotMatch(text, /garant[ií]a|env[ií]os? gratis|devoluci[oó]n|monto m[ií]nimo/i, hub.path);
    assert.doesNotMatch(text, /\blocal\b|showroom|horario|direcci[oó]n/i, hub.path);
    assert.equal(page.intro.split(STORE_PICKUP_PHRASE).length - 1, 1, `${hub.path} mentions pickup once`);

    const pickup = page.faqs.find((faq) => faq.question === `¿Puedo retirar en ${STORE_LOCATION.locality}?`);
    assert.ok(pickup?.answer.includes(STORE_PICKUP_PHRASE), `${hub.path} answers the pickup question`);
    assert.match(pickup.answer, /envíos a todo el país/);
  }
});

test("hub routes render one H1 and list only indexable hubs", () => {
  const read = (relativePath) => fs.readFileSync(path.join(projectRoot, relativePath), "utf8");
  for (const route of ["app/tienda/marcas/ray-ban/[model]/page.tsx"]) {
    const source = read(route);
    assert.equal((source.match(/<HubHeader\b|<h1\b/g) ?? []).length, 1, `${route} must render one H1`);
    assert.match(source, /hubMetadata\(/, `${route} must use hubMetadata (canonical + robots)`);
    assert.match(source, /dynamicParams = false/);
  }
  assert.match(read("app/sitemap.ts"), /indexableHubs\(\)/);
  assert.match(read("app/llms.txt/route.ts"), /indexableHubs\(\)/);
});
