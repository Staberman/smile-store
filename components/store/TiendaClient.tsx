"use client";

import { type ReactNode, Suspense, startTransition, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { createStoreProductsLoader } from "@/lib/home-catalog.mjs";
import type { ProductSummary } from "@/lib/product-summary";
import TiendaCatalog from "./TiendaCatalog";
import { DEFAULT_STORE_VIEW } from "./storeView";

type CatalogProps = {
  products: ProductSummary[];
  bestSellerSlugs: string[];
  brands: ReactNode;
  animateEntrance: boolean;
};

// Every purchasable product, loaded once per page load (with retries) and
// reused when the homepage is visited again through client-side navigation.
const storeProductsLoader = createStoreProductsLoader<ProductSummary>();

/** The full product list, or null while the catalog shows its preview. */
function useStoreProducts(): ProductSummary[] | null {
  // A page load starts from the preview, like the server HTML.
  const [products, setProducts] = useState(() => storeProductsLoader.loaded);

  useEffect(() => {
    if (products) return;
    let cancelled = false;
    const load = () => {
      storeProductsLoader.load().then((loaded) => {
        // Rendering the full grid is not urgent: keep input responsive.
        if (!cancelled && loaded) startTransition(() => setProducts(loaded));
      });
    };

    load();
    // When every attempt failed, try again once the visitor comes back to
    // the tab or the connection returns. During a load these calls join it.
    window.addEventListener("focus", load);
    window.addEventListener("online", load);
    return () => {
      cancelled = true;
      window.removeEventListener("focus", load);
      window.removeEventListener("online", load);
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
 * lib/home-catalog.mjs); the full list is fetched from STORE_PRODUCTS_PATH
 * after hydration and then drives views, filters and search. Until it
 * arrives, counts and filters describe the preview cards on screen, never
 * products the grid cannot show.
 */
export default function TiendaClient({
  previewProducts,
  bestSellerSlugs,
  brands,
}: {
  previewProducts: ProductSummary[];
  bestSellerSlugs: string[];
  brands: ReactNode;
}) {
  const storeProducts = useStoreProducts();

  // Cards appear in place when they replace the server-rendered fallback
  // (first client render) and when the full list arrives below the fold;
  // the ones a later view, filter or search change brings in animate.
  const [animateEntrance, setAnimateEntrance] = useState(false);
  useEffect(() => setAnimateEntrance(storeProducts !== null), [storeProducts]);

  const catalog: CatalogProps = {
    products: storeProducts ?? previewProducts,
    bestSellerSlugs,
    brands,
    animateEntrance,
  };

  return (
    // useSearchParams opts out of static rendering up to this boundary; the
    // fallback keeps the default catalog preview in the static HTML for crawlers.
    <Suspense fallback={<TiendaCatalog view={DEFAULT_STORE_VIEW} {...catalog} />}>
      <TiendaCatalogFromUrl {...catalog} />
    </Suspense>
  );
}
