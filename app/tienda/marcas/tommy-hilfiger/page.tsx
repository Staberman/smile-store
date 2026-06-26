import type { Metadata } from "next";
import BrandCarousel from "@/components/brand/BrandCarousel";
import ProductGrid from "@/components/brand/ProductGrid";
import CollectionLinks from "@/components/brand/CollectionLinks";
import { allProducts } from "@/lib/catalog";

export const metadata: Metadata = {
  title: "Relojes Tommy Hilfiger | Smile",
  description:
    "Relojes Tommy Hilfiger en Argentina. Modelos para dama y caballero con diseño americano contemporáneo y checkout seguro por Tiendanube.",
  alternates: {
    canonical: "/tienda/marcas/tommy-hilfiger",
  },
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
