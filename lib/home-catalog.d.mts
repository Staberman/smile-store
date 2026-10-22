import type { StorefrontView } from "./storefront.mjs";

/** Fields the view filters and the carousel read; product summaries have them. */
type HomeCatalogProduct = {
  slug: string;
  name: string;
  brand: string;
  categories: string[];
  price: number | null;
  promotionalPrice: number | null;
  tags?: string[];
  image?: string | null;
  variants: { available: boolean; stock: number; image?: string | null }[];
};

export const HOME_GRID_PREVIEW_COUNT: number;
export const STORE_PRODUCTS_PATH: string;

export function storeViewProducts<P extends HomeCatalogProduct>(
  products: P[],
  view: StorefrontView | string,
  bestSellerSlugs?: string[],
): P[];

export function homeCatalogPreview<P extends HomeCatalogProduct>(
  products: P[],
  options: {
    view: StorefrontView | string;
    views?: readonly (StorefrontView | string)[];
    gridCount?: number;
    pinned?: P[];
    bestSellerSlugs?: string[];
  },
): P[];

export function storeViewCounts(
  products: HomeCatalogProduct[],
  views: readonly string[],
  bestSellerSlugs?: string[],
): Record<string, number>;
