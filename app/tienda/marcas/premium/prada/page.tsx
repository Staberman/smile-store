import type { Metadata } from "next";
import BrandCarousel from "@/components/brand/BrandCarousel";
import ProductGrid from "@/components/brand/ProductGrid";
import CollectionLinks from "@/components/brand/CollectionLinks";
import { allProducts } from "@/lib/catalog";

export const metadata: Metadata = {
  title: "Prada | Marcas Premium",
  description: "Lentes de sol Prada — Symbole y más. Importados, con cristal mineral UV400.",
  alternates: { canonical: "/tienda/marcas/premium/prada" },
};

const pradaProducts = allProducts.filter((product) => product.brand === "Prada");

export default function PradaPage() {
  return (
    <main className="bg-[#0a0a0a]">
      <BrandCarousel products={pradaProducts} brand="Prada" showNav={false} />
      <ProductGrid products={pradaProducts} brandLabel="Colección Prada" />
      <CollectionLinks current="premium" />
    </main>
  );
}
