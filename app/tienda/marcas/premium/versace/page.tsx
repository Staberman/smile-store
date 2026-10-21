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
  title: "Anteojos de sol Versace en Argentina",
  description: hubDescription([
    "Anteojos de sol Versace originales en Argentina, con lentes de cristal mineral y protección UV400.",
    "Anteojos de sol Versace originales en Argentina.",
  ]),
  path: "/tienda/marcas/premium/versace",
});

const isVersaceProduct = (product: CatalogProduct) => product.brand === "Versace";
const versaceProducts = allProducts.filter(isVersaceProduct);
const versaceOutOfStock = outOfStockProducts.filter(isVersaceProduct);
const breadcrumbs = premiumBrandTrail("versace");
const versaceSchema = collectionSchema("/tienda/marcas/premium/versace", "Colección Versace", versaceProducts, breadcrumbs);

const versaceSummaries = toProductSummaries(versaceProducts);
const intro = hubIntro({
  subject: "anteojos de sol Versace",
  products: versaceProducts,
  outOfStock: versaceOutOfStock,
  highlight: modelHighlight(versaceProducts),
});

export default function VersacePage() {
  return (
    <main className="bg-[#0a0a0a]">
      <JsonLd data={versaceSchema} />
      <Breadcrumbs trail={breadcrumbs} />
      <HubHeader eyebrow="Marcas premium" title="Anteojos de sol Versace" intro={intro} />
      <BrandCarousel products={versaceSummaries} brand="Versace" showNav={false} />
      <ProductGrid products={versaceSummaries} brandLabel="Colección Versace" />
      <OutOfStockProducts products={versaceOutOfStock} />
      <CollectionLinks current="premium" />
    </main>
  );
}
