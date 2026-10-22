import { NextResponse } from "next/server";
import { allProducts } from "@/lib/catalog";
import { toProductSummaries } from "@/lib/product-summary";

// Prerendered at build time, like the homepage that requests it, so both
// carry the same catalog snapshot.
export const dynamic = "force-static";

/**
 * Every purchasable product as a card summary. The homepage server-renders a
 * preview of its catalog and loads this list after first paint for its views,
 * filters and search (components/store/TiendaClient.tsx), so the list stays
 * out of the homepage HTML. Outside /api/ on purpose: robots.txt disallows
 * /api/, and crawlers that render JavaScript should see the full grid.
 */
export function GET() {
  return NextResponse.json(toProductSummaries(allProducts), {
    // A data file, not a page.
    headers: { "X-Robots-Tag": "noindex" },
  });
}
