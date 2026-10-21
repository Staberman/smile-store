import type { Metadata } from "next";
import BrandCarousel from "@/components/brand/BrandCarousel";
import ProductGrid from "@/components/brand/ProductGrid";
import CollectionLinks from "@/components/brand/CollectionLinks";
import OutOfStockProducts from "@/components/brand/OutOfStockProducts";
import Breadcrumbs from "@/components/layout/Breadcrumbs";
import JsonLd from "@/components/seo/JsonLd";
import { allProducts, outOfStockProducts, type CatalogProduct } from "@/lib/catalog";
import { COLLECTION_TRAILS } from "@/lib/collections";
import { toProductSummaries } from "@/lib/product-summary";
import { collectionSchema } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Relojes Tommy Hilfiger",
  description:
    "Relojes Tommy Hilfiger en Argentina. Modelos para dama y caballero con diseño americano contemporáneo y checkout seguro por Tiendanube.",
  alternates: {
    canonical: "/tienda/marcas/tommy-hilfiger",
  },
};

const isTommyProduct = (product: CatalogProduct) => product.brand === "Tommy Hilfiger";
const tommyProducts = allProducts.filter(isTommyProduct);
const tommyOutOfStock = outOfStockProducts.filter(isTommyProduct);
const tommySchema = collectionSchema("/tienda/marcas/tommy-hilfiger", "Colección Tommy Hilfiger", tommyProducts, COLLECTION_TRAILS["tommy-hilfiger"]);

const tommySummaries = toProductSummaries(tommyProducts);

export default function TommyHilfigerPage() {
  return (
    <main className="bg-[#0a0a0a]">
      <JsonLd data={tommySchema} />
      <Breadcrumbs trail={COLLECTION_TRAILS["tommy-hilfiger"]} />
      <BrandCarousel products={tommySummaries} brand="Tommy Hilfiger" showNav={false} />
      <ProductGrid products={tommySummaries} brandLabel="Colección Tommy Hilfiger" />
      <OutOfStockProducts products={tommyOutOfStock} />
      <CollectionLinks current="tommy-hilfiger" />
    </main>
  );
}
