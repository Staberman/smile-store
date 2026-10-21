import type { Metadata } from "next";
import BrandCarousel from "@/components/brand/BrandCarousel";
import ProductGrid from "@/components/brand/ProductGrid";
import CollectionLinks from "@/components/brand/CollectionLinks";
import JsonLd from "@/components/seo/JsonLd";
import { allProducts } from "@/lib/catalog";
import { toProductSummaries } from "@/lib/product-summary";
import { collectionSchema } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Prada | Marcas Premium",
  description: "Lentes de sol Prada — Symbole y más. Importados, con cristal mineral UV400.",
  alternates: { canonical: "/tienda/marcas/premium/prada" },
};

const pradaProducts = allProducts.filter((product) => product.brand === "Prada");
const pradaSchema = collectionSchema("/tienda/marcas/premium/prada", "Colección Prada", pradaProducts);

const pradaSummaries = toProductSummaries(pradaProducts);

export default function PradaPage() {
  return (
    <main className="bg-[#0a0a0a]">
      <JsonLd data={pradaSchema} />
      <BrandCarousel products={pradaSummaries} brand="Prada" showNav={false} />
      <ProductGrid products={pradaSummaries} brandLabel="Colección Prada" />
      <CollectionLinks current="premium" />
    </main>
  );
}
