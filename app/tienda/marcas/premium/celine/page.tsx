import type { Metadata } from "next";
import BrandCarousel from "@/components/brand/BrandCarousel";
import ProductGrid from "@/components/brand/ProductGrid";
import CollectionLinks from "@/components/brand/CollectionLinks";
import HubHeader from "@/components/brand/HubHeader";
import OutOfStockProducts from "@/components/brand/OutOfStockProducts";
import Breadcrumbs from "@/components/layout/Breadcrumbs";
import JsonLd from "@/components/seo/JsonLd";
import { allProducts, outOfStockProducts, type CatalogProduct } from "@/lib/catalog";
import { premiumBrandTrail } from "@/lib/collections";
import { hubDescription, hubIntro, modelHighlight } from "@/lib/hubs";
import { toProductSummaries } from "@/lib/product-summary";
import { collectionSchema, pageMetadata } from "@/lib/seo";

const isCelineProduct = (product: CatalogProduct) => product.brand === "Celine Paris";
const celineProducts = allProducts.filter(isCelineProduct);
const celineOutOfStock = outOfStockProducts.filter(isCelineProduct);
const breadcrumbs = premiumBrandTrail("celine");
const celineSchema = collectionSchema(
  "/tienda/marcas/premium/celine",
  "Colección Celine Paris",
  celineProducts,
  breadcrumbs,
);

export const metadata: Metadata = {
  ...pageMetadata({
    title: "Anteojos de sol Celine en Argentina",
    description: hubDescription([
      "Anteojos de sol Celine originales en Argentina, con lentes de cristal mineral y protección UV400.",
      "Anteojos de sol Celine originales en Argentina.",
    ]),
    path: "/tienda/marcas/premium/celine",
  }),
  robots: {
    index: celineProducts.length > 0,
    follow: true,
  },
};

const celineSummaries = toProductSummaries(celineProducts);
const intro = hubIntro({
  subject: "anteojos de sol Celine",
  products: celineProducts,
  outOfStock: celineOutOfStock,
  highlight: modelHighlight(celineProducts),
});

export default function CelinePage() {
  return (
    <main className="bg-[#0a0a0a]">
      {celineProducts.length > 0 && <JsonLd data={celineSchema} />}
      <Breadcrumbs trail={breadcrumbs} />
      <HubHeader eyebrow="Marcas premium" title="Anteojos de sol Celine" intro={intro} />
      <BrandCarousel products={celineSummaries} brand="Celine Paris" showNav={false} />
      <ProductGrid products={celineSummaries} brandLabel="Colección Celine Paris" />
      <OutOfStockProducts products={celineOutOfStock} />
      <CollectionLinks current="premium" />
    </main>
  );
}
