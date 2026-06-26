import type { MetadataRoute } from "next";
import { allProducts } from "@/lib/catalog";
import { absoluteUrl, productUrl } from "@/lib/seo";

const staticRoutes = [
  "/",
  "/contacto",
  "/tienda",
  "/tienda/relojes",
  "/tienda/relojes/omega-swatch",
  "/tienda/marcas/invicta",
  "/tienda/marcas/tommy-hilfiger",
  "/tienda/marcas/ray-ban",
  "/tienda/marcas/ray-ban/ferrari",
  "/tienda/marcas/premium",
  "/tienda/marcas/premium/balenciaga",
  "/tienda/marcas/premium/cartier",
  "/tienda/marcas/premium/celine",
  "/tienda/marcas/premium/christian-dior",
  "/tienda/marcas/premium/dolce-gabbana",
  "/tienda/marcas/premium/fendi",
  "/tienda/marcas/premium/gucci",
  "/tienda/marcas/premium/louis-vuitton",
  "/tienda/marcas/premium/prada",
  "/tienda/marcas/premium/saint-laurent",
  "/tienda/marcas/premium/versace",
];

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  return [
    ...staticRoutes.map((route) => ({
      url: absoluteUrl(route),
      lastModified: now,
      changeFrequency: route === "/" || route === "/tienda" ? "daily" as const : "weekly" as const,
      priority: route === "/" ? 1 : route === "/tienda" ? 0.9 : 0.7,
    })),
    ...allProducts.map((product) => ({
      url: productUrl(product),
      lastModified: now,
      changeFrequency: "daily" as const,
      priority: 0.8,
      images: product.images.slice(0, 3),
    })),
  ];
}
