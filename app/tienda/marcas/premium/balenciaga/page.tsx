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
  title: "Balenciaga | Marcas Premium",
  description: "Lentes de sol Balenciaga — editorial y futurista. Importados con cristal mineral UV400.",
  alternates: { canonical: "/tienda/marcas/premium/balenciaga" },
};

const isBalenciagaProduct = (product: CatalogProduct) => product.brand === "Balenciaga";
const balenciagaProducts = allProducts.filter(isBalenciagaProduct);
const balenciagaOutOfStock = outOfStockProducts.filter(isBalenciagaProduct);
const breadcrumbs = premiumBrandTrail("balenciaga");
const balenciagaSchema = collectionSchema("/tienda/marcas/premium/balenciaga", "Colección Balenciaga", balenciagaProducts, breadcrumbs);

const balenciagaSummaries = toProductSummaries(balenciagaProducts);

export default function BalenciagaPage() {
  return (
    <main className="bg-[#0a0a0a]">
      <JsonLd data={balenciagaSchema} />
      <Breadcrumbs trail={breadcrumbs} />
      <BrandCarousel products={balenciagaSummaries} brand="Balenciaga" showNav={false} />
      <ProductGrid products={balenciagaSummaries} brandLabel="Colección Balenciaga" />
      <OutOfStockProducts products={balenciagaOutOfStock} />
      <CollectionLinks current="premium" />
    </main>
  );
}
