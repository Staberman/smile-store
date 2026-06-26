import type { Metadata } from "next";
import BrandCarousel from "@/components/brand/BrandCarousel";
import ProductGrid from "@/components/brand/ProductGrid";
import CollectionLinks from "@/components/brand/CollectionLinks";
import { allProducts } from "@/lib/catalog";

export const metadata: Metadata = {
  title: "Celine | Marcas Premium",
  description: "Lentes de sol Celine Paris — minimalismo parisino. Importados con cristal mineral UV400.",
};

const celineProducts = allProducts.filter((product) => product.brand === "Celine Paris");

export default function CelinePage() {
  return (
    <main className="bg-[#0a0a0a]">
      <BrandCarousel products={celineProducts} brand="Celine Paris" showNav={false} />
      <ProductGrid products={celineProducts} brandLabel="Colección Celine Paris" />
      <CollectionLinks current="premium" />
    </main>
  );
}
