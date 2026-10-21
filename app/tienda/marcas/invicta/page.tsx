import type { Metadata } from "next";
import BrandCarousel from "@/components/brand/BrandCarousel";
import ProductGrid from "@/components/brand/ProductGrid";
import CollectionLinks from "@/components/brand/CollectionLinks";
import JsonLd from "@/components/seo/JsonLd";
import { allProducts } from "@/lib/catalog";
import { collectionSchema } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Invicta",
  description:
    "Relojes Invicta originales en Argentina. Pro Diver, cronógrafos y ediciones limitadas disponibles en Smile.",
  alternates: { canonical: "/tienda/marcas/invicta" },
};

const invictaProducts = allProducts.filter((product) => product.brand === "Invicta");
const invictaSchema = collectionSchema("/tienda/marcas/invicta", "Colección Invicta", invictaProducts);

export default function InvictaPage() {
  return (
    <main className="bg-[#0a0a0a]">
      <JsonLd data={invictaSchema} />
      <BrandCarousel products={invictaProducts} brand="Invicta" showNav={false} />
      <ProductGrid products={invictaProducts} brandLabel="Colección Invicta" />
      <CollectionLinks current="invicta" />
    </main>
  );
}
