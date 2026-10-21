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
  title: "Anteojos de sol Cartier en Argentina",
  description: hubDescription([
    "Anteojos de sol Cartier originales en Argentina, con lentes de cristal mineral y protección UV400.",
    "Anteojos de sol Cartier originales en Argentina.",
  ]),
  path: "/tienda/marcas/premium/cartier",
});

const isCartierProduct = (product: CatalogProduct) => product.brand === "Cartier";
const cartierProducts = allProducts.filter(isCartierProduct);
const cartierOutOfStock = outOfStockProducts.filter(isCartierProduct);
const breadcrumbs = premiumBrandTrail("cartier");
const cartierSchema = collectionSchema("/tienda/marcas/premium/cartier", "Colección Cartier", cartierProducts, breadcrumbs);

const cartierSummaries = toProductSummaries(cartierProducts);
const intro = hubIntro({
  subject: "anteojos de sol Cartier",
  products: cartierProducts,
  outOfStock: cartierOutOfStock,
  highlight: modelHighlight(cartierProducts),
});

export default function CartierPage() {
  return (
    <main className="bg-[#0a0a0a]">
      <JsonLd data={cartierSchema} />
      <Breadcrumbs trail={breadcrumbs} />
      <HubHeader eyebrow="Marcas premium" title="Anteojos de sol Cartier" intro={intro} />
      <BrandCarousel products={cartierSummaries} brand="Cartier" showNav={false} />
      <ProductGrid products={cartierSummaries} brandLabel="Colección Cartier" />
      <OutOfStockProducts products={cartierOutOfStock} />
      <CollectionLinks current="premium" />
    </main>
  );
}
