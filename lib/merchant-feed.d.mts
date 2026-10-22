import type { ProductSpec } from "./product-copy.mjs";

export type MerchantAvailability = "in_stock" | "out_of_stock";
export type MerchantGender = "male" | "female" | "unisex";
export type MerchantExclusionReason = "no image" | "no price" | "no description";

/** Catalog variant fields the feed reads. */
export type FeedVariant = {
  id: number | null;
  options: readonly string[];
  price: number | null;
  promotionalPrice: number | null;
  stock: number;
  available: boolean;
  image: string | null;
};

/** Catalog product fields the feed reads. */
export type FeedProduct = {
  id: string;
  slug: string;
  categories: string[];
  tags: string[];
  images: readonly string[];
  price: number | null;
  promotionalPrice: number | null;
  variants: FeedVariant[];
};

/** What the site derives elsewhere for a product. */
export type MerchantFacts = {
  /** Display name, as the product page H1 shows it. */
  title: string;
  /** Canonical brand label, e.g. "Ray-Ban". */
  brand: string;
  /** Manufacturer model code, when reliably known. */
  mpn: string | null;
  /** Canonical product page URL. */
  link: string;
  /** Whether the product can be bought (hasPurchasableStock). */
  purchasable: boolean;
  /** Description copy as the product page shows it. */
  copy: { paragraphs: readonly string[]; specs: readonly ProductSpec[] };
};

export type MerchantItem = {
  id: string;
  title: string;
  description: string;
  link: string;
  imageLink: string;
  additionalImageLinks: string[];
  availability: MerchantAvailability;
  /** "182700.00 ARS" */
  price: string;
  condition: "new";
  brand: string | null;
  mpn: string | null;
  identifierExists: "no" | null;
  googleProductCategory: number | null;
  productType: string | null;
  gender: MerchantGender | null;
  ageGroup: "adult";
  color: string | null;
};

export type MerchantExclusion = {
  id: string;
  slug: string;
  reason: MerchantExclusionReason;
};

export type MerchantChannel = {
  title: string;
  link: string;
  description: string;
};

export declare const MERCHANT_CURRENCY: string;
export declare const MAX_TITLE_LENGTH: number;
export declare const MAX_DESCRIPTION_LENGTH: number;
export declare const MAX_ADDITIONAL_IMAGES: number;
export declare const GOOGLE_PRODUCT_CATEGORIES: { sunglasses: number; watch: number };

export function defaultVariant<V extends FeedVariant>(product: { variants: V[] }): V | null;
export function merchantPrice(amount: number): string;
export function feedDescription(copy: {
  paragraphs?: readonly string[];
  specs?: readonly ProductSpec[];
}): string;
export function variantColor(variant: Pick<FeedVariant, "options"> | null | undefined): string | null;
export function merchantGender(
  product: Pick<FeedProduct, "categories" | "tags">,
  specs?: readonly ProductSpec[],
): MerchantGender | null;
export function toMerchantItem(
  product: FeedProduct,
  facts: MerchantFacts,
  siteUrl: string,
): { item: MerchantItem; excluded?: undefined } | { item?: undefined; excluded: MerchantExclusion };
export function renderMerchantFeed(channel: MerchantChannel, items: readonly MerchantItem[]): string;
export function buildMerchantFeed(input: {
  channel: MerchantChannel;
  /** Origin that site-relative image paths resolve against. */
  siteUrl: string;
  entries: readonly { product: FeedProduct; facts: MerchantFacts }[];
}): { xml: string; items: MerchantItem[]; excluded: MerchantExclusion[] };
