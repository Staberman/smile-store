import type { Metadata } from "next";
import BrandCarousel from "@/components/brand/BrandCarousel";
import ProductGrid from "@/components/brand/ProductGrid";
import CollectionLinks from "@/components/brand/CollectionLinks";
import { allProducts } from "@/lib/catalog";

export const metadata: Metadata = {
  title: "Christian Dior | Marcas Premium",
  description: "Lentes de sol Christian Dior — élégance parisienne. Importados con cristal mineral UV400.",
  alternates: { canonical: "/tienda/marcas/premium/christian-dior" },
};

const diorProducts = allProducts.filter((product) => product.brand === "Christian Dior");

export default function DiorPage() {
  return (
    <main className="bg-[#0a0a0a]">
      <BrandCarousel products={diorProducts} brand="Christian Dior" showNav={false} />
      <ProductGrid products={diorProducts} brandLabel="Colección Christian Dior" />
      <CollectionLinks current="premium" />
    </main>
  );
}
