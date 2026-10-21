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
  title: "Anteojos de sol Gucci en Argentina",
  description: hubDescription([
    "Anteojos de sol Gucci originales en Argentina, con lentes de cristal mineral y protección UV400.",
    "Anteojos de sol Gucci originales en Argentina.",
  ]),
  path: "/tienda/marcas/premium/gucci",
});

const isGucciProduct = (product: CatalogProduct) => product.brand === "Gucci";
const gucciProducts = allProducts.filter(isGucciProduct);
const gucciOutOfStock = outOfStockProducts.filter(isGucciProduct);
const breadcrumbs = premiumBrandTrail("gucci");
const gucciSchema = collectionSchema("/tienda/marcas/premium/gucci", "Anteojos de sol Gucci", gucciProducts, breadcrumbs);

const gucciSummaries = toProductSummaries(gucciProducts);
const intro = hubIntro({
  subject: "anteojos de sol Gucci",
  products: gucciProducts,
  outOfStock: gucciOutOfStock,
  highlight: modelHighlight(gucciProducts),
});

export default function GucciPage() {
  return (
    <main className="bg-[#0a0a0a]">
      <JsonLd data={gucciSchema} />
      <Breadcrumbs trail={breadcrumbs} />
      <HubHeader eyebrow="Marcas premium" title="Anteojos de sol Gucci" intro={intro} />
      <BrandCarousel products={gucciSummaries} brand="Gucci" showNav={false} />
      <ProductGrid products={gucciSummaries} brandLabel="Colección Gucci" />
      <OutOfStockProducts products={gucciOutOfStock} />
      <CollectionLinks current="premium" />
    </main>
  );
}
