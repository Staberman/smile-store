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
  title: "Anteojos de sol Christian Dior en Argentina",
  description: hubDescription([
    "Anteojos de sol Christian Dior originales en Argentina, con lentes de cristal mineral y protección UV400.",
    "Anteojos de sol Christian Dior originales en Argentina.",
  ]),
  path: "/tienda/marcas/premium/christian-dior",
});

const isDiorProduct = (product: CatalogProduct) => product.brand === "Christian Dior";
const diorProducts = allProducts.filter(isDiorProduct);
const diorOutOfStock = outOfStockProducts.filter(isDiorProduct);
const breadcrumbs = premiumBrandTrail("christian-dior");
const diorSchema = collectionSchema("/tienda/marcas/premium/christian-dior", "Anteojos de sol Christian Dior", diorProducts, breadcrumbs);

const diorSummaries = toProductSummaries(diorProducts);
const intro = hubIntro({
  subject: "anteojos de sol Christian Dior",
  products: diorProducts,
  outOfStock: diorOutOfStock,
  highlight: modelHighlight(diorProducts),
});

export default function DiorPage() {
  return (
    <main className="bg-[#0a0a0a]">
      <JsonLd data={diorSchema} />
      <Breadcrumbs trail={breadcrumbs} />
      <HubHeader eyebrow="Marcas premium" title="Anteojos de sol Christian Dior" intro={intro} />
      <BrandCarousel products={diorSummaries} brand="Christian Dior" showNav={false} />
      <ProductGrid products={diorSummaries} brandLabel="Colección Christian Dior" />
      <OutOfStockProducts products={diorOutOfStock} />
      <CollectionLinks current="premium" />
    </main>
  );
}
