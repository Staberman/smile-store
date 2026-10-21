import type { CatalogProduct, CatalogVariant } from "./catalog";
import { toStorefrontProductUrl } from "./checkout/storefront";
import { getProductDescription } from "./product-meta";

// Slim product DTOs for client components. Everything passed from a server
// component to a client component is serialized into the page's RSC payload,
// so client components receive these instead of full catalog products (which
// carry descriptionHtml, SEO copy and import metadata they never render).
// This module only imports catalog types: it must stay free of the catalog data.

/** Variant fields the storefront UI reads: selection label, price, stock, image. */
export type ProductSummaryVariant = Pick<
  CatalogVariant,
  "id" | "options" | "price" | "promotionalPrice" | "stock" | "available" | "image"
>;

const GENDER_TAGS = ["hombre", "mujer", "unisex"] as const;
export type ProductGender = (typeof GENDER_TAGS)[number];

/**
 * Card-sized product: what cards, carousels, view filters and facets read.
 * Catalog tags are SEO keyword lists; cards only need the gender facet derived
 * from them, and search reads them from the lazily loaded search index.
 */
export type ProductSummary = Pick<
  CatalogProduct,
  "slug" | "name" | "brand" | "categories" | "price" | "promotionalPrice"
> & {
  /** First product image; cards prefer the selected variant image. */
  image: string | null;
  genders: ProductGender[];
  variants: ProductSummaryVariant[];
};

/** Product page payload: the summary fields plus gallery, copy and checkout id. */
export type ProductDetail = Pick<
  CatalogProduct,
  | "slug"
  | "name"
  | "brand"
  | "categories"
  | "descriptionText"
  | "price"
  | "promotionalPrice"
  | "images"
  | "tiendanubeProductId"
> & {
  variants: ProductSummaryVariant[];
  /** Tiendanube storefront page, used when direct checkout is unavailable. */
  storefrontUrl: string | null;
};

function toSummaryVariant(variant: CatalogVariant): ProductSummaryVariant {
  return {
    id: variant.id,
    options: variant.options,
    price: variant.price,
    promotionalPrice: variant.promotionalPrice,
    stock: variant.stock,
    available: variant.available,
    image: variant.image,
  };
}

function isInStockVariant(variant: CatalogVariant): boolean {
  return variant.available && variant.stock > 0;
}

function normalizeTag(tag: string): string {
  return tag
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function getGenders(tags: string[]): ProductGender[] {
  const normalized = new Set(tags.map(normalizeTag));
  return GENDER_TAGS.filter((gender) => normalized.has(gender));
}

/**
 * Text that product search matches beyond what a summary carries, in the order
 * grids join it after name, brand, label and categories.
 */
export function getExtendedSearchText(product: CatalogProduct): string {
  return [
    ...product.tags,
    getProductDescription(product),
    product.seoTitle,
    product.seoDescription,
  ].join(" ");
}

export function toProductSummary(product: CatalogProduct): ProductSummary {
  return {
    slug: product.slug,
    name: product.name,
    brand: product.brand,
    categories: product.categories,
    price: product.price,
    promotionalPrice: product.promotionalPrice,
    image: product.images[0] ?? null,
    genders: getGenders(product.tags),
    // UI only selects in-stock variants; the first variant is kept as the
    // fallback cards show when nothing is in stock.
    variants: product.variants
      .filter((variant, index) => index === 0 || isInStockVariant(variant))
      .map(toSummaryVariant),
  };
}

export function toProductSummaries(products: CatalogProduct[]): ProductSummary[] {
  return products.map(toProductSummary);
}

/**
 * `display` overrides what the page shows as the product's name, brand and
 * gallery (the H1 carries the canonical brand: "Ray-Ban 4375 Polarizado";
 * the gallery skips repeated renditions of one photo).
 */
export function toProductDetail(
  product: CatalogProduct,
  display: Partial<Pick<ProductDetail, "name" | "brand" | "images">> = {},
): ProductDetail {
  return {
    slug: product.slug,
    name: display.name ?? product.name,
    brand: display.brand ?? product.brand,
    categories: product.categories,
    descriptionText: getProductDescription(product),
    price: product.price,
    promotionalPrice: product.promotionalPrice,
    images: display.images ?? product.images,
    tiendanubeProductId: product.tiendanubeProductId,
    // The product page only offers in-stock variants.
    variants: product.variants.filter(isInStockVariant).map(toSummaryVariant),
    storefrontUrl: toStorefrontProductUrl(product.sourceUrl),
  };
}
