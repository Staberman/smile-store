import type { Metadata } from "next";
import BrandCarousel from "@/components/brand/BrandCarousel";
import ProductGrid from "@/components/brand/ProductGrid";
import CollectionLinks from "@/components/brand/CollectionLinks";
import OutOfStockProducts from "@/components/brand/OutOfStockProducts";
import Breadcrumbs from "@/components/layout/Breadcrumbs";
import JsonLd from "@/components/seo/JsonLd";
import { allProducts, outOfStockProducts, type CatalogProduct } from "@/lib/catalog";
import { premiumBrandTrail } from "@/lib/collections";
import { toProductSummaries } from "@/lib/product-summary";
import { collectionSchema } from "@/lib/seo";

const isCelineProduct = (product: CatalogProduct) => product.brand === "Celine Paris";
const celineProducts = allProducts.filter(isCelineProduct);
const celineOutOfStock = outOfStockProducts.filter(isCelineProduct);
const breadcrumbs = premiumBrandTrail("celine");
const celineSchema = collectionSchema(
  "/tienda/marcas/premium/celine",
  "Colección Celine Paris",
  celineProducts,
  breadcrumbs,
);

export const metadata: Metadata = {
  title: "Celine | Marcas Premium",
  description: "Lentes de sol Celine Paris — minimalismo parisino. Importados con cristal mineral UV400.",
  alternates: { canonical: "/tienda/marcas/premium/celine" },
  robots: {
    index: celineProducts.length > 0,
    follow: true,
  },
};

const celineSummaries = toProductSummaries(celineProducts);

export default function CelinePage() {
  return (
    <main className="bg-[#0a0a0a]">
      {celineProducts.length > 0 && <JsonLd data={celineSchema} />}
      <Breadcrumbs trail={breadcrumbs} />
      <BrandCarousel products={celineSummaries} brand="Celine Paris" showNav={false} />
      <ProductGrid products={celineSummaries} brandLabel="Colección Celine Paris" />
      <OutOfStockProducts products={celineOutOfStock} />
      <CollectionLinks current="premium" />
    </main>
  );
}
