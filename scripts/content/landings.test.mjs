import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { publishedOnly } from "../../lib/catalog-published.mjs";
import {
  AUDIENCE_HUBS,
  COLLECTION_HUBS,
  isIndexableHub,
  isSunglassesProduct,
  priceRange,
} from "../../lib/collection-hubs.mjs";
import { buildGuides, GUIDES_INDEX, isPolarizedProduct, stripLinks } from "../../lib/guides/guides.mjs";
import {
  buildLandings,
  giftBands,
  isOnSale,
  LANDING_GRID_LIMIT,
  landingHrefs,
  landingLinks,
  LANDING_PATHS,
  landingText,
  MIN_BEST_SELLERS,
  saleProducts,
  SUMMER_DATES,
  summerLanding,
  summerSeason,
} from "../../lib/landings/landings.mjs";
import { formatPrice } from "../../lib/price-format.mjs";
import { MAX_TITLE_LENGTH, META_DESCRIPTION_MAX_LENGTH, META_DESCRIPTION_MIN_LENGTH, TITLE_SUFFIX } from "../../lib/product-seo.mjs";
import {
  FREE_SHIPPING_PHRASE,
  INSTALLMENTS_PHRASE,
  STORE_PICKUP_PHRASE,
  TRANSFER_DISCOUNT_PHRASE,
} from "../../lib/store-copy.mjs";
import { PICKUP_FAQ_ANSWER, RETURNS_FAQ_ANSWER } from "../../lib/store-faqs.mjs";
import { FREE_SHIPPING_MINIMUM_ARS, getTransferPrice } from "../../lib/storefront.mjs";

// The hourly sync runs these tests before it publishes stock and price
// updates: every expectation is derived from the catalog the test reads, and
// the rules are checked for many stock scenarios built from it.

const projectRoot = process.cwd();
const read = (relativePath) => fs.readFileSync(path.join(projectRoot, relativePath), "utf8");
const catalog = publishedOnly(JSON.parse(read("data/tiendanube-catalog.json")));

// Same rule as hasPurchasableStock in lib/catalog.ts.
const isPurchasable = (product) =>
  product.variants.some(
    (variant) =>
      product.tiendanubeProductId !== null && variant.id !== null && variant.available && variant.stock > 0,
  );
// lib/brand-directory canonicalBrand, for the brands the catalog spells several ways.
const brandLabel = (brand) => (/^ray\s*-?\s*ban$/i.test(brand.trim()) ? "Ray-Ban" : brand.trim());
const brandHref = (brand) => (brand === "Ray-Ban" ? "/tienda/marcas/ray-ban" : null);
const SUNGLASSES_AUDIENCE_HUBS = AUDIENCE_HUBS.filter((hub) => hub.kind === "sunglasses");
const NOVEMBER = new Date("2026-11-10T15:00:00Z");

const context = {
  inStock: catalog.filter(isPurchasable),
  brandLabel,
  brandHref,
  audienceHubs: [],
  date: NOVEMBER,
};

function seeded(seed) {
  let state = seed;
  return () => {
    state = (state * 1103515245 + 12345) % 2 ** 31;
    return state / 2 ** 31;
  };
}

const repriced = (products, factor) =>
  products.map((product) => ({
    ...product,
    price: product.price === null ? null : Math.round(product.price * factor),
    promotionalPrice: product.promotionalPrice === null ? null : Math.round(product.promotionalPrice * factor),
  }));

/** The products without any promotional price, on the product or its variants. */
const withoutPromotions = (products) =>
  products.map((product) => ({
    ...product,
    promotionalPrice: null,
    variants: product.variants.map((variant) => ({ ...variant, promotionalPrice: null })),
  }));

const STOCK_SCENARIOS = [
  ["the current stock", context.inStock],
  ["nothing in stock", []],
  ["everything in stock", catalog],
  ["no sunglasses in stock", context.inStock.filter((product) => !isSunglassesProduct(product))],
  ["one pair of sunglasses in stock", context.inStock.filter(isSunglassesProduct).slice(0, 1)],
  ["new prices", repriced(context.inStock, 1.37)],
  ["no promotions", withoutPromotions(context.inStock)],
  ...Array.from({ length: 15 }, (_, index) => {
    const random = seeded(index + 1);
    const share = random();
    return [`random stock #${index + 1}`, catalog.filter(() => random() < share)];
  }),
].map(([name, inStock]) => ({ name, inStock, landings: buildLandings({ ...context, inStock }) }));

