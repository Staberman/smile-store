import type { Metadata } from "next";
import BrandCarousel from "@/components/brand/BrandCarousel";
import ProductGrid from "@/components/brand/ProductGrid";
import CollectionLinks from "@/components/brand/CollectionLinks";
import { cartierProducts } from "@/lib/products";

export const metadata: Metadata = {
  title: "Cartier | Marcas Premium | Smile",
  description: "Lentes de sol Cartier — la joyería del eyewear. Importados con cristal mineral UV400.",
};

export default function CartierPage() {
  return (
    <main className="bg-[#0a0a0a]">
      <BrandCarousel products={cartierProducts} brand="Cartier" />
      <ProductGrid products={cartierProducts} brandLabel="Colección Cartier" />
      <CollectionLinks current="premium" />
    </main>
  );
}
