import type { ProductKind } from "./product-seo.mjs";

/** One "Clave: valor" line of a product description, e.g. Género: Unisex. */
export type ProductSpec = {
  name: string;
  value: string;
};

export type Audience = "unisex" | "women" | "men" | null;

/** Catalog fields the copy helpers read. */
export type CopyProduct = {
  name: string;
  categories: readonly string[];
  tags: readonly string[];
  variants: readonly { sku: string; options: readonly string[] }[];
};

export function decodeHtmlEntities(value: string): string;
export function descriptionLines(html: string | null | undefined): string[];
export function splitDescription(lines: readonly string[]): {
  paragraphs: string[];
  specs: ProductSpec[];
};
export function productKind(product: Pick<CopyProduct, "categories">): ProductKind;
export function productAudience(product: Pick<CopyProduct, "categories" | "tags">): Audience;
export function audiencePhrase(audience: Audience, kind: ProductKind): string;
export function fallbackDescription(
  product: CopyProduct,
  facts: {
    /** Canonical brand label, e.g. "Ray-Ban". */
    brand: string;
    /** Display name, e.g. "Reloj Tommy Hilfiger 1782779". */
    name: string;
    /** Store trail below the home page, e.g. ["Relojes", "Tommy Hilfiger"]. */
    collection?: readonly string[];
    payment?: { installments: string; transferDiscount: string; checkout: string } | null;
  },
): string;