const rosarioOf = (landings) => landings.find((landing) => landing.key === "rosario");
const summerOf = (landings) => landings.find((landing) => landing.key === "summer");
const sectionOf = (landing, id) => landing.sections.find((section) => section.id === id);
const sunglassesIn = (products) => products.filter(isSunglassesProduct);

/** Everything a visitor or a crawler reads on the page, links stripped. */
function pageText(landing) {
  return [
    landing.title,
    landing.description,
    landing.summary,
    landingText(landing),
    ...(landing.priceBlock ? [landing.priceBlock.heading, ...landing.priceBlock.facts.flatMap((fact) => [fact.label, fact.value])] : []),
    ...landing.links.map((entry) => entry.label),
    ...landing.sections.flatMap((section) => section.items.map((item) => item.label)),
  ]
    .map(stripLinks)
    .join("\n");
}

// No storefront, address or opening hours; no official, authorized or
// certified status; no warranty; no same-day or local delivery.
const FORBIDDEN =
  /\blocal(es)?\b|showroom|sucursal|vis[ií]tanos|horario|direcci[oó]n|\bcalle\b|avenida|oficial|autorizad|distribuidor|certificad|garant[ií]a|[uú]nica tienda|mismo d[ií]a|en el d[ií]a|en el acto/i;

test("titles fit 60 characters with the suffix, and H1s name what the queries ask", () => {
  for (const scenario of STOCK_SCENARIOS) {
    for (const landing of scenario.landings) {
      const title = `${landing.title}${TITLE_SUFFIX}`;
      assert.ok(title.length <= MAX_TITLE_LENGTH, `${title} is ${title.length} characters`);
    }
    const rosario = rosarioOf(scenario.landings);
    assert.match(rosario.title, /Rosario/);
    assert.match(rosario.h1, /anteojos/i);
    assert.match(rosario.h1, /lentes de sol/i);
    assert.match(rosario.h1, /Rosario/);
    const summer = summerOf(scenario.landings);
    assert.ok(summer.title.includes(summer.season.label), summer.title);
    assert.ok(summer.h1.includes(summer.season.label), summer.h1);
  }
  // Any year keeps the summer title within the limit.
  for (const year of [2026, 2030, 2099]) {
    const summer = summerLanding({ ...context, date: new Date(`${year}-01-15T12:00:00Z`) });
    assert.ok(`${summer.title}${TITLE_SUFFIX}`.length <= MAX_TITLE_LENGTH, summer.title);
  }
});

test("meta descriptions are one sentence within 155 characters, 140 or more with stock", () => {
  for (const scenario of STOCK_SCENARIOS) {
    for (const landing of scenario.landings) {
      const { description } = landing;
      const where = `${landing.path} (${scenario.name})`;
      assert.ok(description.length <= META_DESCRIPTION_MAX_LENGTH, `${where}: ${description.length}`);
      assert.match(description, /\.$/, where);
      assert.doesNotMatch(description.slice(0, -1), /\.\s+\p{Lu}/u, `${where}: one sentence: ${description}`);
      const sunglasses = sunglassesIn(scenario.inStock);
      if (sunglasses.length > 1 && priceRange(sunglasses)) {
        assert.ok(description.length >= META_DESCRIPTION_MIN_LENGTH, `${where}: ${description.length}`);
        // fitDescription() collapses the formatter's non-breaking space.
        const lowest = formatPrice(priceRange(sunglasses).min).replace(/\s+/g, " ");
        assert.ok(description.includes(lowest), `${where}: ${description}`);
        assert.ok(description.includes(`${sunglasses.length} modelos`), `${where}: ${description}`);
      }
    }
  }
});

