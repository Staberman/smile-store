import type { CatalogProduct, CatalogVariant } from "./catalog";

export type StorefrontView =
  | "lentes"
  | "relojes"
  | "ray-ban"
  | "ferrari"
  | "premium"
  | "best-sellers"
  | "offers";

export function getAvailableVariants(product: CatalogProduct): CatalogVariant[];
export function getDisplayPrice(
  product: CatalogProduct,
  variant?: CatalogVariant | null,
): number | null;
export function getTransferPrice(price: number | null | undefined): number | null;
export function getInstallmentPrice(price: number | null | undefined): number | null;
export function isOffer(product: CatalogProduct): boolean;
export function isWatch(product: CatalogProduct): boolean;
export function filterStorefrontProducts(
  products: CatalogProduct[],
  view: StorefrontView | string,
): CatalogProduct[];
