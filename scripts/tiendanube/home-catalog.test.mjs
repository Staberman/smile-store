import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import {
  HOME_GRID_PREVIEW_COUNT,
  STORE_PRODUCTS_PATH,
  homeCatalogPreview,
  storeViewCounts,
  storeViewProducts,
} from "../../lib/home-catalog.mjs";
import { carouselSlides, isWatch } from "../../lib/storefront.mjs";

const projectRoot = process.cwd();
const read = (relativePath) => fs.readFileSync(path.join(projectRoot, relativePath), "utf8");

// Purchasable products (lib/catalog.ts hasPurchasableStock) shaped like the
// summaries the homepage passes (lib/product-summary.ts): `image` is the first
// product image.
const storeProducts = JSON.parse(read("data/tiendanube-catalog.json"))
  .filter((product) =>
    product.variants.some(
      (variant) =>
        product.tiendanubeProductId !== null &&
        variant.id !== null &&
        variant.available &&
        variant.stock > 0,
    ),
  )
  .map((product) => ({ ...product, image: product.images[0] ?? null }));

// The `?view=` values of components/store/storeView.ts (best sellers stay
// empty while the sales ranking is).
const VIEWS = ["lentes", "ray-ban", "ferrari", "premium", "relojes", "best-sellers", "offers"];
const WATCHES_SECTION_SIZE = 8;
const pinned = storeProducts.filter(isWatch).slice(0, WATCHES_SECTION_SIZE);
const preview = homeCatalogPreview(storeProducts, { view: "lentes", views: VIEWS, pinned });
const slugs = (products) => products.map((product) => product.slug);

test("the homepage preview is a bounded slice of the catalog, in catalog order", () => {
  assert.ok(storeProducts.length > HOME_GRID_PREVIEW_COUNT * 2, "fixture: a real catalog");
  // Grid cards, five slides per view and the watches section, at most.
  const bound = HOME_GRID_PREVIEW_COUNT + 5 * VIEWS.length + WATCHES_SECTION_SIZE;
  assert.ok(preview.length <= bound, `${preview.length} products > ${bound}`);
  assert.ok(preview.length < storeProducts.length / 2, "the preview must stay a small part");

  const positions = slugs(preview).map((slug) => slugs(storeProducts).indexOf(slug));
  assert.ok(positions.every((position) => position >= 0));
  assert.deepEqual(positions, [...positions].sort((a, b) => a - b));
});

test("the default view server-renders the first cards of its full grid", () => {
  const full = storeViewProducts(storeProducts, "lentes");
  const shown = storeViewProducts(preview, "lentes");
  assert.ok(shown.length >= HOME_GRID_PREVIEW_COUNT);
  assert.ok(shown.length < full.length);
  // The full list appends cards after these instead of reordering them.
  assert.deepEqual(
    slugs(shown.slice(0, HOME_GRID_PREVIEW_COUNT)),
    slugs(full.slice(0, HOME_GRID_PREVIEW_COUNT)),
  );
});

test("every view keeps its carousel slides when the full list arrives", () => {
  for (const view of VIEWS) {
    assert.deepEqual(
      slugs(carouselSlides(storeViewProducts(preview, view))),
      slugs(carouselSlides(storeViewProducts(storeProducts, view))),
      view,
    );
  }
});

test("views with products have cards before the full list arrives", () => {
  for (const view of VIEWS) {
    const full = storeViewProducts(storeProducts, view);
    if (full.length === 0) continue;
    assert.ok(storeViewProducts(preview, view).length > 0, view);
  }
  for (const watch of pinned) {
    assert.ok(slugs(preview).includes(watch.slug), `pinned ${watch.slug}`);
  }
});

test("view counts give each view's full size, best sellers in ranking order", () => {
  const counts = storeViewCounts(storeProducts, VIEWS);
  assert.equal(counts.lentes + counts.relojes, storeProducts.length);
  for (const view of VIEWS) {
    assert.equal(counts[view], storeViewProducts(storeProducts, view).length, view);
  }

  const [first, second] = storeProducts;
  const ranking = [second.slug, "not-in-catalog", first.slug];
  assert.deepEqual(slugs(storeViewProducts(storeProducts, "best-sellers", ranking)), [
    second.slug,
    first.slug,
  ]);
  assert.equal(storeViewCounts(storeProducts, ["best-sellers"], ranking)["best-sellers"], 2);
});

test("the full product list is a static route outside /api/", () => {
  const route = read(`app${STORE_PRODUCTS_PATH}/route.ts`);
  assert.match(route, /export const dynamic = "force-static"/);
  assert.match(route, /toProductSummaries\(allProducts\)/);
  assert.ok(!STORE_PRODUCTS_PATH.startsWith("/api/"), "robots.txt disallows /api/");
  assert.match(read("components/store/TiendaClient.tsx"), /fetch\(STORE_PRODUCTS_PATH\)/);
});
