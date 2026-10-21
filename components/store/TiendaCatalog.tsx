import ProductGrid from "@/components/brand/ProductGrid";
import BrandCarousel from "@/components/brand/BrandCarousel";
import BrandLogoStrip from "@/components/brand/BrandLogoStrip";
import TrustHighlights from "@/components/brand/TrustHighlights";
import { allProducts } from "@/lib/catalog";
import { filterStorefrontProducts } from "@/lib/storefront.mjs";
import salesRanking from "@/data/tiendanube-sales-ranking.json";
import { DEFAULT_STORE_VIEW } from "./storeView";

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

/**
 * Store catalog for a given view. Pure: it does not read the URL, so it can
 * be server-rendered (e.g. as a Suspense fallback) for crawlers without JS.
 */
export default function TiendaCatalog({
  view,
  animateEntrance = true,
}: {
  view: string;
  animateEntrance?: boolean;
}) {
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
  const label = VIEW_LABELS[view] ?? VIEW_LABELS[DEFAULT_STORE_VIEW];

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
          animateEntrance={animateEntrance}
        />
      </div>
    </main>
  );
}
