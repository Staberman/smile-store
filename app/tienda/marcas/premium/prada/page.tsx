import type { Metadata } from "next";
import BrandCarousel from "@/components/brand/BrandCarousel";
import ProductGrid from "@/components/brand/ProductGrid";
import CollectionLinks from "@/components/brand/CollectionLinks";
import { pradaProducts } from "@/lib/products";

export const metadata: Metadata = {
  title: "Prada | Marcas Premium | Smile",
  description: "Lentes de sol Prada — Symbole y más. Importados, con cristal mineral UV400.",
};

export default function PradaPage() {
  return (
    <main className="bg-[#0a0a0a]">
      <BrandCarousel products={pradaProducts} brand="Prada" />
      <ProductGrid products={pradaProducts} brandLabel="Colección Prada" />
      <CollectionLinks current="premium" />
    </main>
  );
}
