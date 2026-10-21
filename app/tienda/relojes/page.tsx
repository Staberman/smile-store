import BrandCarousel from "@/components/brand/BrandCarousel";
import CollectionLinks from "@/components/brand/CollectionLinks";
import HubHeader from "@/components/brand/HubHeader";
import OutOfStockProducts from "@/components/brand/OutOfStockProducts";
import ProductGrid from "@/components/brand/ProductGrid";
import TrustHighlights from "@/components/brand/TrustHighlights";
import Breadcrumbs from "@/components/layout/Breadcrumbs";
import JsonLd from "@/components/seo/JsonLd";
import { allProducts, outOfStockProducts, type CatalogProduct } from "@/lib/catalog";
import { COLLECTION_TRAILS } from "@/lib/collections";
import { brandHighlight, hubDescription, hubIntro } from "@/lib/hubs";
import { toProductSummaries } from "@/lib/product-summary";
import { collectionSchema, pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Relojes originales en Argentina",
  description: hubDescription([
    "Relojes originales en Argentina: Invicta, Tommy Hilfiger y OMEGA x Swatch MoonSwatch, para dama y caballero.",
    "Relojes originales en Argentina: Invicta, Tommy Hilfiger y OMEGA x Swatch MoonSwatch.",
    "Relojes originales en Argentina.",
  ]),
  path: "/tienda/relojes",
});

const isWatchProduct = (product: CatalogProduct) => product.categories[0] === "RELOJES";
const watchProducts = allProducts.filter(isWatchProduct);
const watchOutOfStock = outOfStockProducts.filter(isWatchProduct);
const watchSchema = collectionSchema("/tienda/relojes", "Relojes premium", watchProducts, COLLECTION_TRAILS.relojes);

const watchSummaries = toProductSummaries(watchProducts);
const intro = hubIntro({
  subject: "relojes",
  products: watchProducts,
  outOfStock: watchOutOfStock,
  highlight: brandHighlight(watchProducts),
});

export default function RelojesPage() {
  return (
    <main className="bg-[#0a0a0a]">
      <JsonLd data={watchSchema} />
      <Breadcrumbs trail={COLLECTION_TRAILS.relojes} />
      <HubHeader eyebrow="Colección" title="Relojes originales" intro={intro} />
      <BrandCarousel products={watchSummaries} brand="Relojes" showNav={false} />
      <TrustHighlights />
      <ProductGrid products={watchSummaries} brandLabel="Relojes premium" filterBy="brand" />
      <OutOfStockProducts products={watchOutOfStock} />
      <CollectionLinks current="relojes" />
    </main>
  );
}
