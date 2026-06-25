import type { Metadata } from "next";
import BrandCarousel from "@/components/brand/BrandCarousel";
import ProductGrid from "@/components/brand/ProductGrid";
import CollectionLinks from "@/components/brand/CollectionLinks";
import { allProducts } from "@/lib/catalog";

export const metadata: Metadata = {
  title: "Gucci | Marcas Premium | Smile",
  description: "Lentes de sol Gucci — la casa florentina. Importados con cristal mineral UV400.",
};

const gucciProducts = allProducts.filter((product) => product.brand === "Gucci");

export default function GucciPage() {
  return (
    <main className="bg-[#0a0a0a]">
      <BrandCarousel products={gucciProducts} brand="Gucci" />
      <ProductGrid products={gucciProducts} brandLabel="Colección Gucci" />
      <CollectionLinks current="premium" />
    </main>
  );
}
