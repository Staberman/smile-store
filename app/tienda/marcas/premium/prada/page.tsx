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
  title: "Anteojos de sol Prada en Argentina",
  description: hubDescription([
    "Anteojos de sol Prada originales en Argentina, con lentes de cristal mineral y protección UV400.",
    "Anteojos de sol Prada originales en Argentina.",
  ]),
  path: "/tienda/marcas/premium/prada",
});

const isPradaProduct = (product: CatalogProduct) => product.brand === "Prada";
const pradaProducts = allProducts.filter(isPradaProduct);
const pradaOutOfStock = outOfStockProducts.filter(isPradaProduct);
const breadcrumbs = premiumBrandTrail("prada");
const pradaSchema = collectionSchema("/tienda/marcas/premium/prada", "Colección Prada", pradaProducts, breadcrumbs);

const pradaSummaries = toProductSummaries(pradaProducts);
const intro = hubIntro({
  subject: "anteojos de sol Prada",
  products: pradaProducts,
  outOfStock: pradaOutOfStock,
  highlight: modelHighlight(pradaProducts),
});

export default function PradaPage() {
  return (
    <main className="bg-[#0a0a0a]">
      <JsonLd data={pradaSchema} />
      <Breadcrumbs trail={breadcrumbs} />
      <HubHeader eyebrow="Marcas premium" title="Anteojos de sol Prada" intro={intro} />
      <BrandCarousel products={pradaSummaries} brand="Prada" showNav={false} />
      <ProductGrid products={pradaSummaries} brandLabel="Colección Prada" />
      <OutOfStockProducts products={pradaOutOfStock} />
      <CollectionLinks current="premium" />
    </main>
  );
}
