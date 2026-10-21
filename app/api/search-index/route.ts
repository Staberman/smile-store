import { NextResponse } from "next/server";
import { allProducts } from "@/lib/catalog";
import { getExtendedSearchText } from "@/lib/product-summary";

// Prerendered at build time: the index only changes with the catalog data.
export const dynamic = "force-static";

/**
 * Search text that product summaries leave out (tags, description, SEO copy)
 * for every purchasable product, keyed by slug. Product grids fetch it on the
 * first search interaction, so it stays out of every page's initial payload.
 */
export function GET() {
  const index = Object.fromEntries(
    allProducts.map((product) => [product.slug, getExtendedSearchText(product)]),
  );
  return NextResponse.json(index);
}
