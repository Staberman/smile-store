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

/** How many products each view lists, for the grid count while the full list loads. */
export function storeViewCounts(products, views, bestSellerSlugs = []) {
  return Object.fromEntries(
    views.map((view) => [view, storeViewProducts(products, view, bestSellerSlugs).length]),
  );
}
