// Whether Tiendanube publishes a catalog product. The stock sync
// (scripts/tiendanube/sync-utils.mjs) writes `published: false` on a product
// the store unpublishes and drops the field once it is published again, so a
// missing field means published. Plain JavaScript so node:test checks the same
// rule lib/catalog.ts applies to the whole site.

/** False only for a product Tiendanube has unpublished. */
export function isPublished(product) {
  return product.published !== false;
}

/** The published products, in catalog order: the only ones the site lists. */
export function publishedOnly(products) {
  return products.filter(isPublished);
}
