import type { CatalogProduct } from "./catalog";
import type { CollectionHub } from "./collection-hubs.mjs";

// Site hierarchy for breadcrumbs. Visible breadcrumbs and BreadcrumbList
// JSON-LD are both built from these trails, so they always agree.

export type Crumb = { name: string; href: string };

export const HOME_CRUMB: Crumb = { name: "Inicio", href: "/" };
const RELOJES_CRUMB: Crumb = { name: "Relojes", href: "/tienda/relojes" };
const RAY_BAN_CRUMB: Crumb = { name: "Ray-Ban", href: "/tienda/marcas/ray-ban" };
const PREMIUM_CRUMB: Crumb = { name: "Marcas premium", href: "/tienda/marcas/premium" };

/** Trails of the collection hubs, from home to the hub itself. */
export const COLLECTION_TRAILS = {
  relojes: [HOME_CRUMB, RELOJES_CRUMB],
  "omega-swatch": [
    HOME_CRUMB,
    RELOJES_CRUMB,
    { name: "OMEGA x Swatch", href: "/tienda/relojes/omega-swatch" },
  ],
  invicta: [HOME_CRUMB, RELOJES_CRUMB, { name: "Invicta", href: "/tienda/marcas/invicta" }],
  "tommy-hilfiger": [
    HOME_CRUMB,
    RELOJES_CRUMB,
    { name: "Tommy Hilfiger", href: "/tienda/marcas/tommy-hilfiger" },
  ],
  "ray-ban": [HOME_CRUMB, RAY_BAN_CRUMB],
  ferrari: [
    HOME_CRUMB,
    RAY_BAN_CRUMB,
    { name: "Scuderia Ferrari Collection", href: "/tienda/marcas/ray-ban/ferrari" },
  ],
  premium: [HOME_CRUMB, PREMIUM_CRUMB],
} satisfies Record<string, Crumb[]>;

export type CollectionKey = keyof typeof COLLECTION_TRAILS;

/** One-line summary of each hub, for llms.txt and other indexes. */
export const COLLECTION_SUMMARIES: Record<CollectionKey, string> = {
  relojes: "Relojes originales de Invicta, Tommy Hilfiger y OMEGA x Swatch.",
  "omega-swatch": "Relojes OMEGA x Swatch MoonSwatch de la colección Mission.",
  invicta: "Relojes Invicta, entre ellos las líneas Pro Diver y Speedway.",
  "tommy-hilfiger": "Relojes Tommy Hilfiger para dama y caballero.",
  "ray-ban": "Anteojos de sol Ray-Ban: Aviador, Wayfarer, Clubmaster, Round, Erika y más.",
  ferrari: "Anteojos de sol Ray-Ban Scuderia Ferrari Collection.",
  premium: "Anteojos de sol de marcas premium: Prada, Christian Dior, Versace, Gucci y más.",
};

/** Premium maisons with their own page; `catalogBrand` is the raw catalog value. */
export const PREMIUM_BRANDS = [
  { slug: "balenciaga", name: "Balenciaga", catalogBrand: "Balenciaga" },
  { slug: "cartier", name: "Cartier", catalogBrand: "Cartier" },
  { slug: "celine", name: "Celine", catalogBrand: "Celine Paris" },
  { slug: "christian-dior", name: "Christian Dior", catalogBrand: "Christian Dior" },
  { slug: "dolce-gabbana", name: "Dolce&Gabbana", catalogBrand: "Dolce&Gabbana" },
  { slug: "fendi", name: "Fendi", catalogBrand: "Fendi" },
  { slug: "gucci", name: "Gucci", catalogBrand: "Gucci" },
  { slug: "louis-vuitton", name: "Louis Vuitton", catalogBrand: "Louis Vuitton" },
  { slug: "prada", name: "Prada", catalogBrand: "Prada" },
  { slug: "saint-laurent", name: "Saint Laurent", catalogBrand: "Saint Laurent" },
  { slug: "versace", name: "Versace", catalogBrand: "Versace" },
] as const;

export type PremiumBrandSlug = (typeof PREMIUM_BRANDS)[number]["slug"];

/**
 * Trail of a hub from lib/collection-hubs: its parent section's trail plus
 * the hub ("Inicio > Ray-Ban > Aviador").
 */
export function collectionHubTrail(hub: CollectionHub): Crumb[] {
  return [...COLLECTION_TRAILS[hub.parent], { name: hub.crumb, href: hub.path }];
}

export function premiumBrandTrail(slug: PremiumBrandSlug): Crumb[] {
  const brand = PREMIUM_BRANDS.find((entry) => entry.slug === slug);
  if (!brand) throw new Error(`Unknown premium brand: ${slug}`);
  return [
    HOME_CRUMB,
    PREMIUM_CRUMB,
    { name: brand.name, href: `/tienda/marcas/premium/${brand.slug}` },
  ];
}

/**
 * Trail from home to the collection a product belongs to (the product itself
 * is not included). Products without a collection page get only "Inicio".
 */
export function getProductTrail(product: CatalogProduct): Crumb[] {
  const brand = product.brand.trim().toLowerCase();
  const isRayBan = brand === "ray ban" || brand === "ray-ban" || brand === "rayban";
  const isFerrari =
    product.categories.join(" ").toLowerCase().includes("ferrari") ||
    product.name.toLowerCase().includes("ferrari");

  if (isRayBan) return isFerrari ? COLLECTION_TRAILS.ferrari : COLLECTION_TRAILS["ray-ban"];
  if (brand === "invicta") return COLLECTION_TRAILS.invicta;
  if (brand === "tommy hilfiger") return COLLECTION_TRAILS["tommy-hilfiger"];
  if (brand === "omega x swatch") return COLLECTION_TRAILS["omega-swatch"];

  const premium = PREMIUM_BRANDS.find((entry) => entry.catalogBrand.toLowerCase() === brand);
  if (premium) return premiumBrandTrail(premium.slug);

  return [HOME_CRUMB];
}
