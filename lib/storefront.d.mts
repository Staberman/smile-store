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
export function availableStock(product: CatalogProduct): number;
export function stockUrgencyLabel(product: CatalogProduct): string | null;
export function getDisplayPrice(
  product: CatalogProduct,
  variant?: CatalogVariant | null,
): number | null;
export function getTransferPrice(price: number | null | undefined): number | null;
export function getInstallmentPrice(price: number | null | undefined): number | null;
export function isOffer(product: CatalogProduct): boolean;
export function isWatch(product: CatalogProduct): boolean;
export function getComplementaryProducts(
  product: CatalogProduct,
  products: CatalogProduct[],
  limit?: number,
): CatalogProduct[];
export function filterStorefrontProducts(
  products: CatalogProduct[],
  view: StorefrontView | string,
): CatalogProduct[];
