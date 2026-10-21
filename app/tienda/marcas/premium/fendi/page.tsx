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

export const metadata = pageMetadata({
  title: "Anteojos de sol Fendi en Argentina",
  description: hubDescription([
    "Anteojos de sol Fendi originales en Argentina, con lentes de cristal mineral y protección UV400.",
    "Anteojos de sol Fendi originales en Argentina.",
  ]),
  path: "/tienda/marcas/premium/fendi",
});

const isFendiProduct = (product: CatalogProduct) => product.brand === "Fendi";
const fendiProducts = allProducts.filter(isFendiProduct);
const fendiOutOfStock = outOfStockProducts.filter(isFendiProduct);
const breadcrumbs = premiumBrandTrail("fendi");
const fendiSchema = collectionSchema("/tienda/marcas/premium/fendi", "Colección Fendi", fendiProducts, breadcrumbs);

const fendiSummaries = toProductSummaries(fendiProducts);
const intro = hubIntro({
  subject: "anteojos de sol Fendi",
  products: fendiProducts,
  outOfStock: fendiOutOfStock,
  highlight: modelHighlight(fendiProducts),
});

export default function FendiPage() {
  return (
    <main className="bg-[#0a0a0a]">
      <JsonLd data={fendiSchema} />
      <Breadcrumbs trail={breadcrumbs} />
      <HubHeader eyebrow="Marcas premium" title="Anteojos de sol Fendi" intro={intro} />
      <BrandCarousel products={fendiSummaries} brand="Fendi" showNav={false} />
      <ProductGrid products={fendiSummaries} brandLabel="Colección Fendi" />
      <OutOfStockProducts products={fendiOutOfStock} />
      <CollectionLinks current="premium" />
    </main>
  );
}
