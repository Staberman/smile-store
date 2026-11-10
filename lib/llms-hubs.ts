import { allProducts } from "@/lib/catalog";
import {
  COLLECTION_SUMMARIES,
  COLLECTION_TRAILS,
  PREMIUM_BRANDS,
  type CollectionKey,
} from "@/lib/collections";
import { indexableHubs } from "@/lib/hub-pages";
import { LANDINGS } from "@/lib/landing-pages";
import type { LlmsHub } from "@/lib/llms-text.mjs";

// The store hubs /llms.txt and /llms-full.txt list. Hubs come from
// lib/collections and lib/hub-pages, so new collections show up in both.

const HUB_ORDER: CollectionKey[] = [
  "anteojos-de-sol",
  "ray-ban",
  "ferrari",
  "premium",
  "relojes",
  "invicta",
  "tommy-hilfiger",
  "omega-swatch",
];

/**
 * Every indexed hub: sections, the landing pages (Rosario, summer), model and
 * audience hubs, premium brands with stock.
 */
export function llmsHubs(): LlmsHub[] {
  const sections = HUB_ORDER.map((key) => {
    const crumb = COLLECTION_TRAILS[key][COLLECTION_TRAILS[key].length - 1];
    return { name: crumb.name, path: crumb.href, description: COLLECTION_SUMMARIES[key] };
  });
  const landings = LANDINGS.map((landing) => ({
    name: landing.linkLabel,
    path: landing.path,
    description: landing.summary,
  }));
  // Model and audience hubs, same rule as the sitemap: only those with enough
  // products in the catalog. The sunglasses hub is in HUB_ORDER.
  const collectionHubs = indexableHubs()
    .filter((hub) => hub.group !== "category")
    .map((hub) => ({ name: hub.linkLabel, path: hub.path, description: hub.summary }));
  // Same rule as the sitemap: premium brands without stock are not indexed.
  const premiumBrands = PREMIUM_BRANDS.filter((brand) =>
    allProducts.some((product) => product.brand === brand.catalogBrand),
  ).map((brand) => ({
    name: brand.name,
    path: `/tienda/marcas/premium/${brand.slug}`,
    description: `Anteojos de sol ${brand.name}.`,
  }));

  return [...sections, ...landings, ...collectionHubs, ...premiumBrands];
}