test("the copy makes no storefront, official, warranty or delivery-time claim, whatever the stock", () => {
  for (const scenario of STOCK_SCENARIOS) {
    for (const landing of scenario.landings) {
      const text = pageText(landing);
      const where = `${landing.path} (${scenario.name})`;
      assert.doesNotMatch(text, FORBIDDEN, where);
      // Returns: only the published answer, word for word.
      assert.doesNotMatch(text.split(RETURNS_FAQ_ANSWER).join(" "), /devoluci[oó]n|reembolso/i, where);
      // No health promise in the UV copy.
      assert.doesNotMatch(text, /\bsalud\b|\bprevien|\bcura\b|m[eé]dic/i, where);
    }
  }
});

test("store terms come from the shared phrases, and no landing source writes them or a price", () => {
  for (const scenario of STOCK_SCENARIOS) {
    for (const landing of scenario.landings) {
      const text = landingText(landing);
      for (const phrase of [INSTALLMENTS_PHRASE, TRANSFER_DISCOUNT_PHRASE, FREE_SHIPPING_PHRASE, STORE_PICKUP_PHRASE]) {
        assert.ok(text.includes(phrase), `${landing.path} (${scenario.name}) does not state "${phrase}"`);
      }
    }
    const rosario = rosarioOf(scenario.landings);
    assert.ok(rosario.lead.includes(STORE_PICKUP_PHRASE), scenario.name);
  }
  const sources = fs
    .readdirSync(path.join(projectRoot, "lib/landings"))
    .filter((file) => file.endsWith(".mjs"))
    .map((file) => `lib/landings/${file}`);
  for (const file of [...sources, "lib/landing-pages.ts", "components/landings/LandingPage.tsx"]) {
    const source = read(file);
    assert.doesNotMatch(source, /\d+\s*cuotas|cuotas sin inter/i, file);
    assert.doesNotMatch(source, /\d\s*%/, file);
    assert.doesNotMatch(source, /\$\s?\d/, file);
    assert.doesNotMatch(source, /env[ií]os? gratis/i, file);
    assert.doesNotMatch(source, /Puerto Norte/, file);
    // Structured data: no LocalBusiness node, street address or opening hours.
    assert.doesNotMatch(source, /"LocalBusiness"|streetAddress|openingHours/, file);
  }
});

test("the price block and figures come from the sunglasses in stock, and vanish without them", () => {
  for (const scenario of STOCK_SCENARIOS) {
    const sunglasses = sunglassesIn(scenario.inStock);
    const range = priceRange(sunglasses);
    for (const landing of scenario.landings) {
      const where = `${landing.path} (${scenario.name})`;
      if (!range) {
        assert.equal(landing.priceBlock, null, where);
        assert.equal(landing.products.length, 0, where);
        assert.doesNotMatch(landingText(landing).split(FREE_SHIPPING_PHRASE).join(" "), /\$/, `${where}: a price without stock`);
        continue;
      }
      const [prices, transfer, installments] = landing.priceBlock.facts;
      const expected = range.min === range.max ? formatPrice(range.min) : `${formatPrice(range.min)} a ${formatPrice(range.max)}`;
      assert.equal(prices.value, expected, where);
      assert.ok(transfer.value.startsWith(formatPrice(getTransferPrice(range.min))), where);
      assert.ok(installments.value.startsWith(INSTALLMENTS_PHRASE), where);
      assert.ok(landing.lead.includes(formatPrice(range.min)), where);
    }
  }
});

test("the Rosario price table has a row per brand in stock, with that brand's range", () => {
  for (const scenario of STOCK_SCENARIOS) {
    const sunglasses = sunglassesIn(scenario.inStock);
    const section = sectionOf(rosarioOf(scenario.landings), "precios-por-marca");
    const table = section.blocks.find((block) => block.type === "table");
    if (sunglasses.length === 0) {
      assert.equal(table, undefined, scenario.name);
      continue;
    }
    const counted = table.rows.reduce((sum, row) => sum + Number(row[1]), 0);
    assert.equal(counted, sunglasses.length, scenario.name);
    for (const row of table.rows) {
      const brand = stripLinks(row[0]);
      const products = sunglasses.filter((product) => brandLabel(product.brand) === brand);
      assert.equal(row[1], String(products.length), `${scenario.name}: ${brand}`);
      const range = priceRange(products);
      const expected = !range
        ? "Consultar"
        : range.min === range.max
          ? formatPrice(range.min)
          : `${formatPrice(range.min)} a ${formatPrice(range.max)}`;
      assert.equal(row[2], expected, `${scenario.name}: ${brand}`);
    }
    // A brand with a page links to it (brandHref).
    const rayBan = sunglasses.some((product) => brandLabel(product.brand) === "Ray-Ban");
    assert.equal(table.rows.some((row) => row[0] === "[Ray-Ban](/tienda/marcas/ray-ban)"), rayBan, scenario.name);
  }
});

