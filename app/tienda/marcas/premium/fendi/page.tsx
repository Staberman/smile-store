import type { Metadata } from "next";
import BrandCarousel from "@/components/brand/BrandCarousel";
import ProductGrid from "@/components/brand/ProductGrid";
import CollectionLinks from "@/components/brand/CollectionLinks";
import { fendiProducts } from "@/lib/products";

export const metadata: Metadata = {
  title: "Fendi | Marcas Premium | Smile",
  description: "Lentes de sol Fendi — la doble F romana. Importados con cristal mineral UV400.",
};

export default function FendiPage() {
  return (
    <main className="bg-[#0a0a0a]">
      <BrandCarousel products={fendiProducts} brand="Fendi" />
      <ProductGrid products={fendiProducts} brandLabel="Colección Fendi" />
      <CollectionLinks current="premium" />
    </main>
  );
}
