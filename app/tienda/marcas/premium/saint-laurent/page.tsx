import type { Metadata } from "next";
import BrandCarousel from "@/components/brand/BrandCarousel";
import ProductGrid from "@/components/brand/ProductGrid";
import CollectionLinks from "@/components/brand/CollectionLinks";
import { saintLaurentProducts } from "@/lib/products";

export const metadata: Metadata = {
  title: "Saint Laurent | Marcas Premium | Smile",
  description: "Lentes de sol Saint Laurent — rock & élégance parisina. Importados con cristal mineral UV400.",
};

export default function SaintLaurentPage() {
  return (
    <main className="bg-[#0a0a0a]">
      <BrandCarousel products={saintLaurentProducts} brand="Saint Laurent" />
      <ProductGrid products={saintLaurentProducts} brandLabel="Colección Saint Laurent" />
      <CollectionLinks current="premium" />
    </main>
  );
}