test("product grids show in-stock sunglasses only, at most LANDING_GRID_LIMIT each", () => {
  for (const scenario of STOCK_SCENARIOS) {
    const inStock = new Set(sunglassesIn(scenario.inStock).map((product) => product.id));
    for (const landing of scenario.landings) {
      for (const section of landing.sections) {
        assert.ok(section.items.length <= LANDING_GRID_LIMIT, `${landing.path} / ${section.id}`);
        for (const { product, label } of section.items) {
          assert.ok(inStock.has(product.id), `${landing.path} / ${section.id}: ${product.name} is not in stock`);
          assert.ok(label.trim(), `${landing.path} / ${section.id}: card label`);
        }
      }
      const ids = landing.products.map((product) => product.id);
      assert.equal(new Set(ids).size, ids.length, `${landing.path}: the ItemList repeats a product`);
    }
  }
});

test("the Rosario FAQ answers the local questions, with the shared pickup answer", () => {
  for (const scenario of STOCK_SCENARIOS) {
    for (const landing of scenario.landings) {
      assert.ok(landing.faqs.length >= 4 && landing.faqs.length <= 6, `${landing.path}: ${landing.faqs.length} FAQs`);
      const questions = landing.faqs.map((faq) => faq.question);
      assert.equal(new Set(questions).size, questions.length, landing.path);
      for (const faq of landing.faqs) {
        assert.match(faq.question, /^¿.+\?$/, faq.question);
        assert.doesNotMatch(faq.answer, /\]\(/, `${faq.question}: FAQ answers are plain text`);
      }
    }
    const rosario = rosarioOf(scenario.landings);
    const asked = (pattern) => rosario.faqs.find((faq) => pattern.test(faq.question));
    assert.ok(asked(/^¿Dónde comprar anteojos de sol en Rosario\?$/), scenario.name);
    assert.ok(asked(/^¿Cuánto cuestan/), scenario.name);
    assert.equal(asked(/retirar en Rosario/)?.answer, PICKUP_FAQ_ANSWER, scenario.name);
    assert.ok(asked(/originales\?$/), scenario.name);
  }
});

// Indexable hubs count every catalog product, in stock or not.
const knownPaths = new Set([
  ...COLLECTION_HUBS.filter((hub) => isIndexableHub(catalog.filter(hub.matches).length)).map((hub) => hub.path),
  ...SUNGLASSES_AUDIENCE_HUBS.map((hub) => hub.path),
  "/tienda/marcas/ray-ban",
  "/tienda/marcas/premium",
  ...buildGuides({ catalog, inStock: context.inStock, displayName: (product) => product.name }).map((guide) => guide.path),
  GUIDES_INDEX.path,
  "/guia-de-estilo",
  ...Object.values(LANDING_PATHS),
]);

test("internal links resolve; audience hubs are linked only while indexed", () => {
  for (const audienceHubs of [[], SUNGLASSES_AUDIENCE_HUBS]) {
    for (const landing of buildLandings({ ...context, audienceHubs })) {
      const hrefs = [...landingHrefs(landing), ...landing.links.map((entry) => entry.href)];
      for (const href of hrefs) assert.ok(knownPaths.has(href.split("#")[0]), `${landing.path} links to unknown ${href}`);
      for (const hub of SUNGLASSES_AUDIENCE_HUBS) {
        assert.equal(hrefs.includes(hub.path), audienceHubs.length > 0, `${landing.path} and ${hub.path}`);
      }
    }
  }
  const rosario = rosarioOf(buildLandings(context));
  const rosarioHrefs = new Set([...landingHrefs(rosario), ...rosario.links.map((entry) => entry.href)]);
  for (const href of [
    "/tienda/marcas/ray-ban",
    "/guias/anteojos-polarizados-que-son-y-cuando-conviene",
    "/guias/donde-comprar-ray-ban-originales-en-rosario",
    "/guias/como-saber-si-unos-ray-ban-son-originales",
    LANDING_PATHS.summer,
  ]) {
    assert.ok(rosarioHrefs.has(href), `the Rosario page links ${href}`);
  }
  const summer = summerOf(buildLandings(context));
  const summerHrefs = new Set([...landingHrefs(summer), ...summer.links.map((entry) => entry.href)]);
  for (const href of ["/guias/anteojos-polarizados-que-son-y-cuando-conviene", LANDING_PATHS.rosario]) {
    assert.ok(summerHrefs.has(href), `the summer page links ${href}`);
  }
});

