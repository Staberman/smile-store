import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { publishedOnly } from "../../lib/catalog-published.mjs";
import {
  matchesSearch,
  normalizeSearchText,
  searchProducts,
  searchTokens,
} from "../../lib/product-search.mjs";

const projectRoot = process.cwd();
const read = (relativePath) => fs.readFileSync(path.join(projectRoot, relativePath), "utf8");

const product = (name, brand, categories = []) => ({ name, brand, categories });

/** A slice of the catalog, shaped like the product summaries grids search. */
const catalog = [
  product("Reloj Tommy Hilfiger 1782779", "Tommy Hilfiger", ["RELOJES", "TOMMY HILFIGER DAMA"]),
  product("Reloj Invicta Pro Diver 30956", "Invicta", ["RELOJES", "INVICTA"]),
  product("Wayfarer Reverse", "Ray Ban", ["LENTES DE SOL", "RAY BAN", "WAYFARER"]),
  product("Round Shape 3546", "Ray ban", ["LENTES DE SOL", "RAY BAN", "ROUND SHAPE"]),
  product("Chris Polarizado 4187", "Ray ban", ["LENTES DE SOL", "RAY BAN", "CHRIS"]),
  product("Prada Symbole PR20YS", "Prada", ["LENTES DE SOL", "MARCAS PREMIUM", "PRADA"]),
  product("Reloj OMEGA x Swatch - Mission to the Moon", "OMEGA x Swatch", ["RELOJES", "OMEGA X Swatch"]),
];

const names = (list) => list.map((item) => item.name);

test("search text ignores accents, case and extra spaces", () => {
  assert.equal(normalizeSearchText("  Reloj   DAMA "), "reloj dama");
  assert.equal(normalizeSearchText("Montaña Cronógrafo"), "montana cronografo");
  assert.equal(normalizeSearchText(null), "");
  assert.deepEqual(searchTokens(" Ray  BAN "), ["ray", "ban"]);
  assert.deepEqual(searchTokens("   "), []);
});

test("a query without accents finds accented text and the other way around", () => {
  assert.ok(matchesSearch(product("Montaña Polarizado", "Ray ban"), "montana"));
  assert.ok(matchesSearch(product("Montana Polarizado", "Ray ban"), "MONTAÑA"));
  const extraText = () => "Cronógrafo de acero con caja biocerámica";
  assert.ok(matchesSearch(catalog[6], "cronografo bioceramica", { extraText }));
  assert.deepEqual(names(searchProducts(catalog, "CRONOGRAFO", { extraText: (p) => (p === catalog[1] ? extraText() : "") })), [
    "Reloj Invicta Pro Diver 30956",
  ]);
});

test("every word of the query must appear, each in any field", () => {
  assert.ok(matchesSearch(catalog[4], "ray polarizado"), "brand and name");
  assert.ok(matchesSearch(catalog[0], "reloj dama"), "name and category");
  assert.ok(!matchesSearch(catalog[4], "ray prada"));
  assert.deepEqual(names(searchProducts(catalog, "relojes invicta")), ["Reloj Invicta Pro Diver 30956"]);
});

test("extra text (grid label, search index entry) finds products too", () => {
  const index = { "Round Shape 3546": "gafas de sol polarizadas hombre" };
  const extraText = (p) => index[p.name];
  assert.ok(!matchesSearch(catalog[3], "gafas hombre"));
  assert.ok(matchesSearch(catalog[3], "gafas hombre", { extraText }));
  assert.deepEqual(names(searchProducts(catalog, "gafas", { extraText })), ["Round Shape 3546"]);
});

test("an empty or blank query matches every product but suggests none", () => {
  for (const query of ["", "   ", null, undefined]) {
    assert.ok(matchesSearch(catalog[0], query));
    assert.deepEqual(searchProducts(catalog, query, { limit: 6 }), []);
  }
});

test("results rank name start, word start, name, brand, then other text", () => {
  const ranked = searchProducts(
    [
      product("Reloj Invicta", "Invicta", ["RAYOS"]), // categories only
      product("Wayfarer Reverse", "Ray Ban"), // brand
      product("Gafas Array", "Versace"), // inside a word of the name
      product("Lente Rayado", "Prada"), // a word of the name starts with it
      product("Raya Negra", "Gucci"), // the name starts with it
    ],
    "ray",
  );

  assert.deepEqual(names(ranked), ["Raya Negra", "Lente Rayado", "Gafas Array", "Wayfarer Reverse", "Reloj Invicta"]);
});

