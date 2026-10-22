import { carouselSlides, filterStorefrontProducts } from "./storefront.mjs";

// The homepage server-renders a preview of its catalog and loads the full
// product list after first paint, so its HTML stays short for crawlers and AI
// fetchers that truncate long pages. Every product stays linked from the
// category and brand hubs the homepage links, and from the sitemap.

/** Grid cards the homepage server-renders: whole rows at 1, 2, 3 and 4 columns. */
export const HOME_GRID_PREVIEW_COUNT = 12;

/** Every purchasable product as a card summary (app/store-products.json/route.ts). */
export const STORE_PRODUCTS_PATH = "/store-products.json";

/** Products a catalog view lists: catalog order, or sales order for best sellers. */
export function storeViewProducts(products, view, bestSellerSlugs = []) {
  if (view === "best-sellers") {
    const bySlug = new Map(products.map((product) => [product.slug, product]));
    return bestSellerSlugs.flatMap((slug) => bySlug.get(slug) ?? []);
  }
  return filterStorefrontProducts(products, view);
}

/**
 * The part of the catalog the homepage ships in its HTML: the first
 * `gridCount` products of `view` (the server-rendered grid), the carousel
 * slides of every view in `views` and `pinned` (the watches section). With
 * every view's slides in it, a page opened on any `?view=` keeps its hero
 * when the full list arrives, and its grid starts from those slides. Kept in
 * catalog order, so each view lists them in the order the full list will and
 * the rest of the cards are appended after them.
 */
export function homeCatalogPreview(
  products,
  { view, views = [view], gridCount = HOME_GRID_PREVIEW_COUNT, pinned = [], bestSellerSlugs = [] },
) {
  const viewProducts = (name) => storeViewProducts(products, name, bestSellerSlugs);
  const keep = new Set(
    [
      ...viewProducts(view).slice(0, gridCount),
      ...views.flatMap((name) => carouselSlides(viewProducts(name))),
      ...pinned,
    ].map((product) => product.slug),
  );
  return products.filter((product) => keep.has(product.slug));
}

/** Waits before the 2nd and 3rd attempt to load the full list. */
export const STORE_PRODUCTS_RETRY_DELAYS_MS = [2000, 5000];

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Loads the full product list for the homepage catalog. A load makes up to
 * `retryDelaysMs.length + 1` attempts, waiting each delay before the next
 * one, and resolves to the list or to null once they all fail. Calls made
 * while a load is in flight share it, so there is one request at a time; a
 * call after a failed load starts a new one, and one after a success
 * resolves to the loaded list without a request. `fetch` and `wait` are
 * injectable for tests.
 */
export function createStoreProductsLoader({
  url = STORE_PRODUCTS_PATH,
  retryDelaysMs = STORE_PRODUCTS_RETRY_DELAYS_MS,
  fetch: fetchList = (input) => globalThis.fetch(input),
  wait = sleep,
} = {}) {
  let loaded = null;
  let pending = null;

  async function attempt() {
    const response = await fetchList(url);
    if (!response.ok) throw new Error(`${url}: HTTP ${response.status}`);
    const products = await response.json();
    if (!Array.isArray(products)) throw new Error(`${url}: not a list`);
    return products;
  }

  async function loadWithRetries() {
    for (let retry = 0; ; retry++) {
      try {
        loaded = await attempt();
        return loaded;
      } catch {
        if (retry >= retryDelaysMs.length) return null;
        await wait(retryDelaysMs[retry]);
      }
    }
  }

  return {
    /** The full list once a load has succeeded, else null. */
    get loaded() {
      return loaded;
    },
    load() {
      if (loaded) return Promise.resolve(loaded);
      pending ??= loadWithRetries().finally(() => {
        pending = null;
      });
      return pending;
    },
  };
}