test("the season label rolls over on 1 July, Argentina time, and the Christmas angle runs 1 October to 25 December", () => {
  const cases = [
    // [UTC instant, year, christmas, since]
    ["2026-06-30T12:00:00Z", 2026, false, "2025-12-26"],
    // 02:00 UTC on 1 July is still 30 June in Argentina (UTC-3).
    ["2026-07-01T02:00:00Z", 2026, false, "2025-12-26"],
    ["2026-07-01T03:00:00Z", 2027, false, "2026-07-01"],
    ["2026-09-30T15:00:00Z", 2027, false, "2026-07-01"],
    ["2026-10-01T15:00:00Z", 2027, true, "2026-10-01"],
    ["2026-11-10T15:00:00Z", 2027, true, "2026-10-01"],
    ["2026-12-25T15:00:00Z", 2027, true, "2026-10-01"],
    ["2026-12-26T15:00:00Z", 2027, false, "2026-12-26"],
    ["2027-01-15T15:00:00Z", 2027, false, "2026-12-26"],
    ["2027-06-30T15:00:00Z", 2027, false, "2026-12-26"],
    ["2027-07-01T15:00:00Z", 2028, false, "2027-07-01"],
  ];
  for (const [instant, year, christmas, since] of cases) {
    assert.deepEqual(summerSeason(new Date(instant)), { year, label: `verano ${year}`, christmas, since }, instant);
  }
});

test("the summer page follows its season: label, gift heading, dateModified and the footer link", () => {
  for (const [instant, christmas] of [
    ["2026-11-10T15:00:00Z", true],
    ["2027-02-10T15:00:00Z", false],
    ["2027-08-10T15:00:00Z", false],
  ]) {
    const date = new Date(instant);
    const season = summerSeason(date);
    const summer = summerLanding({ ...context, date });
    assert.equal(summer.season.label, season.label);
    assert.equal(summer.crumb, `Verano ${season.year}`);
    assert.equal(landingLinks(date).summer.label, `Anteojos de sol ${season.label}`);
    assert.equal(summer.linkLabel, landingLinks(date).summer.label);
    const gifts = sectionOf(summer, "para-regalar");
    assert.equal(/Navidad/.test(gifts.heading), christmas, `${instant}: ${gifts.heading}`);
    assert.equal(/Navidad/.test(landingText(summer)), christmas, instant);
    assert.equal(summer.dateModified, season.since > SUMMER_DATES.modified ? season.since : SUMMER_DATES.modified);
    assert.ok(summer.dateModified >= summer.datePublished, instant);
  }
});

test("offers show only while a card shows a promotional price, the largest reduction first", () => {
  for (const scenario of STOCK_SCENARIOS) {
    const sunglasses = sunglassesIn(scenario.inStock);
    const sale = saleProducts(sunglasses);
    const summer = summerOf(scenario.landings);
    const section = sectionOf(summer, "ofertas");
    const faq = summer.faqs.find((entry) => /oferta/.test(entry.question));
    if (sale.length === 0) {
      assert.equal(section, undefined, scenario.name);
      assert.equal(faq, undefined, scenario.name);
      assert.doesNotMatch(pageText(summer), /oferta|promoci/i, scenario.name);
      continue;
    }
    assert.ok(section.answer.includes(`${sale.length} ${sale.length === 1 ? "modelo" : "modelos"}`), scenario.name);
    assert.deepEqual(
      section.items.map((item) => item.product.id),
      sale.slice(0, LANDING_GRID_LIMIT).map((product) => product.id),
      scenario.name,
    );
    for (const { product } of section.items) assert.ok(isOnSale(product), product.name);
    assert.ok(faq, scenario.name);
  }
  assert.equal(saleProducts(withoutPromotions(context.inStock)).length, 0);
});

