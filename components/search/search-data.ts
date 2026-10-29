"use client";

import { useEffect, useState } from "react";
import { canonicalBrand } from "@/lib/brand-directory";
import { createStoreProductsLoader } from "@/lib/home-catalog.mjs";
import type { ProductSummary } from "@/lib/product-summary";

// Data the client-side search reads, loaded once per page load and shared by
// the homepage catalog, every product grid and the site search overlay.

/** Every purchasable product as a card summary (STORE_PRODUCTS_PATH), with retries. */
export const storeProductsLoader = createStoreProductsLoader<ProductSummary>();

// Search text the card summaries leave out (tags, description, SEO copy),
// keyed by slug (app/api/search-index/route.ts).
export type SearchIndex = Record<string, string>;

let searchIndexRequest: Promise<SearchIndex | null> | null = null;

export function loadSearchIndex(): Promise<SearchIndex | null> {
  searchIndexRequest ??= fetch("/api/search-index")
    .then((response) => {
      if (!response.ok) throw new Error(`search index: HTTP ${response.status}`);
      return response.json() as Promise<SearchIndex>;
    })
    .catch(() => {
      // Retry on the next search interaction; until then search still covers
      // name, brand and categories.
      searchIndexRequest = null;
      return null;
    });
  return searchIndexRequest;
}

/** The search index once `enabled` has been true and the request succeeded, else null. */
export function useSearchIndex(enabled: boolean): SearchIndex | null {
  const [index, setIndex] = useState<SearchIndex | null>(null);

  useEffect(() => {
    if (!enabled || index) return;
    let cancelled = false;
    loadSearchIndex().then((data) => {
      if (!cancelled && data) setIndex(data);
    });
    return () => {
      cancelled = true;
    };
  }, [enabled, index]);

  return index;
}

/**
 * The full product list for the overlay once `enabled` has been true and it
 * loaded, else null. Reopening the overlay after a failed load tries again.
 */
export function useSearchProducts(enabled: boolean): ProductSummary[] | null {
  const [products, setProducts] = useState(() => storeProductsLoader.loaded);

  useEffect(() => {
    if (!enabled || products) return;
    let cancelled = false;
    storeProductsLoader.load().then((loaded) => {
      if (!cancelled && loaded) setProducts(loaded);
    });
    return () => {
      cancelled = true;
    };
  }, [enabled, products]);

  return products;
}

/** Starts both downloads ahead of a search, e.g. while the pointer is on the search button. */
export function warmSearchData(): void {
  void storeProductsLoader.load();
  void loadSearchIndex();
}

/**
 * Text a product is found by beyond its name, brand and categories: its
 * canonical brand ("Ray-Ban" for "Ray ban"), the grid's label for it and its
 * search index entry. Grids and the overlay pass it to lib/product-search.mjs,
 * so a query finds the same products in both.
 */
export function extraSearchText(
  product: ProductSummary,
  index: SearchIndex | null,
  label = "",
): string {
  return `${canonicalBrand(product.brand)} ${label} ${index?.[product.slug] ?? ""}`;
}
