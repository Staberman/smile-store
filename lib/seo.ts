import type { CatalogProduct } from "@/lib/catalog";

export const SITE_URL = "https://smiletiendaimp.com.ar";
export const SITE_NAME = "Smile";

export function absoluteUrl(path: string): string {
  if (path.startsWith("http")) return path;
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

export function productUrl(product: CatalogProduct): string {
  return absoluteUrl(`/tienda/productos/${product.slug}`);
}

export function truncateMetaDescription(value: string, maxLength = 158): string {
  const normalized = value.replace(/\s+/g, " ").trim();
  if (normalized.length <= maxLength) return normalized;
  return `${normalized.slice(0, maxLength - 3).replace(/\s+\S*$/, "")}...`;
}

export function productAvailability(product: CatalogProduct): string {
  return product.variants.some((variant) => variant.available && variant.stock > 0)
    ? "https://schema.org/InStock"
    : "https://schema.org/OutOfStock";
}
