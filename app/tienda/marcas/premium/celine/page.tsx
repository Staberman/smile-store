import type { Metadata } from "next";
import BrandCarousel from "@/components/brand/BrandCarousel";
import ProductGrid from "@/components/brand/ProductGrid";
import CollectionLinks from "@/components/brand/CollectionLinks";
import JsonLd from "@/components/seo/JsonLd";
import { allProducts } from "@/lib/catalog";
import { collectionSchema } from "@/lib/seo";

const celineProducts = allProducts.filter((product) => product.brand === "Celine Paris");
const celineSchema = collectionSchema(
  "/tienda/marcas/premium/celine",
  "Colección Celine Paris",
  celineProducts,
);

export const metadata: Metadata = {
  title: "Celine | Marcas Premium",
  description: "Lentes de sol Celine Paris — minimalismo parisino. Importados con cristal mineral UV400.",
  alternates: { canonical: "/tienda/marcas/premium/celine" },
  robots: {
    index: celineProducts.length > 0,
    follow: true,
  },
};

export default function CelinePage() {
  return (
    <main className="bg-[#0a0a0a]">
      {celineProducts.length > 0 && <JsonLd data={celineSchema} />}
      <BrandCarousel products={celineProducts} brand="Celine Paris" showNav={false} />
      <ProductGrid products={celineProducts} brandLabel="Colección Celine Paris" />
      <CollectionLinks current="premium" />
    </main>
  );
}
