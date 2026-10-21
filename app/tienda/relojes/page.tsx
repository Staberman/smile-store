import type { Metadata } from "next";
import BrandCarousel from "@/components/brand/BrandCarousel";
import CollectionLinks from "@/components/brand/CollectionLinks";
import ProductGrid from "@/components/brand/ProductGrid";
import TrustHighlights from "@/components/brand/TrustHighlights";
import Breadcrumbs from "@/components/layout/Breadcrumbs";
import JsonLd from "@/components/seo/JsonLd";
import { allProducts } from "@/lib/catalog";
import { COLLECTION_TRAILS } from "@/lib/collections";
import { toProductSummaries } from "@/lib/product-summary";
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
const watchSchema = collectionSchema("/tienda/relojes", "Relojes premium", watchProducts, COLLECTION_TRAILS.relojes);

const watchSummaries = toProductSummaries(watchProducts);

export default function RelojesPage() {
  return (
    <main className="bg-[#0a0a0a]">
      <JsonLd data={watchSchema} />
      <Breadcrumbs trail={COLLECTION_TRAILS.relojes} />
      <BrandCarousel products={watchSummaries} brand="Relojes" showNav={false} />
      <TrustHighlights />
      <ProductGrid products={watchSummaries} brandLabel="Relojes premium" filterBy="brand" />
      <CollectionLinks current="relojes" />
    </main>
  );
}
