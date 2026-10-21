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

export function collectionSchema(path: string, name: string, products: CatalogProduct[]) {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        "@id": `${absoluteUrl(path)}#collection`,
        name,
        url: absoluteUrl(path),
        isPartOf: { "@id": `${absoluteUrl("/")}#website` },
      },
      {
        "@type": "ItemList",
        itemListElement: products.slice(0, 50).map((product, index) => ({
          "@type": "ListItem",
          position: index + 1,
          url: productUrl(product),
          name: product.name,
        })),
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "Inicio",
            item: absoluteUrl("/"),
          },
          {
            "@type": "ListItem",
            position: 2,
            name,
            item: absoluteUrl(path),
          },
        ],
      },
    ],
  };
}
