import BrandCarousel from "@/components/brand/BrandCarousel";
import ProductGrid from "@/components/brand/ProductGrid";
import CollectionLinks from "@/components/brand/CollectionLinks";
import HubHeader from "@/components/brand/HubHeader";
import HubLinks from "@/components/brand/HubLinks";
import OutOfStockProducts from "@/components/brand/OutOfStockProducts";
import Breadcrumbs from "@/components/layout/Breadcrumbs";
import JsonLd from "@/components/seo/JsonLd";
import { allProducts, outOfStockProducts, type CatalogProduct } from "@/lib/catalog";
import { COLLECTION_TRAILS } from "@/lib/collections";
import { GUIDE_LINKS } from "@/lib/guides/guides.mjs";
import { hubDescription, hubIntro } from "@/lib/hubs";
import { toProductSummaries } from "@/lib/product-summary";
import { collectionSchema, pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Relojes Tommy Hilfiger en Argentina",
  description: hubDescription([
    "Relojes Tommy Hilfiger originales en Argentina, con modelos para dama y caballero.",
    "Relojes Tommy Hilfiger originales en Argentina.",
  ]),
  path: "/tienda/marcas/tommy-hilfiger",
});

const isTommyProduct = (product: CatalogProduct) => product.brand === "Tommy Hilfiger";
const tommyProducts = allProducts.filter(isTommyProduct);
const tommyOutOfStock = outOfStockProducts.filter(isTommyProduct);
const tommySchema = collectionSchema("/tienda/marcas/tommy-hilfiger", "Relojes Tommy Hilfiger", tommyProducts, COLLECTION_TRAILS["tommy-hilfiger"]);

const tommySummaries = toProductSummaries(tommyProducts);
const tommyAudiences = ["dama", "caballero"].filter((audience) =>
  tommyProducts.some((product) => product.categories.join(" ").toLowerCase().includes(audience)),
);
const intro = hubIntro({
  subject: "relojes Tommy Hilfiger",
  products: tommyProducts,
  outOfStock: tommyOutOfStock,
  highlight:
    tommyAudiences.length > 0
      ? `Hay modelos para ${tommyAudiences.join(" y para ")}.`
      : undefined,
});

export default function TommyHilfigerPage() {
  return (
    <main className="bg-[#0a0a0a]">
      <JsonLd data={tommySchema} />
      <Breadcrumbs trail={COLLECTION_TRAILS["tommy-hilfiger"]} />
      <HubHeader eyebrow="Relojes" title="Relojes Tommy Hilfiger" intro={intro} />
      <BrandCarousel products={tommySummaries} brand="Tommy Hilfiger" showNav={false} />
      <ProductGrid products={tommySummaries} brandLabel="Colección Tommy Hilfiger" />
      <OutOfStockProducts products={tommyOutOfStock} />
      <HubLinks
        eyebrow="Guías de compra"
        title="Antes de elegir tu reloj"
        links={[GUIDE_LINKS.watchGift, GUIDE_LINKS.waterResistance]}
      />
      <CollectionLinks current="tommy-hilfiger" />
    </main>
  );
}
