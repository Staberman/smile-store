import type { Metadata } from "next";
import BrandCarousel from "@/components/brand/BrandCarousel";
import ProductGrid from "@/components/brand/ProductGrid";
import CollectionLinks from "@/components/brand/CollectionLinks";
import JsonLd from "@/components/seo/JsonLd";
import { allProducts } from "@/lib/catalog";
import { toProductSummaries } from "@/lib/product-summary";
import { collectionSchema } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Relojes Tommy Hilfiger",
  description:
    "Relojes Tommy Hilfiger en Argentina. Modelos para dama y caballero con diseño americano contemporáneo y checkout seguro por Tiendanube.",
  alternates: {
    canonical: "/tienda/marcas/tommy-hilfiger",
  },
};

const tommyProducts = allProducts.filter((product) => product.brand === "Tommy Hilfiger");
const tommySchema = collectionSchema("/tienda/marcas/tommy-hilfiger", "Colección Tommy Hilfiger", tommyProducts);

const tommySummaries = toProductSummaries(tommyProducts);

export default function TommyHilfigerPage() {
  return (
    <main className="bg-[#0a0a0a]">
      <JsonLd data={tommySchema} />
      <BrandCarousel products={tommySummaries} brand="Tommy Hilfiger" showNav={false} />
      <ProductGrid products={tommySummaries} brandLabel="Colección Tommy Hilfiger" />
      <CollectionLinks current="tommy-hilfiger" />
    </main>
  );
}
