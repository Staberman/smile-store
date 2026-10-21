import type { Metadata } from "next";
import BrandCarousel from "@/components/brand/BrandCarousel";
import ProductGrid from "@/components/brand/ProductGrid";
import CollectionLinks from "@/components/brand/CollectionLinks";
import Breadcrumbs from "@/components/layout/Breadcrumbs";
import JsonLd from "@/components/seo/JsonLd";
import { allProducts } from "@/lib/catalog";
import { COLLECTION_TRAILS } from "@/lib/collections";
import { toProductSummaries } from "@/lib/product-summary";
import { collectionSchema } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Invicta",
  description:
    "Relojes Invicta originales en Argentina. Pro Diver, cronógrafos y ediciones limitadas disponibles en Smile.",
  alternates: { canonical: "/tienda/marcas/invicta" },
};

const invictaProducts = allProducts.filter((product) => product.brand === "Invicta");
const invictaSchema = collectionSchema("/tienda/marcas/invicta", "Colección Invicta", invictaProducts, COLLECTION_TRAILS.invicta);

const invictaSummaries = toProductSummaries(invictaProducts);

export default function InvictaPage() {
  return (
    <main className="bg-[#0a0a0a]">
      <JsonLd data={invictaSchema} />
      <Breadcrumbs trail={COLLECTION_TRAILS.invicta} />
      <BrandCarousel products={invictaSummaries} brand="Invicta" showNav={false} />
      <ProductGrid products={invictaSummaries} brandLabel="Colección Invicta" />
      <CollectionLinks current="invicta" />
    </main>
  );
}
