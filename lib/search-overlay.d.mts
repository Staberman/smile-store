import type { ProductSearchOptions, SearchableProduct } from "./product-search.mjs";

export declare const MIN_QUERY_LENGTH: number;
export declare const RESULT_LIMIT: number;
export declare const CATALOG_QUERY_PARAM: string;
export declare const CATALOG_ANCHOR: string;

/** Homepage highlights, alternated, kept to `products`, topped up in catalog order. */
export function featuredSearchProducts<P extends { slug: string }>(
  products: readonly P[],
  highlights?: { slides?: readonly { slug: string }[]; watches?: readonly { slug: string }[] },
  count?: number,
): P[];

export function canSuggest(query: string): boolean;

export type SearchPanel<F, P> =
  | { kind: "featured"; items: F[]; resultCount: 0 }
  | { kind: "loading"; items: never[]; resultCount: 0 }
  | { kind: "empty"; items: never[]; resultCount: 0 }
  | { kind: "results"; items: P[]; resultCount: number };

export function searchPanel<F, P extends SearchableProduct>(
  query: string,
  options: ProductSearchOptions<P> & {
    featured: readonly F[];
    /** Null while the product list loads. */
    products: readonly P[] | null;
    limit?: number;
  },
): SearchPanel<F, P>;

export function optionCountFor(panel: { kind: string; items: readonly unknown[] }): number;
export function clampHighlight(active: number, optionCount: number): number;
export function moveHighlight(active: number, step: 1 | -1, optionCount: number): number;
export function enterAction(
  query: string,
  highlighted: number,
  panel: { items: readonly unknown[] },
): { action: "none" } | { action: "product"; index: number } | { action: "results" };
export function seeAllResultsLabel(count: number): string;
export function resultCountLabel(count: number): string;
export function catalogSearchHref(query: string): string;
export function searchFromAddress(previousParam: string, param: string, search: string): string;
