import type { CatalogProduct } from "./catalog";
import type { CollectionHub } from "./collection-hubs.mjs";

// Site hierarchy for breadcrumbs. Visible breadcrumbs and BreadcrumbList
// JSON-LD are both built from these trails, so they always agree.

export type Crumb = { name: string; href: string };

export const HOME_CRUMB: Crumb = { name: "Inicio", href: "/" };
const RELOJES_CRUMB: Crumb = { name: "Relojes", href: "/tienda/relojes" };
const SUNGLASSES_CRUMB: Crumb = { name: "Anteojos de sol", href: "/tienda/anteojos-de-sol" };
const RAY_BAN_CRUMB: Crumb = { name: "Ray-Ban", href: "/tienda/marcas/ray-ban" };
const PREMIUM_CRUMB: Crumb = { name: "Marcas premium", href: "/tienda/marcas/premium" };

/** Trails of the collection hubs, from home to the hub itself. */
export const COLLECTION_TRAILS = {
  "anteojos-de-sol": [HOME_CRUMB, SUNGLASSES_CRUMB],
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
  "anteojos-de-sol": "Todos los anteojos de sol: Ray-Ban, Scuderia Ferrari y marcas premium.",
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
 * the hub ("Inicio > Ray-Ban > Aviador", "Inicio > Relojes > Hombre").
 */
export function collectionHubTrail(hub: CollectionHub): Crumb[] {
  const own = { name: hub.crumb, href: hub.path };
  return hub.parent ? [...COLLECTION_TRAILS[hub.parent], own] : [HOME_CRUMB, own];
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
 * Product pages pass the product's indexed Ray-Ban model hub
 * (lib/hub-pages productModelHub) and the trail goes through it: "Inicio >
 * Ray-Ban > Aviador". Scuderia Ferrari products keep their own collection.
 */
export function getProductTrail(
  product: CatalogProduct,
  modelHub: CollectionHub | null = null,
): Crumb[] {
  const brand = product.brand.trim().toLowerCase();
  const isRayBan = brand === "ray ban" || brand === "ray-ban" || brand === "rayban";
  const isFerrari =
    product.categories.join(" ").toLowerCase().includes("ferrari") ||
    product.name.toLowerCase().includes("ferrari");

  if (isRayBan) {
    if (isFerrari) return COLLECTION_TRAILS.ferrari;
    return modelHub ? collectionHubTrail(modelHub) : COLLECTION_TRAILS["ray-ban"];
  }
  if (brand === "invicta") return COLLECTION_TRAILS.invicta;
  if (brand === "tommy hilfiger") return COLLECTION_TRAILS["tommy-hilfiger"];
  if (brand === "omega x swatch") return COLLECTION_TRAILS["omega-swatch"];

  const premium = PREMIUM_BRANDS.find((entry) => entry.catalogBrand.toLowerCase() === brand);
  if (premium) return premiumBrandTrail(premium.slug);

  return [HOME_CRUMB];
}
