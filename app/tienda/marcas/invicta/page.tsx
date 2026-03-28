import type { Metadata } from "next";
import BrandCarousel from "@/components/brand/BrandCarousel";
import ProductGrid from "@/components/brand/ProductGrid";
import CollectionLinks from "@/components/brand/CollectionLinks";
import { invictaProducts } from "@/lib/products";

export const metadata: Metadata = {
  title: "Invicta | Smile",
  description:
    "Relojes Invicta originales en Argentina. Pro Diver, cronógrafos y ediciones limitadas disponibles en Smile.",
};

export default function InvictaPage() {
  return (
    <main className="bg-[#0a0a0a]">
      <BrandCarousel products={invictaProducts} brand="Invicta" />
      <ProductGrid products={invictaProducts} brandLabel="Colección Invicta" />
      <CollectionLinks current="invicta" />
    </main>
  );
}
