import type { Metadata } from "next";
import BrandCarousel from "@/components/brand/BrandCarousel";
import ProductGrid from "@/components/brand/ProductGrid";
import CollectionLinks from "@/components/brand/CollectionLinks";
import { celineProducts } from "@/lib/products";

export const metadata: Metadata = {
  title: "Celine | Marcas Premium | Smile",
  description: "Lentes de sol Celine Paris — minimalismo parisino. Importados con cristal mineral UV400.",
};

export default function CelinePage() {
  return (
    <main className="bg-[#0a0a0a]">
      <BrandCarousel products={celineProducts} brand="Celine Paris" />
      <ProductGrid products={celineProducts} brandLabel="Colección Celine Paris" />
      <CollectionLinks current="premium" />
    </main>
  );
}
