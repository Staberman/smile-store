import type { Metadata } from "next";
import BrandCarousel from "@/components/brand/BrandCarousel";
import ProductGrid from "@/components/brand/ProductGrid";
import CollectionLinks from "@/components/brand/CollectionLinks";
import JsonLd from "@/components/seo/JsonLd";
import { allProducts } from "@/lib/catalog";
import { collectionSchema } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Saint Laurent | Marcas Premium",
  description: "Lentes de sol Saint Laurent — rock & élégance parisina. Importados con cristal mineral UV400.",
  alternates: { canonical: "/tienda/marcas/premium/saint-laurent" },
};

const saintLaurentProducts = allProducts.filter((product) => product.brand === "Saint Laurent");
const saintLaurentSchema = collectionSchema("/tienda/marcas/premium/saint-laurent", "Colección Saint Laurent", saintLaurentProducts);

export default function SaintLaurentPage() {
  return (
    <main className="bg-[#0a0a0a]">
      <JsonLd data={saintLaurentSchema} />
      <BrandCarousel products={saintLaurentProducts} brand="Saint Laurent" showNav={false} />
      <ProductGrid products={saintLaurentProducts} brandLabel="Colección Saint Laurent" />
      <CollectionLinks current="premium" />
    </main>
  );
}
