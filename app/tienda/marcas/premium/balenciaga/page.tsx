import type { Metadata } from "next";
import BrandCarousel from "@/components/brand/BrandCarousel";
import ProductGrid from "@/components/brand/ProductGrid";
import CollectionLinks from "@/components/brand/CollectionLinks";
import { balenciagaProducts } from "@/lib/products";

export const metadata: Metadata = {
  title: "Balenciaga | Marcas Premium | Smile",
  description: "Lentes de sol Balenciaga — editorial y futurista. Importados con cristal mineral UV400.",
};

export default function BalenciagaPage() {
  return (
    <main className="bg-[#0a0a0a]">
      <BrandCarousel products={balenciagaProducts} brand="Balenciaga" />
      <ProductGrid products={balenciagaProducts} brandLabel="Colección Balenciaga" />
      <CollectionLinks current="premium" />
    </main>
  );
}
