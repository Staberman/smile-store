import { BRAND_DIRECTORY, canonicalBrand } from "@/lib/brand-directory";
import { productDisplayName } from "@/lib/product-seo.mjs";

// Kept apart from lib/brand-directory, which every product card imports, so
// the name cleaner stays out of client bundles: cards receive names already
// cleaned on the server.

/**
 * The one display name of a product: product page H1, cards, carousels,
 * search results and the favorites and recently viewed snapshots all use
 * this, never the raw catalog name ("Catier CA002" -> "Cartier CA002").
 */
export function displayProductName(name: string, rawBrand: string): string {
  const label = canonicalBrand(rawBrand);
  const aliases = BRAND_DIRECTORY.find((entry) => entry.name === label)?.aliases ?? [];
  return productDisplayName(name, { label, aliases });
}