test("best sellers head the summer page only when the ranking names enough of them", () => {
  const sunglasses = sunglassesIn(context.inStock);
  const fallback = summerLanding({ ...context, bestSellers: [] });
  assert.ok(fallback.sections[0], "a first section");
  assert.notEqual(fallback.sections[0].id, "los-mas-elegidos");
  // Without sales data the page never claims popularity.
  assert.doesNotMatch(pageText(fallback), /m[aá]s elegid|m[aá]s vendid|populares|tendencia (de|del|en) 20/i);

  const ranked = [...sunglasses].reverse().slice(0, MIN_BEST_SELLERS + 2);
  const withRanking = summerLanding({ ...context, bestSellers: ranked });
  assert.equal(withRanking.sections[0].id, "los-mas-elegidos");
  assert.deepEqual(
    withRanking.sections[0].items.map((item) => item.product.id),
    ranked.slice(0, LANDING_GRID_LIMIT).map((product) => product.id),
  );
  const tooFew = summerLanding({ ...context, bestSellers: ranked.slice(0, MIN_BEST_SELLERS - 1) });
  assert.notEqual(tooFew.sections[0].id, "los-mas-elegidos");
});

test("polarized and UV copy follow the sheets: counts of named polarized models and of stated UV protection", () => {
  for (const scenario of STOCK_SCENARIOS) {
    const sunglasses = sunglassesIn(scenario.inStock);
    const summer = summerOf(scenario.landings);
    const polarized = sunglasses.filter(isPolarizedProduct);
    const section = sectionOf(summer, "polarizados-para-playa-y-ruta");
    if (polarized.length > 0) {
      const phrase = polarized.length === 1 ? "1 modelo polarizado" : `${polarized.length} modelos polarizados`;
      assert.ok(section.answer.includes(phrase), `${scenario.name}: ${section.answer}`);
    }
    for (const { product } of section.items) assert.ok(isPolarizedProduct(product), product.name);
    assert.match(sectionOf(summer, "proteccion-uv").answer, /UV400/);
  }
});

test("gift bands split at the synced free-shipping minimum and add up to the sunglasses in stock", () => {
  for (const scenario of STOCK_SCENARIOS) {
    const sunglasses = sunglassesIn(scenario.inStock);
    const bands = giftBands(sunglasses, { minimumArs: FREE_SHIPPING_MINIMUM_ARS, brandLabel });
    assert.equal(
      bands.reduce((sum, band) => sum + band.count, 0),
      sunglasses.filter((product) => priceRange([product])).length,
      scenario.name,
    );
    for (const band of bands) assert.deepEqual(band.range, priceRange(band.products));
  }
  const all = giftBands(sunglassesIn(context.inStock), { minimumArs: 0, brandLabel });
  assert.ok(all.length <= 1);
});

test("both pages are routed, wired into the sitemap, llms.txt, the footer, the home and the sunglasses hub", () => {
  for (const pathname of Object.values(LANDING_PATHS)) {
    const route = `app${pathname}/page.tsx`;
    assert.ok(fs.existsSync(path.join(projectRoot, route)), route);
    assert.doesNotMatch(pathname, /^\/tienda\/anteojos-de-sol\//, "no collision with the audience route");
  }
  const sitemap = read("app/sitemap.ts");
  assert.match(sitemap, /LANDINGS\.map\(/);
  assert.match(sitemap, /lastModified: landing\.dateModified/);
  assert.match(read("lib/llms-hubs.ts"), /LANDINGS\.map\(/);
  for (const file of ["components/layout/Footer.tsx", "app/page.tsx", "app/tienda/anteojos-de-sol/page.tsx"]) {
    const source = read(file);
    assert.match(source, /landingLinks\(\)/, file);
    assert.match(source, /landings\.rosario/, file);
    assert.match(source, /landings\.summer/, file);
  }
  assert.match(read("lib/guides/ray-ban-rosario.mjs"), /link\("anteojos de sol en Rosario", LANDING_PATHS\.rosario\)/);
});
