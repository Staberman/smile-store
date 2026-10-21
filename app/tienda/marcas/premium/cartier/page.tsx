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
  title: "Cartier | Marcas Premium",
  description: "Lentes de sol Cartier — la joyería del eyewear. Importados con cristal mineral UV400.",
  alternates: { canonical: "/tienda/marcas/premium/cartier" },
};

const cartierProducts = allProducts.filter((product) => product.brand === "Cartier");
const breadcrumbs = premiumBrandTrail("cartier");
const cartierSchema = collectionSchema("/tienda/marcas/premium/cartier", "Colección Cartier", cartierProducts, breadcrumbs);

const cartierSummaries = toProductSummaries(cartierProducts);

export default function CartierPage() {
  return (
    <main className="bg-[#0a0a0a]">
      <JsonLd data={cartierSchema} />
      <Breadcrumbs trail={breadcrumbs} />
      <BrandCarousel products={cartierSummaries} brand="Cartier" showNav={false} />
      <ProductGrid products={cartierSummaries} brandLabel="Colección Cartier" />
      <CollectionLinks current="premium" />
    </main>
  );
}
