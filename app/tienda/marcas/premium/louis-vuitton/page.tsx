import type { Metadata } from "next";
import BrandCarousel from "@/components/brand/BrandCarousel";
import ProductGrid from "@/components/brand/ProductGrid";
import CollectionLinks from "@/components/brand/CollectionLinks";
import JsonLd from "@/components/seo/JsonLd";
import { allProducts } from "@/lib/catalog";
import { toProductSummaries } from "@/lib/product-summary";
import { collectionSchema } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Louis Vuitton | Marcas Premium",
  description: "Lentes de sol Louis Vuitton — el arte de viajar con estilo. Importados con cristal mineral UV400.",
  alternates: { canonical: "/tienda/marcas/premium/louis-vuitton" },
};

const louisVuittonProducts = allProducts.filter((product) => product.brand === "Louis Vuitton");
const louisVuittonSchema = collectionSchema("/tienda/marcas/premium/louis-vuitton", "Colección Louis Vuitton", louisVuittonProducts);

const louisVuittonSummaries = toProductSummaries(louisVuittonProducts);

export default function LouisVuittonPage() {
  return (
    <main className="bg-[#0a0a0a]">
      <JsonLd data={louisVuittonSchema} />
      <BrandCarousel products={louisVuittonSummaries} brand="Louis Vuitton" showNav={false} />
      <ProductGrid products={louisVuittonSummaries} brandLabel="Colección Louis Vuitton" />
      <CollectionLinks current="premium" />
    </main>
  );
}
