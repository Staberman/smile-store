import type { Metadata } from "next";
import BrandCarousel from "@/components/brand/BrandCarousel";
import ProductGrid from "@/components/brand/ProductGrid";
import CollectionLinks from "@/components/brand/CollectionLinks";
import { allProducts } from "@/lib/catalog";

export const metadata: Metadata = {
  title: "Cartier | Marcas Premium",
  description: "Lentes de sol Cartier — la joyería del eyewear. Importados con cristal mineral UV400.",
  alternates: { canonical: "/tienda/marcas/premium/cartier" },
};

const cartierProducts = allProducts.filter((product) => product.brand === "Cartier");

export default function CartierPage() {
  return (
    <main className="bg-[#0a0a0a]">
      <BrandCarousel products={cartierProducts} brand="Cartier" showNav={false} />
      <ProductGrid products={cartierProducts} brandLabel="Colección Cartier" />
      <CollectionLinks current="premium" />
    </main>
  );
}
