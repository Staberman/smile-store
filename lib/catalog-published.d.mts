/** False only for a product Tiendanube has unpublished (`published: false`). */
export function isPublished(product: { published?: boolean }): boolean;
/** The published products, in catalog order: the only ones the site lists. */
export function publishedOnly<P extends { published?: boolean }>(products: readonly P[]): P[];
