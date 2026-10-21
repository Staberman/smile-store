const STOREFRONT_ORIGIN = "https://smiletienda.mitiendanube.com";

/**
 * The product's page on the Tiendanube storefront, where buying works without
 * API credentials. Catalog `sourceUrl`s still carry the store's former custom
 * domain, so only their `/productos/<handle>/` path is reused.
 */
export function toStorefrontProductUrl(sourceUrl: string): string | null {
  try {
    const { pathname } = new URL(sourceUrl);
    return pathname.startsWith("/productos/") ? `${STOREFRONT_ORIGIN}${pathname}` : null;
  } catch {
    return null;
  }
}