test("a brand match ranks after name matches and before category or index matches", () => {
  const ranked = searchProducts(
    [
      product("Chris Polarizado 4187", "Ray ban"),
      product("Prada Symbole PR20YS", "Prada", ["RAY BAN", "POLARIZADO"]),
      product("Ray-Ban Polarizado 4375", "Ray Ban"),
    ],
    "ray polarizado",
  );

  assert.deepEqual(names(ranked), ["Ray-Ban Polarizado 4375", "Chris Polarizado 4187", "Prada Symbole PR20YS"]);
});

test("products with the same rank keep their input order", () => {
  const input = catalog.slice(2, 5);
  assert.deepEqual(names(searchProducts(input, "ray")), names(input));
  assert.deepEqual(names(searchProducts([...input].reverse(), "ray")), names([...input].reverse()));
});

test("the limit caps the results after ranking", () => {
  assert.deepEqual(names(searchProducts(catalog, "reloj", { limit: 2 })), [
    "Reloj Tommy Hilfiger 1782779",
    "Reloj Invicta Pro Diver 30956",
  ]);
  assert.equal(searchProducts(catalog, "r").length, catalog.filter((p) => matchesSearch(p, "r")).length);
  assert.deepEqual(searchProducts(catalog, "reloj", { limit: 0 }), []);
});

test("the overlay and the grid find the same products", () => {
  for (const query of ["ray", "reloj dama", "lentes", "omega swatch", "polarizado", "zzz"]) {
    const grid = catalog.filter((p) => matchesSearch(p, query));
    assert.deepEqual(new Set(searchProducts(catalog, query)), new Set(grid), query);
  }
});

test("the input list is not modified", () => {
  const before = names(catalog);
  searchProducts(catalog, "ray");
  assert.deepEqual(names(catalog), before);
});

// ── Real catalog ─────────────────────────────────────────────────────────────

const storeProducts = publishedOnly(JSON.parse(read("data/tiendanube-catalog.json")));

test("the grid finds everything its former phrase match found", () => {
  // The grid used to need the whole query as one phrase of its search text.
  const phraseMatch = (p, query) =>
    normalizeSearchText([p.name, p.brand, ...p.categories, ...p.tags].join(" ")).includes(normalizeSearchText(query));
  const extraText = (p) => p.tags.join(" ");

  for (const query of ["ray ban", "polarizado", "reloj tommy", "gucci", "wayfarer", "omega x swatch", "lentes de sol"]) {
    const before = storeProducts.filter((p) => phraseMatch(p, query));
    assert.ok(before.length > 0, query);
    for (const p of before) assert.ok(matchesSearch(p, query, { extraText }), `${query}: ${p.name}`);
  }
});

test("every product is found by its own name", () => {
  for (const p of storeProducts) assert.ok(searchProducts(storeProducts, p.name).includes(p), p.name);
});

// ── Wiring ───────────────────────────────────────────────────────────────────

test("the catalog grid filters with matchesSearch and keeps a plain search field", () => {
  const grid = read("components/brand/ProductGrid.tsx");

  assert.match(grid, /from "@\/lib\/product-search\.mjs"/);
  assert.match(grid, /matchesSearch\(product, search, \{ extraText \}\)/);
  assert.match(grid, /type="search"/);
  assert.doesNotMatch(grid, /role="(?:combobox|listbox)"|getSearchSuggestions|\.includes\(normalizedSearch\)/);
});

test("the overlay lists results with the shared matcher", () => {
  const overlay = read("lib/search-overlay.mjs");
  assert.match(overlay, /from "\.\/product-search\.mjs"/);
  assert.match(overlay, /searchProducts\(products, query, \{ extraText \}\)/);
  assert.match(read("components/search/SearchOverlay.tsx"), /extraSearchText\(product, searchIndex\)/);
  assert.match(read("components/brand/ProductGrid.tsx"), /extraSearchText\(product, searchIndex, /);
});
