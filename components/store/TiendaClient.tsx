"use client";

import { type ReactNode, Suspense, startTransition, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { STORE_PRODUCTS_PATH } from "@/lib/home-catalog.mjs";
import type { ProductSummary } from "@/lib/product-summary";
import TiendaCatalog from "./TiendaCatalog";
import { DEFAULT_STORE_VIEW } from "./storeView";

type CatalogProps = {
  products: ProductSummary[];
  bestSellerSlugs: string[];
  viewCounts?: Record<string, number>;
  brands: ReactNode;
  animateEntrance: boolean;
};

// Every purchasable product, fetched once per page load and reused when the
// homepage is visited again through client-side navigation.
let loadedStoreProducts: ProductSummary[] | null = null;
let storeProductsRequest: Promise<ProductSummary[] | null> | null = null;

function loadStoreProducts(): Promise<ProductSummary[] | null> {
  storeProductsRequest ??= fetch(STORE_PRODUCTS_PATH)
    .then((response) => {
      if (!response.ok) throw new Error(`store products: HTTP ${response.status}`);
      return response.json() as Promise<ProductSummary[]>;
    })
    .then((products) => (loadedStoreProducts = products))
    .catch(() => {
      // The next mount retries; until then the catalog keeps its preview.
      storeProductsRequest = null;
      return null;
    });
  return storeProductsRequest;
}

/** The full product list, or null while the catalog shows its preview. */
function useStoreProducts(): ProductSummary[] | null {
  // A page load starts from the preview, like the server HTML.
  const [products, setProducts] = useState(loadedStoreProducts);

  useEffect(() => {
    if (products) return;
    let cancelled = false;
    loadStoreProducts().then((loaded) => {
      // Rendering the full grid is not urgent: keep input responsive.
      if (!cancelled && loaded) startTransition(() => setProducts(loaded));
    });
    return () => {
      cancelled = true;
    };
  }, [products]);

  return products;
}

function TiendaCatalogFromUrl(props: CatalogProps) {
  const searchParams = useSearchParams();
  const view = searchParams.get("view") ?? DEFAULT_STORE_VIEW;
  return <TiendaCatalog view={view} {...props} />;
}

/**
 * Homepage catalog. The server sends a preview of the products (see
 * lib/home-catalog.mjs) and each view's full count; the full list is fetched
 * from STORE_PRODUCTS_PATH after hydration and then drives views, filters and
 * search as before.
 */
export default function TiendaClient({
  previewProducts,
  viewCounts,
  bestSellerSlugs,
  brands,
}: {
  previewProducts: ProductSummary[];
  viewCounts: Record<string, number>;
  bestSellerSlugs: string[];
  brands: ReactNode;
}) {
  const storeProducts = useStoreProducts();

  // Cards appear in place when they replace the server-rendered fallback
  // (first client render) and when the full list arrives below the fold;
  // the ones a later view, filter or search change brings in animate.
  const [animateEntrance, setAnimateEntrance] = useState(false);
  useEffect(() => setAnimateEntrance(storeProducts !== null), [storeProducts]);

  const catalog: CatalogProps = storeProducts
    ? { products: storeProducts, bestSellerSlugs, brands, animateEntrance }
    : { products: previewProducts, bestSellerSlugs, viewCounts, brands, animateEntrance };

  return (
    // useSearchParams opts out of static rendering up to this boundary; the
    // fallback keeps the default catalog preview in the static HTML for crawlers.
    <Suspense fallback={<TiendaCatalog view={DEFAULT_STORE_VIEW} {...catalog} />}>
      <TiendaCatalogFromUrl {...catalog} />
    </Suspense>
  );
}
