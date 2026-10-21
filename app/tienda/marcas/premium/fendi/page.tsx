import type { Metadata } from "next";
import BrandCarousel from "@/components/brand/BrandCarousel";
import ProductGrid from "@/components/brand/ProductGrid";
import CollectionLinks from "@/components/brand/CollectionLinks";
import JsonLd from "@/components/seo/JsonLd";
import { allProducts } from "@/lib/catalog";
import { collectionSchema } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Fendi | Marcas Premium",
  description: "Lentes de sol Fendi — la doble F romana. Importados con cristal mineral UV400.",
  alternates: { canonical: "/tienda/marcas/premium/fendi" },
};

const fendiProducts = allProducts.filter((product) => product.brand === "Fendi");
const fendiSchema = collectionSchema("/tienda/marcas/premium/fendi", "Colección Fendi", fendiProducts);

export default function FendiPage() {
  return (
    <main className="bg-[#0a0a0a]">
      <JsonLd data={fendiSchema} />
      <BrandCarousel products={fendiProducts} brand="Fendi" showNav={false} />
      <ProductGrid products={fendiProducts} brandLabel="Colección Fendi" />
      <CollectionLinks current="premium" />
    </main>
  );
}
