import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import {
  HOME_GRID_PREVIEW_COUNT,
  STORE_PRODUCTS_PATH,
  STORE_PRODUCTS_RETRY_DELAYS_MS,
  createStoreProductsLoader,
  homeCatalogPreview,
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

test("the best-sellers view follows the sales ranking", () => {
  const [first, second] = storeProducts;
  const ranking = [second.slug, "not-in-catalog", first.slug];
  assert.deepEqual(slugs(storeViewProducts(storeProducts, "best-sellers", ranking)), [
    second.slug,
    first.slug,
  ]);
});

test("the full product list is a static route outside /api/", () => {
  const route = read(`app${STORE_PRODUCTS_PATH}/route.ts`);
  assert.match(route, /export const dynamic = "force-static"/);
  assert.match(route, /toProductSummaries\(allProducts\)/);
  assert.ok(!STORE_PRODUCTS_PATH.startsWith("/api/"), "robots.txt disallows /api/");
  // One loader, shared by the homepage catalog and the site search overlay.
  assert.match(read("components/search/search-data.ts"), /createStoreProductsLoader/);
  assert.match(read("components/store/TiendaClient.tsx"), /storeProductsLoader\.load\(\)/);
});

// --- Loading the full list: retries with backoff, one request at a time ---

const LIST = [{ slug: "a" }, { slug: "b" }];
const ok = (body = LIST) => ({ ok: true, status: 200, json: async () => body });
const httpError = (status) => ({ ok: false, status, json: async () => ({}) });

function deferred() {
  let resolve;
  const promise = new Promise((done) => (resolve = done));
  return { promise, resolve };
}

/** Fake fetch answering each attempt from `responses`; a function is called. */
function fakeFetch(responses) {
  const calls = [];
  const fetch = async (url) => {
    calls.push(url);
    const next = responses[Math.min(calls.length - 1, responses.length - 1)];
    if (next instanceof Error) throw next;
    return typeof next === "function" ? next() : next;
  };
  return { fetch, calls };
}

/** Fake timer: records each delay and resolves at once. */
function fakeWait() {
  const delays = [];
  return { wait: async (ms) => void delays.push(ms), delays };
}

test("the full list loads from STORE_PRODUCTS_PATH once and is then reused", async () => {
  const { fetch, calls } = fakeFetch([ok()]);
  const { wait, delays } = fakeWait();
  const loader = createStoreProductsLoader({ fetch, wait });

  assert.equal(loader.loaded, null);
  assert.deepEqual(await loader.load(), LIST);
  assert.deepEqual(loader.loaded, LIST);
  assert.deepEqual(await loader.load(), LIST);
  assert.deepEqual(calls, [STORE_PRODUCTS_PATH]);
  assert.deepEqual(delays, []);
});

test("loads started while one is in flight share its request", async () => {
  const response = deferred();
  const { fetch, calls } = fakeFetch([() => response.promise]);
  const loader = createStoreProductsLoader({ fetch, wait: fakeWait().wait });

  const first = loader.load();
  const second = loader.load();
  assert.equal(first, second);
  response.resolve(ok());
  assert.deepEqual(await Promise.all([first, second]), [LIST, LIST]);
  assert.equal(calls.length, 1);
});

test("a failed attempt is retried after 2 s, then after 5 s", async () => {
  assert.deepEqual(STORE_PRODUCTS_RETRY_DELAYS_MS, [2000, 5000]);
  const { fetch, calls } = fakeFetch([new TypeError("Failed to fetch"), httpError(503), ok()]);
  const { wait, delays } = fakeWait();
  const loader = createStoreProductsLoader({ fetch, wait });

  assert.deepEqual(await loader.load(), LIST);
  assert.equal(calls.length, 3);
  assert.deepEqual(delays, [2000, 5000]);
});

test("after three failed attempts a load gives up; a later load starts over", async () => {
  // A network error, an HTTP error and a body that is not a list all fail.
  const { fetch, calls } = fakeFetch([
    new TypeError("Failed to fetch"),
    httpError(500),
    ok({ error: "not a list" }),
    new TypeError("Failed to fetch"),
    new TypeError("Failed to fetch"),
    ok(),
  ]);
  const { wait, delays } = fakeWait();
  const loader = createStoreProductsLoader({ fetch, wait });

  assert.equal(await loader.load(), null);
  assert.equal(calls.length, 3);
  assert.deepEqual(delays, [2000, 5000]);
  assert.equal(loader.loaded, null);

  // E.g. the tab regains focus or the connection returns.
  assert.deepEqual(await loader.load(), LIST);
  assert.equal(calls.length, 6);
  assert.deepEqual(delays, [2000, 5000, 2000, 5000]);
});

test("a load requested during a retry wait joins it instead of fetching", async () => {
  const pause = deferred();
  const delays = [];
  const { fetch, calls } = fakeFetch([httpError(503), ok()]);
  const loader = createStoreProductsLoader({
    fetch,
    wait: (ms) => {
      delays.push(ms);
      return pause.promise;
    },
  });

  const first = loader.load();
  await new Promise((resolve) => setImmediate(resolve));
  assert.deepEqual(delays, [2000]);
  const second = loader.load();
  assert.equal(second, first);
  assert.equal(calls.length, 1);

  pause.resolve();
  assert.deepEqual(await second, LIST);
  assert.equal(calls.length, 2);
});

