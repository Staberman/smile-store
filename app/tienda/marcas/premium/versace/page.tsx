import type { Metadata } from "next";
import BrandCarousel from "@/components/brand/BrandCarousel";
import ProductGrid from "@/components/brand/ProductGrid";
import CollectionLinks from "@/components/brand/CollectionLinks";
import { allProducts } from "@/lib/catalog";

export const metadata: Metadata = {
  title: "Versace | Marcas Premium | Smile",
  description: "Lentes de sol Versace — audacia sin límites. Importados con cristal mineral UV400.",
};

const versaceProducts = allProducts.filter((product) => product.brand === "Versace");

export default function VersacePage() {
  return (
    <main className="bg-[#0a0a0a]">
      <BrandCarousel products={versaceProducts} brand="Versace" />
      <ProductGrid products={versaceProducts} brandLabel="Colección Versace" />
      <CollectionLinks current="premium" />
    </main>
  );
}
