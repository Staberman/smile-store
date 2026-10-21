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
  title: "Louis Vuitton | Marcas Premium",
  description: "Lentes de sol Louis Vuitton — el arte de viajar con estilo. Importados con cristal mineral UV400.",
  alternates: { canonical: "/tienda/marcas/premium/louis-vuitton" },
};

const isLouisVuittonProduct = (product: CatalogProduct) => product.brand === "Louis Vuitton";
const louisVuittonProducts = allProducts.filter(isLouisVuittonProduct);
const louisVuittonOutOfStock = outOfStockProducts.filter(isLouisVuittonProduct);
const breadcrumbs = premiumBrandTrail("louis-vuitton");
const louisVuittonSchema = collectionSchema("/tienda/marcas/premium/louis-vuitton", "Colección Louis Vuitton", louisVuittonProducts, breadcrumbs);

const louisVuittonSummaries = toProductSummaries(louisVuittonProducts);

export default function LouisVuittonPage() {
  return (
    <main className="bg-[#0a0a0a]">
      <JsonLd data={louisVuittonSchema} />
      <Breadcrumbs trail={breadcrumbs} />
      <BrandCarousel products={louisVuittonSummaries} brand="Louis Vuitton" showNav={false} />
      <ProductGrid products={louisVuittonSummaries} brandLabel="Colección Louis Vuitton" />
      <OutOfStockProducts products={louisVuittonOutOfStock} />
      <CollectionLinks current="premium" />
    </main>
  );
}
