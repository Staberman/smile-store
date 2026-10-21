import BrandCarousel from "@/components/brand/BrandCarousel";
import ProductGrid from "@/components/brand/ProductGrid";
import CollectionLinks from "@/components/brand/CollectionLinks";
import HubHeader from "@/components/brand/HubHeader";
import OutOfStockProducts from "@/components/brand/OutOfStockProducts";
import Breadcrumbs from "@/components/layout/Breadcrumbs";
import JsonLd from "@/components/seo/JsonLd";
import { allProducts, outOfStockProducts, type CatalogProduct } from "@/lib/catalog";
import { COLLECTION_TRAILS } from "@/lib/collections";
import { hubDescription, hubIntro, nameLineHighlight } from "@/lib/hubs";
import { toProductSummaries } from "@/lib/product-summary";
import { collectionSchema, pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Relojes Invicta en Argentina",
  description: hubDescription([
    "Relojes Invicta originales en Argentina: modelos Pro Diver y Speedway.",
    "Relojes Invicta originales en Argentina.",
  ]),
  path: "/tienda/marcas/invicta",
});

const isInvictaProduct = (product: CatalogProduct) => product.brand === "Invicta";
const invictaProducts = allProducts.filter(isInvictaProduct);
const invictaOutOfStock = outOfStockProducts.filter(isInvictaProduct);
const invictaSchema = collectionSchema("/tienda/marcas/invicta", "Colección Invicta", invictaProducts, COLLECTION_TRAILS.invicta);

const invictaSummaries = toProductSummaries(invictaProducts);
const intro = hubIntro({
  subject: "relojes Invicta",
  products: invictaProducts,
  outOfStock: invictaOutOfStock,
  highlight: nameLineHighlight(invictaProducts),
});

export default function InvictaPage() {
  return (
    <main className="bg-[#0a0a0a]">
      <JsonLd data={invictaSchema} />
      <Breadcrumbs trail={COLLECTION_TRAILS.invicta} />
      <HubHeader eyebrow="Relojes" title="Relojes Invicta" intro={intro} />
      <BrandCarousel products={invictaSummaries} brand="Invicta" showNav={false} />
      <ProductGrid products={invictaSummaries} brandLabel="Colección Invicta" />
      <OutOfStockProducts products={invictaOutOfStock} />
      <CollectionLinks current="invicta" />
    </main>
  );
}
