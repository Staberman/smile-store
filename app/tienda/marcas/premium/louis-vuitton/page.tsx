import type { Metadata } from "next";
import BrandCarousel from "@/components/brand/BrandCarousel";
import ProductGrid from "@/components/brand/ProductGrid";
import CollectionLinks from "@/components/brand/CollectionLinks";
import { louisVuittonProducts } from "@/lib/products";

export const metadata: Metadata = {
  title: "Louis Vuitton | Marcas Premium | Smile",
  description: "Lentes de sol Louis Vuitton — el arte de viajar con estilo. Importados con cristal mineral UV400.",
};

export default function LouisVuittonPage() {
  return (
    <main className="bg-[#0a0a0a]">
      <BrandCarousel products={louisVuittonProducts} brand="Louis Vuitton" />
      <ProductGrid products={louisVuittonProducts} brandLabel="Colección Louis Vuitton" />
      <CollectionLinks current="premium" />
    </main>
  );
}
