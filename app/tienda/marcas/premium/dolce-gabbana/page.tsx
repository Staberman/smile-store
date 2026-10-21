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
  title: "Anteojos de sol Dolce & Gabbana en Argentina",
  description: hubDescription([
    "Anteojos de sol Dolce & Gabbana originales en Argentina, con lentes de cristal mineral y protección UV400.",
    "Anteojos de sol Dolce & Gabbana originales en Argentina.",
  ]),
  path: "/tienda/marcas/premium/dolce-gabbana",
});

const isDolceGabbanaProduct = (product: CatalogProduct) => product.brand === "Dolce&Gabbana";
const dolceGabbanaProducts = allProducts.filter(isDolceGabbanaProduct);
const dolceGabbanaOutOfStock = outOfStockProducts.filter(isDolceGabbanaProduct);
const breadcrumbs = premiumBrandTrail("dolce-gabbana");
const dolceGabbanaSchema = collectionSchema("/tienda/marcas/premium/dolce-gabbana", "Colección Dolce&Gabbana", dolceGabbanaProducts, breadcrumbs);

const dolceGabbanaSummaries = toProductSummaries(dolceGabbanaProducts);
const intro = hubIntro({
  subject: "anteojos de sol Dolce & Gabbana",
  products: dolceGabbanaProducts,
  outOfStock: dolceGabbanaOutOfStock,
  highlight: modelHighlight(dolceGabbanaProducts),
});

export default function DolceGabbanaPage() {
  return (
    <main className="bg-[#0a0a0a]">
      <JsonLd data={dolceGabbanaSchema} />
      <Breadcrumbs trail={breadcrumbs} />
      <HubHeader eyebrow="Marcas premium" title="Anteojos de sol Dolce & Gabbana" intro={intro} />
      <BrandCarousel products={dolceGabbanaSummaries} brand="Dolce&Gabbana" showNav={false} />
      <ProductGrid products={dolceGabbanaSummaries} brandLabel="Colección Dolce&Gabbana" />
      <OutOfStockProducts products={dolceGabbanaOutOfStock} />
      <CollectionLinks current="premium" />
    </main>
  );
}
