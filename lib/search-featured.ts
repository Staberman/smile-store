import { featuredWatches } from "@/components/store/WatchesSection";
import { DEFAULT_STORE_VIEW } from "@/components/store/storeView";
import { allProducts, getBestSellers } from "@/lib/catalog";
import { storeViewProducts } from "@/lib/home-catalog.mjs";
import { toProductSummaries } from "@/lib/product-summary";
import { featuredSearchProducts } from "@/lib/search-overlay.mjs";
import { toSearchRow, type SearchRow } from "@/lib/search-row";
import { carouselSlides } from "@/lib/storefront.mjs";

// Server only: reads the catalog.

/**
 * The products the site search features before anything is typed: the
 * homepage's hero slides (its default view) and featured watches, alternated
 * and topped up by lib/search-overlay.mjs (featuredSearchProducts). Computed
 * once per build from the purchasable, published catalog, the same list the
 * homepage builds them from.
 */
function buildFeaturedSearchRows(): SearchRow[] {
  const storeProducts = toProductSummaries(allProducts);
  const bestSellerSlugs = getBestSellers().map((product) => product.slug);
  const slides = carouselSlides(storeViewProducts(storeProducts, DEFAULT_STORE_VIEW, bestSellerSlugs));
  return featuredSearchProducts(storeProducts, {
    slides,
    watches: featuredWatches(storeProducts),
  }).map(toSearchRow);
}

export const featuredSearchRows: SearchRow[] = buildFeaturedSearchRows();
