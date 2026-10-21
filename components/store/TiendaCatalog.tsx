import ProductGrid from "@/components/brand/ProductGrid";
import BrandCarousel from "@/components/brand/BrandCarousel";
import BrandLogoStrip from "@/components/brand/BrandLogoStrip";
import TrustHighlights from "@/components/brand/TrustHighlights";
import type { ProductSummary } from "@/lib/product-summary";
import { filterStorefrontProducts } from "@/lib/storefront.mjs";
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

/**
 * Store catalog for a given view. Pure: it does not read the URL, so it can
 * be server-rendered (e.g. as a Suspense fallback) for crawlers without JS.
 * `products` is the purchasable catalog as slim summaries; the best-sellers
 * order is computed on the server, where the sales ranking lives.
 */
export default function TiendaCatalog({
  view,
  products,
  bestSellerSlugs,
  animateEntrance = true,
}: {
  view: string;
  products: ProductSummary[];
  bestSellerSlugs: string[];
  animateEntrance?: boolean;
}) {
  const visibleProducts =
    view === "best-sellers"
      ? getBestSellers(products, bestSellerSlugs)
      : filterStorefrontProducts(products, view);
  const label = VIEW_LABELS[view] ?? VIEW_LABELS[DEFAULT_STORE_VIEW];

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
      <BrandLogoStrip products={products} />

      <div id="catalogo">
        <ProductGrid
          key={`grid-${view}`}
          products={visibleProducts}
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

function getBestSellers(products: ProductSummary[], slugs: string[]): ProductSummary[] {
  const bySlug = new Map(products.map((product) => [product.slug, product]));
  return slugs.flatMap((slug) => bySlug.get(slug) ?? []);
}
