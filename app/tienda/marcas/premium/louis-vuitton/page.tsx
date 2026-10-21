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
  title: "Anteojos de sol Louis Vuitton en Argentina",
  description: hubDescription([
    "Anteojos de sol Louis Vuitton originales en Argentina, con lentes de cristal mineral y protección UV400.",
    "Anteojos de sol Louis Vuitton originales en Argentina.",
  ]),
  path: "/tienda/marcas/premium/louis-vuitton",
});

const isLouisVuittonProduct = (product: CatalogProduct) => product.brand === "Louis Vuitton";
const louisVuittonProducts = allProducts.filter(isLouisVuittonProduct);
const louisVuittonOutOfStock = outOfStockProducts.filter(isLouisVuittonProduct);
const breadcrumbs = premiumBrandTrail("louis-vuitton");
const louisVuittonSchema = collectionSchema("/tienda/marcas/premium/louis-vuitton", "Colección Louis Vuitton", louisVuittonProducts, breadcrumbs);

const louisVuittonSummaries = toProductSummaries(louisVuittonProducts);
const intro = hubIntro({
  subject: "anteojos de sol Louis Vuitton",
  products: louisVuittonProducts,
  outOfStock: louisVuittonOutOfStock,
  highlight: modelHighlight(louisVuittonProducts),
});

export default function LouisVuittonPage() {
  return (
    <main className="bg-[#0a0a0a]">
      <JsonLd data={louisVuittonSchema} />
      <Breadcrumbs trail={breadcrumbs} />
      <HubHeader eyebrow="Marcas premium" title="Anteojos de sol Louis Vuitton" intro={intro} />
      <BrandCarousel products={louisVuittonSummaries} brand="Louis Vuitton" showNav={false} />
      <ProductGrid products={louisVuittonSummaries} brandLabel="Colección Louis Vuitton" />
      <OutOfStockProducts products={louisVuittonOutOfStock} />
      <CollectionLinks current="premium" />
    </main>
  );
}
