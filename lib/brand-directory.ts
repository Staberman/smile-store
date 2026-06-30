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
  { name: "Ray-Ban", aliases: ["ray ban", "rayban"], href: "/tienda?view=ray-ban#catalogo", group: "lentes" },
  { name: "Prada", aliases: ["prada"], href: "/tienda/marcas/premium/prada", group: "lentes" },
  { name: "Versace", aliases: ["versace"], href: "/tienda/marcas/premium/versace", group: "lentes" },
  { name: "Christian Dior", aliases: ["christian dior"], href: "/tienda/marcas/premium/christian-dior", group: "lentes" },
  { name: "Louis Vuitton", aliases: ["louis vuitton"], href: "/tienda/marcas/premium/louis-vuitton", group: "lentes" },
  { name: "Saint Laurent", aliases: ["saint laurent"], href: "/tienda/marcas/premium/saint-laurent", group: "lentes" },
  { name: "Cartier", aliases: ["cartier"], href: "/tienda/marcas/premium/cartier", group: "lentes" },
  { name: "Dolce & Gabbana", aliases: ["dolce gabbana", "dolceandgabbana"], href: "/tienda/marcas/premium/dolce-gabbana", group: "lentes" },
  { name: "Balenciaga", aliases: ["balenciaga"], href: "/tienda/marcas/premium/balenciaga", group: "lentes" },
  { name: "Gucci", aliases: ["gucci"], href: "/tienda/marcas/premium/gucci", group: "lentes" },
  { name: "Fendi", aliases: ["fendi"], href: "/tienda/marcas/premium/fendi", group: "lentes" },
  { name: "Celine", aliases: ["celine", "celine paris"], href: "/tienda/marcas/premium/celine", group: "lentes" },
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

export function getAvailableBrandEntries(
  products: CatalogProduct[],
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
