import type { CatalogProduct } from "@/lib/catalog";
import { isWatch } from "@/lib/storefront.mjs";

export type BrandDirectoryEntry = {
  name: string;
  aliases: string[];
  href: string;
  image?: string;
  group: "lentes" | "relojes";
};

export const BRAND_DIRECTORY: BrandDirectoryEntry[] = [
  { name: "Ray-Ban", aliases: ["ray ban", "rayban"], href: "/?view=ray-ban#catalogo", image: "/images/brands/ray-ban.svg", group: "lentes" },
  { name: "Prada", aliases: ["prada"], href: "/tienda/marcas/premium/prada", image: "/images/brands/prada.svg", group: "lentes" },
  { name: "Versace", aliases: ["versace"], href: "/tienda/marcas/premium/versace", image: "/images/brands/versace.svg", group: "lentes" },
  { name: "Christian Dior", aliases: ["christian dior"], href: "/tienda/marcas/premium/christian-dior", image: "/images/brands/christian-dior.svg", group: "lentes" },
  { name: "Louis Vuitton", aliases: ["louis vuitton"], href: "/tienda/marcas/premium/louis-vuitton", image: "/images/brands/louis-vuitton.svg", group: "lentes" },
  { name: "Saint Laurent", aliases: ["saint laurent"], href: "/tienda/marcas/premium/saint-laurent", image: "/images/brands/saint-laurent.svg", group: "lentes" },
  { name: "Cartier", aliases: ["cartier"], href: "/tienda/marcas/premium/cartier", image: "/images/brands/cartier.svg", group: "lentes" },
  { name: "Dolce & Gabbana", aliases: ["dolce gabbana", "dolceandgabbana"], href: "/tienda/marcas/premium/dolce-gabbana", image: "/images/brands/dolce-gabbana.svg", group: "lentes" },
  { name: "Balenciaga", aliases: ["balenciaga"], href: "/tienda/marcas/premium/balenciaga", image: "/images/brands/balenciaga.svg", group: "lentes" },
  { name: "Gucci", aliases: ["gucci"], href: "/tienda/marcas/premium/gucci", image: "/images/brands/gucci.svg", group: "lentes" },
  { name: "Fendi", aliases: ["fendi"], href: "/tienda/marcas/premium/fendi", image: "/images/brands/fendi.svg", group: "lentes" },
  { name: "Celine", aliases: ["celine", "celine paris"], href: "/tienda/marcas/premium/celine", image: "/images/brands/celine.svg", group: "lentes" },
  { name: "Tommy Hilfiger", aliases: ["tommy hilfiger"], href: "/tienda/marcas/tommy-hilfiger", image: "/images/tommy-logo.png", group: "relojes" },
  { name: "Invicta", aliases: ["invicta"], href: "/tienda/marcas/invicta", image: "/images/invicta-logo.png", group: "relojes" },
  { name: "OMEGA x Swatch", aliases: ["omega x swatch"], href: "/tienda/relojes/omega-swatch", group: "relojes" },
];

export function normalizeBrand(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

// Alias -> canonical display name, built once from BRAND_DIRECTORY. This is the
// single source of truth that collapses the inconsistent catalog casing
// ("Ray Ban" / "Ray ban" / "RAY BAN" / "Rayban" -> "Ray-Ban") into one brand.
const CANONICAL_BRAND_BY_ALIAS = new Map<string, string>();
for (const entry of BRAND_DIRECTORY) {
  CANONICAL_BRAND_BY_ALIAS.set(normalizeBrand(entry.name), entry.name);
  for (const alias of entry.aliases) {
    CANONICAL_BRAND_BY_ALIAS.set(normalizeBrand(alias), entry.name);
  }
}

// Collapses a raw catalog brand string to its canonical display name. Falls back
// to the trimmed raw value for brands not in the directory (never invents one).
// NOTE: this does NOT mutate catalog data — brand pages keep filtering on the raw
// `product.brand`, so their selections are unaffected.
export function canonicalBrand(rawBrand: string): string {
  const key = normalizeBrand(rawBrand);
  return CANONICAL_BRAND_BY_ALIAS.get(key) ?? rawBrand.trim();
}

export function getAvailableBrandEntries(
  products: Pick<CatalogProduct, "brand" | "categories">[],
  group: "lentes" | "relojes",
): BrandDirectoryEntry[] {
  const productBrands = products
    .filter((product) => (group === "relojes" ? isWatch(product) : !isWatch(product)))
    .map((product) => normalizeBrand(product.brand));

  return BRAND_DIRECTORY.filter(
    (entry) =>
      entry.group === group &&
      entry.aliases.some((alias) => productBrands.includes(normalizeBrand(alias))),
  );
}
