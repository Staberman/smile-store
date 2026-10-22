import type { Metadata } from "next";
import BrandLogoStrip from "@/components/brand/BrandLogoStrip";
import FaqSection from "@/components/brand/FaqSection";
import RecentlyViewed from "@/components/product/RecentlyViewed";
import JsonLd from "@/components/seo/JsonLd";
import StoreShell from "@/components/store/StoreShell";
import TiendaClient from "@/components/store/TiendaClient";
import WatchesSection, { featuredWatches } from "@/components/store/WatchesSection";
import { DEFAULT_STORE_VIEW, STORE_VIEW_LABELS } from "@/components/store/storeView";
import { getAvailableBrandEntries } from "@/lib/brand-directory";
import { allProducts, getBestSellers } from "@/lib/catalog";
import { homeCatalogPreview } from "@/lib/home-catalog.mjs";
import { hubDescription } from "@/lib/hubs";
import { TITLE_SUFFIX } from "@/lib/product-seo.mjs";
import { toProductSummaries } from "@/lib/product-summary";
import { collectionSchema, pageMetadata } from "@/lib/seo";
import { storeIntro } from "@/lib/store-intro.mjs";

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
// Every purchasable product, as slim summaries. The client catalog gets only
// a preview of them in the page and loads the full list after first paint
// (lib/home-catalog.mjs); each product is also linked from the hubs and the
// sitemap.
const storeProducts = toProductSummaries(allProducts);
const bestSellerSlugs = getBestSellers().map((product) => product.slug);
const previewProducts = homeCatalogPreview(storeProducts, {
  view: DEFAULT_STORE_VIEW,
  views: Object.keys(STORE_VIEW_LABELS),
  pinned: featuredWatches(storeProducts),
  bestSellerSlugs,
});
// Brands with stock, in brand-directory order (Ray-Ban, Prada, Versace…).
const intro = storeIntro({
  sunglassesBrands: getAvailableBrandEntries(allProducts, "lentes").map((entry) => entry.name),
  watchBrands: getAvailableBrandEntries(allProducts, "relojes").map((entry) => entry.name),
});

export default function Home() {
  return (
    <StoreShell>
      {/* Who Smile is, before the carousel and the catalog: the first copy
          crawlers and AI assistants read. Kept to a short band so the hero
          stays in the first viewport. */}
      <section className="border-b border-white/6 bg-[#0a0a0a] px-6 py-5 md:px-12 md:py-6">
        <div className="mx-auto max-w-7xl">
          <h1 className="sr-only">{HOME_TITLE}</h1>
          <p className="max-w-4xl text-[13px] leading-[1.75] text-[#8b8580] md:text-sm">
            {intro}
          </p>
        </div>
      </section>
      <TiendaClient
        previewProducts={previewProducts}
        bestSellerSlugs={bestSellerSlugs}
        brands={<BrandLogoStrip products={storeProducts} />}
      />
      <WatchesSection products={storeProducts} />
      <RecentlyViewed />
      <FaqSection />
      {/* After the visible copy: crawlers that truncate the page read the
          intro and the FAQ first. */}
      <JsonLd data={homeCollectionSchema} />
    </StoreShell>
  );
}
