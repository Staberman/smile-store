import type { Metadata } from "next";
import BrandCarousel from "@/components/brand/BrandCarousel";
import ProductGrid from "@/components/brand/ProductGrid";
import CollectionLinks from "@/components/brand/CollectionLinks";
import { allProducts } from "@/lib/catalog";

export const metadata: Metadata = {
  title: "Tommy Hilfiger | Smile",
  description:
    "Lentes Tommy Hilfiger en Argentina. Diseño americano contemporáneo con identidad de moda propia.",
};

const tommyProducts = allProducts.filter((product) => product.brand === "Tommy Hilfiger");

export default function TommyHilfigerPage() {
  return (
    <main className="bg-[#0a0a0a]">
      <BrandCarousel products={tommyProducts} brand="Tommy Hilfiger" />
      <ProductGrid products={tommyProducts} brandLabel="Colección Tommy Hilfiger" />
      <CollectionLinks current="tommy-hilfiger" />
    </main>
  );
}
