import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { publishedOnly } from "../../lib/catalog-published.mjs";
import {
  cardPrice,
  defaultVariant,
  getAvailableVariants,
  getDisplayPrice,
  isWatch,
  sortByCardPrice,
} from "../../lib/storefront.mjs";

const projectRoot = process.cwd();
const read = (relativePath) => fs.readFileSync(path.join(projectRoot, relativePath), "utf8");

const variant = (id, price, { promo = null, stock = 1, available = true } = {}) => ({
  id,
  price,
  promotionalPrice: promo,
  stock,
  available,
});
const product = (slug, variants, { price = null, promo = null } = {}) => ({
  slug,
  price,
  promotionalPrice: promo,
  variants,
});
const slugs = (list) => list.map((item) => item.slug);

// ── The card's variant and price ─────────────────────────────────────────────

test("a card starts on the first purchasable variant, else the first one", () => {
  const soldOut = variant(1, 100, { stock: 0, available: false });
  const inStock = variant(2, 200);
  const noId = { ...variant(null, 300) };

  assert.equal(defaultVariant(product("a", [soldOut, inStock])), inStock);
  assert.equal(defaultVariant(product("b", [noId, inStock])), inStock, "a variant without id cannot be bought");
  assert.equal(defaultVariant(product("c", [soldOut])), soldOut, "nothing in stock: the first variant");
  assert.equal(defaultVariant(product("d", [])), null);
});

test("the card price is that variant's price, then the product's", () => {
  assert.equal(cardPrice(product("a", [variant(1, 200, { promo: 150 })], { price: 300, promo: 100 })), 150);
  assert.equal(cardPrice(product("b", [variant(1, 200)], { price: 300, promo: 100 })), 200);
  assert.equal(cardPrice(product("c", [], { price: 300, promo: 250 })), 250);
  assert.equal(cardPrice(product("d", [], { price: 300 })), 300);
  assert.equal(cardPrice(product("e", [])), null);
});

// ── Sorting ──────────────────────────────────────────────────────────────────

const catalog = [
  product("p300", [variant(1, 300)]),
  product("none", []),
  product("p100", [variant(2, 100)]),
  product("p200a", [variant(3, 200)]),
  product("p200b", [variant(4, 250, { promo: 200 })]),
  product("none2", [variant(null, null)]),
  product("p50", [variant(5, 50)]),
];

test("price sorts follow the card prices, cheapest or dearest first", () => {
  assert.deepEqual(slugs(sortByCardPrice(catalog, "asc")), ["p50", "p100", "p200a", "p200b", "p300", "none", "none2"]);
  assert.deepEqual(slugs(sortByCardPrice(catalog, "desc")), ["p300", "p200a", "p200b", "p100", "p50", "none", "none2"]);
});

test("products without a price go last and equal prices keep their order, both ways", () => {
  for (const order of ["asc", "desc"]) {
    const sorted = slugs(sortByCardPrice(catalog, order));
    assert.deepEqual(sorted.slice(-2), ["none", "none2"], order);
    assert.ok(sorted.indexOf("p200a") < sorted.indexOf("p200b"), `${order}: input order among equals`);
  }
  const reversed = [...catalog].reverse();
  assert.ok(slugs(sortByCardPrice(reversed, "asc")).indexOf("p200b") < slugs(sortByCardPrice(reversed, "asc")).indexOf("p200a"));
});

test("sorting returns a new array and leaves the input alone", () => {
  const before = slugs(catalog);
  const sorted = sortByCardPrice(catalog, "asc");
  assert.notEqual(sorted, catalog);
  assert.deepEqual(slugs(catalog), before);
});

// ── Real catalog ─────────────────────────────────────────────────────────────

// Card summaries keep the first variant and the purchasable ones (lib/product-summary.ts).
const summaries = publishedOnly(JSON.parse(read("data/tiendanube-catalog.json"))).map((item) => ({
  ...item,
  variants: item.variants.filter(
    (entry, index) => index === 0 || (entry.available && entry.stock > 0),
  ),
}));

test("Round Metal Classic 3447 sorts by the $ 182.700 its card shows, not the catalog's $ 159.900", () => {
  const roundMetal = summaries.find((item) => item.slug === "round-metal-classic-3447");
  assert.ok(roundMetal, "still in the catalog");
  assert.equal(roundMetal.promotionalPrice, 159900, "product-level price, from a variant out of stock");
  assert.equal(cardPrice(roundMetal), 182700);

  const sunglasses = summaries.filter((item) => !isWatch(item));
  const sorted = sortByCardPrice(sunglasses, "asc");
  const prices = sorted.map(cardPrice).filter((price) => price !== null);
  assert.deepEqual(prices, [...prices].sort((a, b) => a - b), "non-decreasing card prices");
  const position = sorted.indexOf(roundMetal);
  assert.ok(sorted.slice(0, position).every((item) => cardPrice(item) <= 182700));
  assert.ok(sorted.slice(position + 1).every((item) => cardPrice(item) === null || cardPrice(item) >= 182700));
});

test("the card price is what the product page shows for products in stock", () => {
  // ProductDetailClient: getDisplayPrice(product, first available variant).
  for (const item of summaries) {
    const available = getAvailableVariants(item);
    if (available.length === 0) continue;
    assert.equal(cardPrice(item), getDisplayPrice(item, available[0]), item.slug);
  }
});

// ── Wiring ───────────────────────────────────────────────────────────────────

test("the card, the grid sort and the search rows share the variant choice", () => {
  const card = read("components/brand/ProductCard.tsx");
  assert.match(card, /defaultVariant\(product\)/);
  assert.doesNotMatch(card, /availableVariants\[0\]/, "no second copy of the choice");

  const grid = read("components/brand/ProductGrid.tsx");
  assert.match(grid, /sortByCardPrice\(facetted, sort\)/);
  assert.doesNotMatch(grid, /getSortPrice/);

  assert.match(read("lib/search-row.ts"), /defaultVariant\(product\)/);
});
