import type { Metadata } from "next";
import BrandCarousel from "@/components/brand/BrandCarousel";
import CollectionLinks from "@/components/brand/CollectionLinks";
import ProductGrid from "@/components/brand/ProductGrid";
import TrustHighlights from "@/components/brand/TrustHighlights";
import JsonLd from "@/components/seo/JsonLd";
import { allProducts } from "@/lib/catalog";
import { collectionSchema } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Relojes premium en Argentina",
  description:
    "Compra relojes premium en Argentina. Explora modelos seleccionados de Tommy Hilfiger, Invicta y Omega x Swatch con stock disponible y checkout seguro.",
  alternates: {
    canonical: "/tienda/relojes",
  },
};

const watchProducts = allProducts.filter((product) => product.categories[0] === "RELOJES");
const watchSchema = collectionSchema("/tienda/relojes", "Relojes premium", watchProducts);

export default function RelojesPage() {
  return (
    <main className="bg-[#0a0a0a]">
      <JsonLd data={watchSchema} />
      <BrandCarousel products={watchProducts} brand="Relojes" showNav={false} />
      <TrustHighlights />
      <ProductGrid products={watchProducts} brandLabel="Relojes premium" filterBy="brand" />
      <CollectionLinks current="relojes" />
    </main>
  );
}
