import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { publishedOnly } from "../../lib/catalog-published.mjs";
import { storeViewProducts } from "../../lib/home-catalog.mjs";
import {
  CATALOG_ANCHOR,
  CATALOG_QUERY_PARAM,
  MIN_QUERY_LENGTH,
  RESULT_LIMIT,
  canSuggest,
  catalogSearchHref,
  clampHighlight,
  enterAction,
  featuredSearchProducts,
  moveHighlight,
  optionCountFor,
  resultCountLabel,
  searchFromAddress,
  searchPanel,
  seeAllResultsLabel,
} from "../../lib/search-overlay.mjs";
import { carouselSlides, isWatch } from "../../lib/storefront.mjs";

const projectRoot = process.cwd();
const read = (relativePath) => fs.readFileSync(path.join(projectRoot, relativePath), "utf8");

const item = (slug) => ({ slug });
const slugs = (list) => list.map((entry) => entry.slug);

// ── Featured products ────────────────────────────────────────────────────────

test("featured products alternate hero slides and featured watches, a slide first", () => {
  const products = ["s1", "s2", "s3", "w1", "w2", "w3", "x1"].map(item);
  const featured = featuredSearchProducts(products, {
    slides: ["s1", "s2", "s3"].map(item),
    watches: ["w1", "w2", "w3"].map(item),
  });

  assert.equal(RESULT_LIMIT, 6);
  assert.deepEqual(slugs(featured), ["s1", "w1", "s2", "w2", "s3", "w3"]);
  assert.equal(featured[0], products[0], "returns the list's own entries");
});

test("featured products skip repeats and anything outside the store list", () => {
  const products = ["s1", "s2", "w1", "w2", "x1", "x2", "x3"].map(item);
  const featured = featuredSearchProducts(products, {
    slides: ["s1", "unpublished", "s2", "s1"].map(item),
    watches: ["w1", "s2", "w2"].map(item),
  });

  assert.deepEqual(slugs(featured), ["s1", "w1", "s2", "w2", "x1", "x2"]);
});

test("too few highlights are topped up in catalog order", () => {
  const products = ["a", "b", "c", "d", "e", "f", "g"].map(item);

  assert.deepEqual(slugs(featuredSearchProducts(products, { slides: [item("d")] })), ["d", "a", "b", "c", "e", "f"]);
  assert.deepEqual(slugs(featuredSearchProducts(products)), ["a", "b", "c", "d", "e", "f"]);
  assert.deepEqual(slugs(featuredSearchProducts(products.slice(0, 2), { watches: [item("b")] })), ["b", "a"]);
  assert.deepEqual(featuredSearchProducts([], { slides: [item("a")] }), []);
});

test("from the real catalog: six published products, sunglasses and watches", () => {
  const catalog = JSON.parse(read("data/tiendanube-catalog.json"));
  const products = publishedOnly(catalog).map((product) => ({ ...product, image: product.images[0] ?? null }));
  const unpublished = catalog.find((product) => product.published === false);
  const slides = carouselSlides(storeViewProducts(products, "lentes"));
  const featured = featuredSearchProducts(products, {
    slides: unpublished ? [unpublished, ...slides] : slides,
    watches: products.filter(isWatch),
  });

  assert.equal(featured.length, RESULT_LIMIT);
  assert.ok(featured.every((product) => product.published !== false));
  assert.ok(featured.some(isWatch) && featured.some((product) => !isWatch(product)));
});

// ── Featured products or results ────────────────────────────────────────────

const featuredRows = ["f1", "f2", "f3", "f4", "f5", "f6", "f7"].map(item);
const products = [
  { slug: "a", name: "Wayfarer Reverse", brand: "Ray Ban", categories: ["LENTES DE SOL"] },
  { slug: "b", name: "Round Shape 3546", brand: "Ray ban", categories: ["LENTES DE SOL"] },
  { slug: "c", name: "Reloj Invicta Pro Diver", brand: "Invicta", categories: ["RELOJES"] },
  ...Array.from({ length: 8 }, (_, i) => ({ slug: `r${i}`, name: `Ray-Ban ${4000 + i}`, brand: "Ray ban", categories: [] })),
];

