import type { Metadata } from "next";
import BrandCarousel from "@/components/brand/BrandCarousel";
import ProductGrid from "@/components/brand/ProductGrid";
import CollectionLinks from "@/components/brand/CollectionLinks";
import { allProducts } from "@/lib/catalog";

export const metadata: Metadata = {
  title: "Louis Vuitton | Marcas Premium",
  description: "Lentes de sol Louis Vuitton — el arte de viajar con estilo. Importados con cristal mineral UV400.",
  alternates: { canonical: "/tienda/marcas/premium/louis-vuitton" },
};

const louisVuittonProducts = allProducts.filter((product) => product.brand === "Louis Vuitton");

export default function LouisVuittonPage() {
  return (
    <main className="bg-[#0a0a0a]">
      <BrandCarousel products={louisVuittonProducts} brand="Louis Vuitton" showNav={false} />
      <ProductGrid products={louisVuittonProducts} brandLabel="Colección Louis Vuitton" />
      <CollectionLinks current="premium" />
    </main>
  );
}
