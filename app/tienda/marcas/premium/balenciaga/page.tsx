import type { Metadata } from "next";
import BrandCarousel from "@/components/brand/BrandCarousel";
import ProductGrid from "@/components/brand/ProductGrid";
import CollectionLinks from "@/components/brand/CollectionLinks";
import JsonLd from "@/components/seo/JsonLd";
import { allProducts } from "@/lib/catalog";
import { toProductSummaries } from "@/lib/product-summary";
import { collectionSchema } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Balenciaga | Marcas Premium",
  description: "Lentes de sol Balenciaga — editorial y futurista. Importados con cristal mineral UV400.",
  alternates: { canonical: "/tienda/marcas/premium/balenciaga" },
};

const balenciagaProducts = allProducts.filter((product) => product.brand === "Balenciaga");
const balenciagaSchema = collectionSchema("/tienda/marcas/premium/balenciaga", "Colección Balenciaga", balenciagaProducts);

const balenciagaSummaries = toProductSummaries(balenciagaProducts);

export default function BalenciagaPage() {
  return (
    <main className="bg-[#0a0a0a]">
      <JsonLd data={balenciagaSchema} />
      <BrandCarousel products={balenciagaSummaries} brand="Balenciaga" showNav={false} />
      <ProductGrid products={balenciagaSummaries} brandLabel="Colección Balenciaga" />
      <CollectionLinks current="premium" />
    </main>
  );
}
