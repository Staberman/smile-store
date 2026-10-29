/** What the search reads of a product; summaries and catalog products both fit. */
export type SearchableProduct = {
  name: string;
  brand?: string | null;
  categories?: readonly string[];
};

export type ProductSearchOptions<P> = {
  /** More text the product is found by: a grid's label, the search index entry. */
  extraText?: (product: P) => string | null | undefined;
};

/** Lowercase, without accents, single spaces, trimmed. */
export function normalizeSearchText(text: string | null | undefined): string;
/** The normalized words of a query. */
export function searchTokens(query: string | null | undefined): string[];
/** Every word of the query is in the product's text; an empty query matches all. */
export function matchesSearch<P extends SearchableProduct>(
  product: P,
  query: string | null | undefined,
  options?: ProductSearchOptions<P>,
): boolean;
/** The matching products, best first, at most `limit`; none for an empty query. */
export function searchProducts<P extends SearchableProduct>(
  products: readonly P[],
  query: string | null | undefined,
  options?: ProductSearchOptions<P> & { limit?: number },
): P[];
