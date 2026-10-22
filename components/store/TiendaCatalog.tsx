import type { ReactNode } from "react";
import ProductGrid from "@/components/brand/ProductGrid";
import BrandCarousel from "@/components/brand/BrandCarousel";
import TrustHighlights from "@/components/brand/TrustHighlights";
import { storeViewProducts } from "@/lib/home-catalog.mjs";
import type { ProductSummary } from "@/lib/product-summary";
import { DEFAULT_STORE_VIEW, STORE_VIEW_LABELS } from "./storeView";

/**
 * Store catalog for a given view. Pure: it does not read the URL, so it can
 * be server-rendered (e.g. as a Suspense fallback) for crawlers without JS.
 * `products` is the purchasable catalog as slim summaries, or its homepage
 * preview while the full list loads (then `viewCounts` holds each view's full
 * size). The best-sellers order is computed on the server, where the sales
 * ranking lives.
 */
export default function TiendaCatalog({
  view,
  products,
  bestSellerSlugs,
  viewCounts,
  brands,
  animateEntrance = true,
}: {
  view: string;
  products: ProductSummary[];
  bestSellerSlugs: string[];
  viewCounts?: Record<string, number>;
  /** Brand directory, rendered on the server from the full catalog. */
  brands: ReactNode;
  animateEntrance?: boolean;
}) {
  const visibleProducts = storeViewProducts(products, view, bestSellerSlugs);
  const label = STORE_VIEW_LABELS[view] ?? STORE_VIEW_LABELS[DEFAULT_STORE_VIEW];

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-[#f0ece4]">
      {/* Inspiracional - featured products carousel */}
      <BrandCarousel
        key={`carousel-${view}`}
        products={visibleProducts}
        brand={label}
        showNav={false}
      />

      <TrustHighlights />
      {brands}

      <div id="catalogo">
        <ProductGrid
          key={`grid-${view}`}
          products={visibleProducts}
          totalCount={viewCounts?.[view]}
          brandLabel={label}
          filterBy={view === "premium" ? "brand" : "collection"}
          searchProducts={products}
          enableFacets
          animateEntrance={animateEntrance}
        />
      </div>
    </main>
  );
}
