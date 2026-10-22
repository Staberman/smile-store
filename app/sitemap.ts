import type { MetadataRoute } from "next";
import { allProducts, allProductsIncludingOutOfStock } from "@/lib/catalog";
import { indexableHubs } from "@/lib/hub-pages";
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
    // Include out-of-stock products so their direct URLs stay indexable.
    // No lastModified: the catalog data has no per-product update date.
    ...allProductsIncludingOutOfStock.map((product) => ({
      url: productUrl(product),
      changeFrequency: "daily" as const,
      priority: 0.8,
    })),
  ];
}
