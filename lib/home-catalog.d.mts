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

export declare const HOME_GRID_PREVIEW_COUNT: number;
export declare const STORE_PRODUCTS_PATH: string;

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

export declare const STORE_PRODUCTS_RETRY_DELAYS_MS: readonly number[];

export type StoreProductsLoader<P> = {
  /** The full list once a load has succeeded, else null. */
  readonly loaded: P[] | null;
  /** Resolves to the list, or to null when every attempt failed. */
  load(): Promise<P[] | null>;
};

export function createStoreProductsLoader<P>(options?: {
  url?: string;
  retryDelaysMs?: readonly number[];
  fetch?: (url: string) => Promise<{ ok: boolean; status: number; json(): Promise<unknown> }>;
  wait?: (ms: number) => Promise<void>;
}): StoreProductsLoader<P>;
