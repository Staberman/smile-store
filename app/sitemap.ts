import type { MetadataRoute } from "next";
import { allProducts, allProductsIncludingOutOfStock } from "@/lib/catalog";
import { GUIDES, GUIDES_LAST_MODIFIED } from "@/lib/guide-pages";
import { GUIDES_INDEX } from "@/lib/guides/guides.mjs";
import { indexableHubs } from "@/lib/hub-pages";
import { LANDINGS } from "@/lib/landing-pages";
import { absoluteUrl, productUrl } from "@/lib/seo";

// Date of the last content change to the static routes below. Hardcoded on
// purpose: a build-time `new Date()` would report every deploy as a content
// change. Update it when these pages change.
const STATIC_ROUTES_LAST_MODIFIED = "2026-10-21";

const staticRoutes = [
  "/",
  "/contacto",
  "/guia-de-estilo",
  "/tienda/relojes",
  "/tienda/relojes/omega-swatch",
  "/tienda/marcas/invicta",
  "/tienda/marcas/tommy-hilfiger",
  "/tienda/marcas/ray-ban",
  "/tienda/marcas/ray-ban/ferrari",
  "/tienda/marcas/premium",
];

const premiumBrandRoutes = [
  ["Balenciaga", "/tienda/marcas/premium/balenciaga"],
  ["Cartier", "/tienda/marcas/premium/cartier"],
  ["Celine Paris", "/tienda/marcas/premium/celine"],
  ["Christian Dior", "/tienda/marcas/premium/christian-dior"],
  ["Dolce&Gabbana", "/tienda/marcas/premium/dolce-gabbana"],
  ["Fendi", "/tienda/marcas/premium/fendi"],
  ["Gucci", "/tienda/marcas/premium/gucci"],
  ["Louis Vuitton", "/tienda/marcas/premium/louis-vuitton"],
  ["Prada", "/tienda/marcas/premium/prada"],
  ["Saint Laurent", "/tienda/marcas/premium/saint-laurent"],
  ["Versace", "/tienda/marcas/premium/versace"],
] as const;

const availablePremiumBrandRoutes = premiumBrandRoutes
  .filter(([brand]) => allProducts.some((product) => product.brand === brand))
  .map(([, route]) => route);

// Model and audience hubs (lib/collection-hubs.mjs) with enough products in
// the catalog to be indexed; the rest render noindex.
const indexableHubRoutes = indexableHubs().map((hub) => hub.path);

export default function sitemap(): MetadataRoute.Sitemap {
  const indexableRoutes = [...staticRoutes, ...indexableHubRoutes, ...availablePremiumBrandRoutes];

  return [
    ...indexableRoutes.map((route) => ({
      url: absoluteUrl(route),
      lastModified: STATIC_ROUTES_LAST_MODIFIED,
      changeFrequency: route === "/" ? "daily" as const : "weekly" as const,
      priority: route === "/" ? 1 : 0.7,
    })),
    // Landing pages: each carries its own dateModified; the summer page's also
    // moves on the calendar switches of its season label (summerSeason).
    ...LANDINGS.map((landing) => ({
      url: absoluteUrl(landing.path),
      lastModified: landing.dateModified,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
    // Buying guides: each carries its own dateModified; the index changes
    // whenever one of them does.
    {
      url: absoluteUrl(GUIDES_INDEX.path),
      lastModified: GUIDES_LAST_MODIFIED,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    },
    ...GUIDES.map((guide) => ({
      url: absoluteUrl(guide.path),
      lastModified: guide.dateModified,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
    // Include out-of-stock products so their direct URLs stay indexable.
    // No lastModified: the catalog data has no per-product update date.
    ...allProductsIncludingOutOfStock.map((product) => ({
      url: productUrl(product),
      changeFrequency: "daily" as const,
      priority: 0.8,
    })),
  ];
}
