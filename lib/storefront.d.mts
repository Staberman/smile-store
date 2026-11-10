import type { CatalogProduct } from "./catalog";

export type StorefrontView =
  | "lentes"
  | "relojes"
  | "ray-ban"
  | "ferrari"
  | "premium"
  | "best-sellers"
  | "offers";

// Structural shapes: these helpers run on full catalog products (server) and
// on slim product summaries (client), so they only require the fields they read.
type PriceFields = {
  price: number | null;
  promotionalPrice: number | null;
};

type StockVariant = PriceFields & {
  id: number | null;
  stock: number;
  available: boolean;
};

type ProductWithVariants<V extends StockVariant = StockVariant> = {
  variants: V[];
};

type FilterableProduct = PriceFields & {
  name: string;
  brand: string;
  categories: string[];
  // Product summaries omit tags; no view depends on them today.
  tags?: string[];
};

/** Has an id, stock and a price. */
export function isPurchasableVariant(variant: StockVariant): boolean;
export function getAvailableVariants<V extends StockVariant>(
  product: ProductWithVariants<V>,
): V[];
export function availableStock(product: ProductWithVariants): number;
export function stockUrgencyLabel(product: ProductWithVariants): string | null;
export function getDisplayPrice(
  product: PriceFields,
  variant?: PriceFields | null,
): number | null;
/** A promoted price's regular price and its percent off, rounded down. */
export type Promotion = {
  regularPrice: number;
  /** Whole percent off, rounded down; 0 when under 1%. */
  discountPercent: number;
};
/** Percent off, rounded down; 0 when the pair is no promotion. */
export function discountPercent(
  price: number | null | undefined,
  promotionalPrice: number | null | undefined,
): number;
/**
 * The promotion behind getDisplayPrice(product, variant), or null: a
 * purchasable variant's positive promotional price below its own price.
 */
export function getPromotion(
  product: PriceFields & ProductWithVariants,
  variant?: StockVariant | null,
): Promotion | null;
/** The variant a product card selects first: first purchasable, else first, else null. */
export function defaultVariant<V extends StockVariant>(
  product: ProductWithVariants<V>,
): V | null;
/** The price a product card shows before a variant is picked. */
export function cardPrice(product: PriceFields & ProductWithVariants): number | null;
/** By card price, "asc" or "desc"; no price last, ties in input order. New array. */
export function sortByCardPrice<P extends PriceFields & ProductWithVariants>(
  products: readonly P[],
  order: "asc" | "desc",
): P[];
export declare const TRANSFER_DISCOUNT_PERCENT: number;
export declare const INTEREST_FREE_INSTALLMENTS: number;
/** Order total (ARS) above which checkout ships for free; 0 = every order. */
export declare const FREE_SHIPPING_MINIMUM_ARS: number;
export function getTransferPrice(price: number | null | undefined): number | null;
export function getInstallmentPrice(price: number | null | undefined): number | null;
export function isOffer(product: PriceFields): boolean;
export function isWatch(product: { categories?: string[] }): boolean;
export function getComplementaryProducts(
  product: CatalogProduct,
  products: CatalogProduct[],
  limit?: number,
): CatalogProduct[];
type CarouselProduct = {
  slug: string;
  image?: string | null;
  variants: { available: boolean; stock: number; image?: string | null }[];
};

export function carouselImage(product: CarouselProduct): string | null;
export function carouselSlides<P extends CarouselProduct>(products: P[], limit?: number): P[];
export function filterStorefrontProducts<P extends FilterableProduct>(
  products: P[],
  view: StorefrontView | string,
): P[];