test("results replace the featured products from two typed characters", () => {
  assert.equal(MIN_QUERY_LENGTH, 2);
  for (const query of ["", " ", "r", "  R  ", "á"]) {
    assert.equal(canSuggest(query), false, `"${query}"`);
    const panel = searchPanel(query, { featured: featuredRows, products });
    assert.equal(panel.kind, "featured", `"${query}"`);
    assert.deepEqual(slugs(panel.items), ["f1", "f2", "f3", "f4", "f5", "f6"], "six featured at most");
  }
  for (const query of ["ra", " RA ", "ñu", "reloj"]) assert.equal(canSuggest(query), true, `"${query}"`);
});

test("typing lists the six best matches and counts them all", () => {
  const panel = searchPanel("ray", { featured: featuredRows, products });

  assert.equal(panel.kind, "results");
  assert.equal(panel.resultCount, 10);
  assert.deepEqual(slugs(panel.items), ["r0", "r1", "r2", "r3", "r4", "r5"], "names starting with the query first");
  assert.deepEqual(slugs(searchPanel("ray wayfarer", { featured: featuredRows, products }).items), ["a"]);
});

test("the search index text is searched too", () => {
  const extraText = (product) => (product.slug === "c" ? "cronógrafo de acero" : "");
  const panel = searchPanel("cronografo", { featured: featuredRows, products, extraText });

  assert.equal(panel.kind, "results");
  assert.deepEqual(slugs(panel.items), ["c"]);
});

test("while the product list loads, and without matches, nothing is listed", () => {
  assert.deepEqual(searchPanel("ray", { featured: featuredRows, products: null }), { kind: "loading", items: [], resultCount: 0 });
  assert.deepEqual(searchPanel("pizza", { featured: featuredRows, products }), { kind: "empty", items: [], resultCount: 0 });
  assert.equal(searchPanel("", { featured: featuredRows, products: null }).kind, "featured", "featured need no request");
});

// ── Keyboard ─────────────────────────────────────────────────────────────────

test("the options are the listed products, plus the results row after results", () => {
  assert.equal(optionCountFor({ kind: "featured", items: featuredRows.slice(0, 6) }), 6, "no results row before typing");
  assert.equal(optionCountFor({ kind: "results", items: [1, 2] }), 3);
  assert.equal(optionCountFor({ kind: "empty", items: [] }), 0);
  assert.equal(optionCountFor({ kind: "loading", items: [] }), 0);
});

test("arrow keys wrap around the options", () => {
  const count = 5;

  assert.equal(moveHighlight(-1, 1, count), 0, "down from nothing: the first option");
  assert.equal(moveHighlight(-1, -1, count), 4, "up from nothing: the last option");
  assert.equal(moveHighlight(0, 1, count), 1);
  assert.equal(moveHighlight(4, 1, count), 0, "down from the last option wraps to the first");
  assert.equal(moveHighlight(0, -1, count), 4, "up from the first option wraps to the last");
});

test("a highlight past the options counts as none", () => {
  assert.equal(clampHighlight(5, 3), -1, "the list shrank under the highlight");
  assert.equal(clampHighlight(2, 3), 2);
  assert.equal(clampHighlight(-1, 3), -1);
  assert.equal(clampHighlight(0, 0), -1);
  assert.equal(moveHighlight(9, 1, 3), 0);
  assert.equal(moveHighlight(9, -1, 3), 2);
  assert.equal(moveHighlight(-1, 1, 0), -1, "no options, nothing to highlight");
});

