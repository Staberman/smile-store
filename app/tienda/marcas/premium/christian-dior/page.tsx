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
  title: "Christian Dior | Marcas Premium",
  description: "Lentes de sol Christian Dior — élégance parisienne. Importados con cristal mineral UV400.",
  alternates: { canonical: "/tienda/marcas/premium/christian-dior" },
};

const isDiorProduct = (product: CatalogProduct) => product.brand === "Christian Dior";
const diorProducts = allProducts.filter(isDiorProduct);
const diorOutOfStock = outOfStockProducts.filter(isDiorProduct);
const breadcrumbs = premiumBrandTrail("christian-dior");
const diorSchema = collectionSchema("/tienda/marcas/premium/christian-dior", "Colección Christian Dior", diorProducts, breadcrumbs);

const diorSummaries = toProductSummaries(diorProducts);

export default function DiorPage() {
  return (
    <main className="bg-[#0a0a0a]">
      <JsonLd data={diorSchema} />
      <Breadcrumbs trail={breadcrumbs} />
      <BrandCarousel products={diorSummaries} brand="Christian Dior" showNav={false} />
      <ProductGrid products={diorSummaries} brandLabel="Colección Christian Dior" />
      <OutOfStockProducts products={diorOutOfStock} />
      <CollectionLinks current="premium" />
    </main>
  );
}
