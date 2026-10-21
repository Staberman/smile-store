import type { Metadata } from "next";
import BrandCarousel from "@/components/brand/BrandCarousel";
import ProductGrid from "@/components/brand/ProductGrid";
import CollectionLinks from "@/components/brand/CollectionLinks";
import JsonLd from "@/components/seo/JsonLd";
import { allProducts } from "@/lib/catalog";
import { toProductSummaries } from "@/lib/product-summary";
import { collectionSchema } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Saint Laurent | Marcas Premium",
  description: "Lentes de sol Saint Laurent — rock & élégance parisina. Importados con cristal mineral UV400.",
  alternates: { canonical: "/tienda/marcas/premium/saint-laurent" },
};

const saintLaurentProducts = allProducts.filter((product) => product.brand === "Saint Laurent");
const saintLaurentSchema = collectionSchema("/tienda/marcas/premium/saint-laurent", "Colección Saint Laurent", saintLaurentProducts);

const saintLaurentSummaries = toProductSummaries(saintLaurentProducts);

export default function SaintLaurentPage() {
  return (
    <main className="bg-[#0a0a0a]">
      <JsonLd data={saintLaurentSchema} />
      <BrandCarousel products={saintLaurentSummaries} brand="Saint Laurent" showNav={false} />
      <ProductGrid products={saintLaurentSummaries} brandLabel="Colección Saint Laurent" />
      <CollectionLinks current="premium" />
    </main>
  );
}
