import type { Metadata } from "next";
import BrandCarousel from "@/components/brand/BrandCarousel";
import ProductGrid from "@/components/brand/ProductGrid";
import CollectionLinks from "@/components/brand/CollectionLinks";
import JsonLd from "@/components/seo/JsonLd";
import { allProducts } from "@/lib/catalog";
import { toProductSummaries } from "@/lib/product-summary";
import { collectionSchema } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Gucci | Marcas Premium",
  description: "Lentes de sol Gucci — la casa florentina. Importados con cristal mineral UV400.",
  alternates: { canonical: "/tienda/marcas/premium/gucci" },
};

const gucciProducts = allProducts.filter((product) => product.brand === "Gucci");
const gucciSchema = collectionSchema("/tienda/marcas/premium/gucci", "Colección Gucci", gucciProducts);

const gucciSummaries = toProductSummaries(gucciProducts);

export default function GucciPage() {
  return (
    <main className="bg-[#0a0a0a]">
      <JsonLd data={gucciSchema} />
      <BrandCarousel products={gucciSummaries} brand="Gucci" showNav={false} />
      <ProductGrid products={gucciSummaries} brandLabel="Colección Gucci" />
      <CollectionLinks current="premium" />
    </main>
  );
}
