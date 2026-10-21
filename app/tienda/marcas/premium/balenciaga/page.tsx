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
  title: "Balenciaga | Marcas Premium",
  description: "Lentes de sol Balenciaga — editorial y futurista. Importados con cristal mineral UV400.",
  alternates: { canonical: "/tienda/marcas/premium/balenciaga" },
};

const balenciagaProducts = allProducts.filter((product) => product.brand === "Balenciaga");
const breadcrumbs = premiumBrandTrail("balenciaga");
const balenciagaSchema = collectionSchema("/tienda/marcas/premium/balenciaga", "Colección Balenciaga", balenciagaProducts, breadcrumbs);

const balenciagaSummaries = toProductSummaries(balenciagaProducts);

export default function BalenciagaPage() {
  return (
    <main className="bg-[#0a0a0a]">
      <JsonLd data={balenciagaSchema} />
      <Breadcrumbs trail={breadcrumbs} />
      <BrandCarousel products={balenciagaSummaries} brand="Balenciaga" showNav={false} />
      <ProductGrid products={balenciagaSummaries} brandLabel="Colección Balenciaga" />
      <CollectionLinks current="premium" />
    </main>
  );
}
