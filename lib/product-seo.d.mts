export type ProductKind = "sunglasses" | "watch" | null;

export type BrandSpelling = {
  /** Canonical display name, e.g. "Ray-Ban". */
  label: string;
  /** Other spellings found in the catalog, e.g. "ray ban", "rayban". */
  aliases?: readonly string[];
};

export declare const TITLE_SUFFIX: string;
export declare const MAX_TITLE_LENGTH: number;
export declare const MAX_PAGE_TITLE_LENGTH: number;
export declare const META_DESCRIPTION_MIN_LENGTH: number;
export declare const META_DESCRIPTION_MAX_LENGTH: number;

export function isGenericSeoText(value: string | null | undefined, productName?: string): boolean;
export function normalizeEyewearTerms(value: string): string;
export function productDisplayName(name: string, brand: BrandSpelling): string;
export function truncateWords(value: string, maxLength: number): string;
export function plainName(displayName: string): string;
export function productPageTitle(displayName: string, kind: ProductKind): string;
export function listPhrase(items: readonly string[]): string;
export function fitDescription(
  parts: { leads: readonly string[]; offers?: readonly string[]; extras?: readonly string[] },
  min?: number,
  max?: number,
): string;
export function extractModelCode(input: {
  brand: string;
  name: string;
  skus?: readonly string[];
}): string | null;
export function dedupeImages(urls: readonly (string | null | undefined)[]): string[];
