import type { MetadataRoute } from "next";
import { allProducts, allProductsIncludingOutOfStock } from "@/lib/catalog";
import { absoluteUrl, productUrl } from "@/lib/seo";

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

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const indexableRoutes = [...staticRoutes, ...availablePremiumBrandRoutes];

  return [
    ...indexableRoutes.map((route) => ({
      url: absoluteUrl(route),
      lastModified: now,
      changeFrequency: route === "/" ? "daily" as const : "weekly" as const,
      priority: route === "/" ? 1 : 0.7,
    })),
    // Include out-of-stock products so their direct URLs stay indexable.
    ...allProductsIncludingOutOfStock.map((product) => ({
      url: productUrl(product),
      lastModified: now,
      changeFrequency: "daily" as const,
      priority: 0.8,
    })),
  ];
}
