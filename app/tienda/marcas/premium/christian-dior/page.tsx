import type { Metadata } from "next";
import BrandCarousel from "@/components/brand/BrandCarousel";
import ProductGrid from "@/components/brand/ProductGrid";
import CollectionLinks from "@/components/brand/CollectionLinks";
import { diorProducts } from "@/lib/products";

export const metadata: Metadata = {
  title: "Christian Dior | Marcas Premium | Smile",
  description: "Lentes de sol Christian Dior — élégance parisienne. Importados con cristal mineral UV400.",
};

export default function DiorPage() {
  return (
    <main className="bg-[#0a0a0a]">
      <BrandCarousel products={diorProducts} brand="Christian Dior" />
      <ProductGrid products={diorProducts} brandLabel="Colección Christian Dior" />
      <CollectionLinks current="premium" />
    </main>
  );
}
