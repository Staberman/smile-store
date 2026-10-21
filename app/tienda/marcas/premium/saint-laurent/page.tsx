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
  title: "Anteojos de sol Saint Laurent en Argentina",
  description: hubDescription([
    "Anteojos de sol Saint Laurent originales en Argentina, con lentes de cristal mineral y protección UV400.",
    "Anteojos de sol Saint Laurent originales en Argentina.",
  ]),
  path: "/tienda/marcas/premium/saint-laurent",
});

const isSaintLaurentProduct = (product: CatalogProduct) => product.brand === "Saint Laurent";
const saintLaurentProducts = allProducts.filter(isSaintLaurentProduct);
const saintLaurentOutOfStock = outOfStockProducts.filter(isSaintLaurentProduct);
const breadcrumbs = premiumBrandTrail("saint-laurent");
const saintLaurentSchema = collectionSchema("/tienda/marcas/premium/saint-laurent", "Colección Saint Laurent", saintLaurentProducts, breadcrumbs);

const saintLaurentSummaries = toProductSummaries(saintLaurentProducts);
const intro = hubIntro({
  subject: "anteojos de sol Saint Laurent",
  products: saintLaurentProducts,
  outOfStock: saintLaurentOutOfStock,
  highlight: modelHighlight(saintLaurentProducts),
});

export default function SaintLaurentPage() {
  return (
    <main className="bg-[#0a0a0a]">
      <JsonLd data={saintLaurentSchema} />
      <Breadcrumbs trail={breadcrumbs} />
      <HubHeader eyebrow="Marcas premium" title="Anteojos de sol Saint Laurent" intro={intro} />
      <BrandCarousel products={saintLaurentSummaries} brand="Saint Laurent" showNav={false} />
      <ProductGrid products={saintLaurentSummaries} brandLabel="Colección Saint Laurent" />
      <OutOfStockProducts products={saintLaurentOutOfStock} />
      <CollectionLinks current="premium" />
    </main>
  );
}
