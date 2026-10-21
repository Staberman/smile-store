import type { Metadata } from "next";
import BrandCarousel from "@/components/brand/BrandCarousel";
import ProductGrid from "@/components/brand/ProductGrid";
import CollectionLinks from "@/components/brand/CollectionLinks";
import JsonLd from "@/components/seo/JsonLd";
import { allProducts } from "@/lib/catalog";
import { collectionSchema } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Dolce&Gabbana | Marcas Premium",
  description: "Lentes de sol Dolce&Gabbana — el mediterráneo hecho moda. Importados con cristal mineral UV400.",
  alternates: { canonical: "/tienda/marcas/premium/dolce-gabbana" },
};

const dolceGabbanaProducts = allProducts.filter((product) => product.brand === "Dolce&Gabbana");
const dolceGabbanaSchema = collectionSchema("/tienda/marcas/premium/dolce-gabbana", "Colección Dolce&Gabbana", dolceGabbanaProducts);

export default function DolceGabbanaPage() {
  return (
    <main className="bg-[#0a0a0a]">
      <JsonLd data={dolceGabbanaSchema} />
      <BrandCarousel products={dolceGabbanaProducts} brand="Dolce&Gabbana" showNav={false} />
      <ProductGrid products={dolceGabbanaProducts} brandLabel="Colección Dolce&Gabbana" />
      <CollectionLinks current="premium" />
    </main>
  );
}
