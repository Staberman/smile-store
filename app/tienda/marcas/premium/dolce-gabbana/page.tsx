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
  title: "Dolce&Gabbana | Marcas Premium",
  description: "Lentes de sol Dolce&Gabbana — el mediterráneo hecho moda. Importados con cristal mineral UV400.",
  alternates: { canonical: "/tienda/marcas/premium/dolce-gabbana" },
};

const isDolceGabbanaProduct = (product: CatalogProduct) => product.brand === "Dolce&Gabbana";
const dolceGabbanaProducts = allProducts.filter(isDolceGabbanaProduct);
const dolceGabbanaOutOfStock = outOfStockProducts.filter(isDolceGabbanaProduct);
const breadcrumbs = premiumBrandTrail("dolce-gabbana");
const dolceGabbanaSchema = collectionSchema("/tienda/marcas/premium/dolce-gabbana", "Colección Dolce&Gabbana", dolceGabbanaProducts, breadcrumbs);

const dolceGabbanaSummaries = toProductSummaries(dolceGabbanaProducts);

export default function DolceGabbanaPage() {
  return (
    <main className="bg-[#0a0a0a]">
      <JsonLd data={dolceGabbanaSchema} />
      <Breadcrumbs trail={breadcrumbs} />
      <BrandCarousel products={dolceGabbanaSummaries} brand="Dolce&Gabbana" showNav={false} />
      <ProductGrid products={dolceGabbanaSummaries} brandLabel="Colección Dolce&Gabbana" />
      <OutOfStockProducts products={dolceGabbanaOutOfStock} />
      <CollectionLinks current="premium" />
    </main>
  );
}
