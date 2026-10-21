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

export const metadata: Metadata = {
  title: "Gucci | Marcas Premium",
  description: "Lentes de sol Gucci — la casa florentina. Importados con cristal mineral UV400.",
  alternates: { canonical: "/tienda/marcas/premium/gucci" },
};

const isGucciProduct = (product: CatalogProduct) => product.brand === "Gucci";
const gucciProducts = allProducts.filter(isGucciProduct);
const gucciOutOfStock = outOfStockProducts.filter(isGucciProduct);
const breadcrumbs = premiumBrandTrail("gucci");
const gucciSchema = collectionSchema("/tienda/marcas/premium/gucci", "Colección Gucci", gucciProducts, breadcrumbs);

const gucciSummaries = toProductSummaries(gucciProducts);

export default function GucciPage() {
  return (
    <main className="bg-[#0a0a0a]">
      <JsonLd data={gucciSchema} />
      <Breadcrumbs trail={breadcrumbs} />
      <BrandCarousel products={gucciSummaries} brand="Gucci" showNav={false} />
      <ProductGrid products={gucciSummaries} brandLabel="Colección Gucci" />
      <OutOfStockProducts products={gucciOutOfStock} />
      <CollectionLinks current="premium" />
    </main>
  );
}
