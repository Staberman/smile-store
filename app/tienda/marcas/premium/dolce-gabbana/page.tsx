import type { Metadata } from "next";
import BrandCarousel from "@/components/brand/BrandCarousel";
import ProductGrid from "@/components/brand/ProductGrid";
import CollectionLinks from "@/components/brand/CollectionLinks";
import { dolceGabbanaProducts } from "@/lib/products";

export const metadata: Metadata = {
  title: "Dolce&Gabbana | Marcas Premium | Smile",
  description: "Lentes de sol Dolce&Gabbana — el mediterráneo hecho moda. Importados con cristal mineral UV400.",
};

export default function DolceGabbanaPage() {
  return (
    <main className="bg-[#0a0a0a]">
      <BrandCarousel products={dolceGabbanaProducts} brand="Dolce&Gabbana" />
      <ProductGrid products={dolceGabbanaProducts} brandLabel="Colección Dolce&Gabbana" />
      <CollectionLinks current="premium" />
    </main>
  );
}
