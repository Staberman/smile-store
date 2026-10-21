import type { Metadata } from "next";
import BrandCarousel from "@/components/brand/BrandCarousel";
import ProductGrid from "@/components/brand/ProductGrid";
import CollectionLinks from "@/components/brand/CollectionLinks";
import Breadcrumbs from "@/components/layout/Breadcrumbs";
import JsonLd from "@/components/seo/JsonLd";
import { allProducts } from "@/lib/catalog";
import { premiumBrandTrail } from "@/lib/collections";
import { toProductSummaries } from "@/lib/product-summary";
import { collectionSchema } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Fendi | Marcas Premium",
  description: "Lentes de sol Fendi — la doble F romana. Importados con cristal mineral UV400.",
  alternates: { canonical: "/tienda/marcas/premium/fendi" },
};

const fendiProducts = allProducts.filter((product) => product.brand === "Fendi");
const breadcrumbs = premiumBrandTrail("fendi");
const fendiSchema = collectionSchema("/tienda/marcas/premium/fendi", "Colección Fendi", fendiProducts, breadcrumbs);

const fendiSummaries = toProductSummaries(fendiProducts);

export default function FendiPage() {
  return (
    <main className="bg-[#0a0a0a]">
      <JsonLd data={fendiSchema} />
      <Breadcrumbs trail={breadcrumbs} />
      <BrandCarousel products={fendiSummaries} brand="Fendi" showNav={false} />
      <ProductGrid products={fendiSummaries} brandLabel="Colección Fendi" />
      <CollectionLinks current="premium" />
    </main>
  );
}
