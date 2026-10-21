"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import ProductGrid from "@/components/brand/ProductGrid";
import BrandCarousel from "@/components/brand/BrandCarousel";
import BrandLogoStrip from "@/components/brand/BrandLogoStrip";
import TrustHighlights from "@/components/brand/TrustHighlights";
import { allProducts } from "@/lib/catalog";
import { filterStorefrontProducts } from "@/lib/storefront.mjs";
import salesRanking from "@/data/tiendanube-sales-ranking.json";

const VIEW_LABELS: Record<string, string> = {
  lentes: "Lentes de sol",
  "ray-ban": "Ray-Ban originales",
  ferrari: "Scuderia Ferrari Collection",
  premium: "Marcas premium",
  relojes: "Relojes",
  "best-sellers": "Más vendidos",
  offers: "Ofertas",
};

const SALES_RANKING = salesRanking as {
  ranking: Array<{ productId: number; units: number }>;
};

function TiendaContent() {
  const searchParams = useSearchParams();
  const view = searchParams.get("view") ?? "lentes";
  const ranking = new Map(
    SALES_RANKING.ranking.map((item) => [String(item.productId), item.units]),
  );
  const visibleProducts =
    view === "best-sellers"
      ? [...allProducts]
          .filter((product) => ranking.has(String(product.tiendanubeProductId)))
          .sort(
            (a, b) =>
              (ranking.get(String(b.tiendanubeProductId)) ?? 0) -
              (ranking.get(String(a.tiendanubeProductId)) ?? 0),
          )
      : filterStorefrontProducts(allProducts, view);
  const label = VIEW_LABELS[view] ?? VIEW_LABELS.lentes;

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-[#f0ece4]">
      {/* Inspiracional - featured products carousel */}
      <BrandCarousel
        key={`carousel-${view}`}
        products={visibleProducts}
        brand={label}
        showNav={false}
        semanticHeading={false}
      />

      <TrustHighlights />
      <BrandLogoStrip products={allProducts} />

      <div id="catalogo">
        <ProductGrid
          key={`grid-${view}`}
          products={visibleProducts}
          brandLabel={label}
          filterBy={view === "premium" ? "brand" : "collection"}
          searchProducts={allProducts}
          enableFacets
        />
      </div>
    </main>
  );
}

export default function TiendaClient() {
  return (
    <Suspense>
      <TiendaContent />
    </Suspense>
  );
}
