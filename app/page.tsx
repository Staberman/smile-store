import type { Metadata } from "next";
import FaqSection from "@/components/brand/FaqSection";
import RecentlyViewed from "@/components/product/RecentlyViewed";
import JsonLd from "@/components/seo/JsonLd";
import StoreShell from "@/components/store/StoreShell";
import TiendaClient from "@/components/store/TiendaClient";
import WatchesSection from "@/components/store/WatchesSection";
import { allProducts, getBestSellers } from "@/lib/catalog";
import { hubDescription } from "@/lib/hubs";
import { TITLE_SUFFIX } from "@/lib/product-seo.mjs";
import { toProductSummaries } from "@/lib/product-summary";
import { collectionSchema, pageMetadata } from "@/lib/seo";

const HOME_TITLE = "Anteojos de sol y relojes originales en Argentina";

export const metadata: Metadata = {
  ...pageMetadata({
    title: HOME_TITLE,
    description: hubDescription([
      "Anteojos de sol y relojes originales en Argentina: Ray-Ban, Prada, Gucci, Versace, Invicta, Tommy Hilfiger y OMEGA x Swatch.",
      "Anteojos de sol y relojes originales en Argentina: Ray-Ban, Prada, Gucci, Invicta y Tommy Hilfiger.",
    ]),
    path: "/",
  }),
  // The root layout's title template only applies to child segments, so the
  // homepage adds the brand suffix itself.
  title: { absolute: `${HOME_TITLE}${TITLE_SUFFIX}` },
};

const homeCollectionSchema = collectionSchema("/", HOME_TITLE, allProducts);
// The client catalog filters these per ?view=, so it gets every purchasable
// product, as slim summaries.
const storeProducts = toProductSummaries(allProducts);
const bestSellerSlugs = getBestSellers().map((product) => product.slug);

export default function Home() {
  return (
    <StoreShell>
      <JsonLd data={homeCollectionSchema} />
      <h1 className="sr-only">{HOME_TITLE}</h1>
      <TiendaClient products={storeProducts} bestSellerSlugs={bestSellerSlugs} />
      <WatchesSection products={storeProducts} />
      <RecentlyViewed />
      <FaqSection />
    </StoreShell>
  );
}
