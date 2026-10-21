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
  title: "Anteojos de sol Balenciaga en Argentina",
  description: hubDescription([
    "Anteojos de sol Balenciaga originales en Argentina, con lentes de cristal mineral y protección UV400.",
    "Anteojos de sol Balenciaga originales en Argentina.",
  ]),
  path: "/tienda/marcas/premium/balenciaga",
});

const isBalenciagaProduct = (product: CatalogProduct) => product.brand === "Balenciaga";
const balenciagaProducts = allProducts.filter(isBalenciagaProduct);
const balenciagaOutOfStock = outOfStockProducts.filter(isBalenciagaProduct);
const breadcrumbs = premiumBrandTrail("balenciaga");
const balenciagaSchema = collectionSchema("/tienda/marcas/premium/balenciaga", "Colección Balenciaga", balenciagaProducts, breadcrumbs);

const balenciagaSummaries = toProductSummaries(balenciagaProducts);
const intro = hubIntro({
  subject: "anteojos de sol Balenciaga",
  products: balenciagaProducts,
  outOfStock: balenciagaOutOfStock,
  highlight: modelHighlight(balenciagaProducts),
});

export default function BalenciagaPage() {
  return (
    <main className="bg-[#0a0a0a]">
      <JsonLd data={balenciagaSchema} />
      <Breadcrumbs trail={breadcrumbs} />
      <HubHeader eyebrow="Marcas premium" title="Anteojos de sol Balenciaga" intro={intro} />
      <BrandCarousel products={balenciagaSummaries} brand="Balenciaga" showNav={false} />
      <ProductGrid products={balenciagaSummaries} brandLabel="Colección Balenciaga" />
      <OutOfStockProducts products={balenciagaOutOfStock} />
      <CollectionLinks current="premium" />
    </main>
  );
}