test("Enter opens the highlighted product, otherwise the filtered catalog", () => {
  const results = { kind: "results", items: [1, 2, 3, 4] };
  const featured = { kind: "featured", items: [1, 2, 3, 4, 5, 6] };

  assert.deepEqual(enterAction("ray", 2, results), { action: "product", index: 2 });
  assert.deepEqual(enterAction("", 3, featured), { action: "product", index: 3 }, "a featured product");
  assert.deepEqual(enterAction("ray", -1, results), { action: "results" }, "nothing highlighted");
  assert.deepEqual(enterAction("ray", 4, results), { action: "results" }, "the results row");
  assert.deepEqual(enterAction("pizza", -1, { kind: "empty", items: [] }), { action: "results" });
  assert.deepEqual(enterAction("r", -1, featured), { action: "results" }, "one character filters the catalog too");
  assert.deepEqual(enterAction("   ", -1, featured), { action: "none" });
});

test("labels name the count", () => {
  assert.equal(seeAllResultsLabel(1), "Ver el resultado en la tienda");
  assert.equal(seeAllResultsLabel(23), "Ver los 23 resultados en la tienda");
  assert.equal(resultCountLabel(1), "1 resultado");
  assert.equal(resultCountLabel(8), "8 resultados");
});

// ── Catalog link ─────────────────────────────────────────────────────────────

test("the results row opens the homepage catalog with ?q=", () => {
  assert.equal(CATALOG_QUERY_PARAM, "q");
  assert.equal(catalogSearchHref("ray ban"), "/?q=ray+ban#catalogo");
  assert.equal(catalogSearchHref("  Gucci "), "/?q=Gucci#catalogo");
  assert.equal(catalogSearchHref("cronógrafo"), "/?q=cron%C3%B3grafo#catalogo");
  assert.equal(new URL(catalogSearchHref("D&G 50%"), "https://x.test").searchParams.get("q"), "D&G 50%");
  assert.match(read("components/store/TiendaCatalog.tsx"), new RegExp(`id="${CATALOG_ANCHOR}"`));
});

test("a new ?q= fills the catalog field; dropping it keeps what was typed", () => {
  assert.equal(searchFromAddress("", "ray", ""), "ray", "a link from the overlay");
  assert.equal(searchFromAddress("ray", "gucci", "ray ban"), "gucci");
  assert.equal(searchFromAddress("ray", "", "ray ba"), "ray ba", "the field dropped ?q= while typing");
  assert.equal(searchFromAddress("ray", "ray", "x"), "x", "unchanged address");
});

// ── Wiring ───────────────────────────────────────────────────────────────────

test("every page header has the search button and the layout mounts the overlay", () => {
  assert.match(read("components/search/SearchButton.tsx"), /aria-label="Buscar"/);
  assert.match(read("components/store/StoreShell.tsx"), /<SearchButton\b/);
  assert.match(read("components/layout/Header.tsx"), /<SearchButton\b/);
  assert.match(read("app/layout.tsx"), /<SiteSearchProvider featured=\{featuredSearchRows\}>\{children\}<\/SiteSearchProvider>/);
});

test("the overlay is a modal dialog with a combobox and opens product pages", () => {
  const overlay = read("components/search/SearchOverlay.tsx");

  assert.match(overlay, /role="dialog"/);
  assert.match(overlay, /aria-modal="true"/);
  assert.match(overlay, /role="combobox"/);
  assert.match(overlay, /role="listbox"/);
  assert.match(overlay, /animate-searchSheetIn/);
  assert.match(read("app/globals.css"), /@media \(prefers-reduced-motion: reduce\) \{\s*\.animate-searchSheetIn,\s*\.animate-searchSheetOut \{\s*animation: none;/);
  assert.doesNotMatch(overlay, /from "framer-motion"/, "pages without framer-motion do not load it for the overlay");
  assert.match(read("lib/search-row.ts"), /href: `\/tienda\/productos\/\$\{product\.slug\}`/);
  for (const file of ["SearchOverlay.tsx", "SiteSearchProvider.tsx", "SearchButton.tsx"]) {
    assert.doesNotMatch(read(`components/search/${file}`), /overscroll/, `${file} leaves overscroll-behavior alone`);
  }
});
