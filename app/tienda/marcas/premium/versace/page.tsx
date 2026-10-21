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
  title: "Versace | Marcas Premium",
  description: "Lentes de sol Versace — audacia sin límites. Importados con cristal mineral UV400.",
  alternates: { canonical: "/tienda/marcas/premium/versace" },
};

const versaceProducts = allProducts.filter((product) => product.brand === "Versace");
const breadcrumbs = premiumBrandTrail("versace");
const versaceSchema = collectionSchema("/tienda/marcas/premium/versace", "Colección Versace", versaceProducts, breadcrumbs);

const versaceSummaries = toProductSummaries(versaceProducts);

export default function VersacePage() {
  return (
    <main className="bg-[#0a0a0a]">
      <JsonLd data={versaceSchema} />
      <Breadcrumbs trail={breadcrumbs} />
      <BrandCarousel products={versaceSummaries} brand="Versace" showNav={false} />
      <ProductGrid products={versaceSummaries} brandLabel="Colección Versace" />
      <CollectionLinks current="premium" />
    </main>
  );
}
