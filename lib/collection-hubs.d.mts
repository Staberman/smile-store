import type { Audience } from "./product-copy.mjs";

/** Catalog fields the hub helpers read. */
export type HubProduct = {
  id: string;
  name: string;
  brand: string;
  categories: readonly string[];
  tags: readonly string[];
  descriptionHtml: string;
  price: number | null;
  promotionalPrice: number | null;
  variants: readonly {
    sku: string;
    options: readonly string[];
    stock: number;
    available: boolean;
  }[];
};

export type HubGroup = "category" | "audience" | "model";
/** Section a hub hangs from in the breadcrumbs (lib/collections); null for top-level hubs. */
export type HubParent = "ray-ban" | "anteojos-de-sol" | "relojes" | null;

export type CollectionHub = {
  key: string;
  group: HubGroup;
  parent: HubParent;
  slug: string;
  /** Site-relative URL, also the canonical. */
  path: string;
  name: string;
  /** <title> without the " | Smile" suffix. */
  title: string;
  h1: string;
  eyebrow: string;
  /** Last breadcrumb. */
  crumb: string;
  /** Text of links to the hub (chips, footer). */
  linkLabel: string;
  /** What the hub lists, lowercase, for sentences: "anteojos de sol Ray-Ban Aviador". */
  subject: string;
  /** Heading of the in-stock grid. */
  gridLabel: string;
  /** One line for llms.txt. */
  summary: string;
  descriptionLeads: readonly string[];
  alternativesTitle: string;
  /** Model hubs: one verifiable sentence about the model. */
  fact?: string;
  /** Audience hubs only. */
  kind?: "sunglasses" | "watch";
  audience?: "men" | "women";
  audienceLabel?: string;
  storeTerm?: string;
  matches: (product: HubProduct) => boolean;
  /** Products of the section the hub belongs to (Ray-Ban for a model hub). */
  inParent: (product: HubProduct) => boolean;
};

export type FaqEntry = { question: string; answer: string };

/** Formatter and brand/name helpers the copy needs from the app. */
export type HubCopyContext = {
  formatPrice: (value: number) => string;
  brandLabel: (rawBrand: string) => string;
  displayName: (product: HubProduct) => string;
};

export type HubFacts = {
  count: number;
  price: { min: number; max: number } | null;
  brands: { label: string; count: number }[];
  lensTypes: string[];
  lensMaterials: string[];
  frameMaterials: string[];
  formats: string[];
  colorways: string[];
  genders: { unisex: number; men: number; women: number; unknown: number };
};

export const MIN_INDEXABLE_PRODUCTS: number;
export const MIN_IN_STOCK_PRODUCTS: number;
export const MIN_AUDIENCE_EXCLUSION: number;

export const RAY_BAN_MODEL_HUBS: readonly CollectionHub[];
export const SUNGLASSES_HUB: CollectionHub;
export const AUDIENCE_HUBS: readonly CollectionHub[];
export const COLLECTION_HUBS: readonly CollectionHub[];

/** The Ray-Ban model hub that lists a product, or null. */
export function modelHubOf(
  product: Pick<HubProduct, "name" | "brand" | "categories">,
): CollectionHub | null;
export function isIndexableHub(catalogCount: number): boolean;
export function isDistinctFromParent(catalogCount: number, parentCount: number): boolean;
export function isRayBanProduct(product: Pick<HubProduct, "brand" | "categories">): boolean;
export function isSunglassesProduct(product: Pick<HubProduct, "categories">): boolean;
export function productGender(product: HubProduct): Audience;
export function priceRange(products: readonly HubProduct[]): { min: number; max: number } | null;
export function hubFacts(
  products: readonly HubProduct[],
  context?: Partial<Pick<HubCopyContext, "brandLabel">>,
): HubFacts;
export function countWords(text: string): number;
export function hubMetaDescription(leads: readonly string[]): string;

export type HubPageInput<P extends HubProduct> = {
  inStock: P[];
  outOfStock: P[];
  parentInStock: P[];
  parentCatalog: P[];
};

/** The input plus every hub product, in stock or not. */
type HubCopyPage<P extends HubProduct> = HubPageInput<P> & { catalog: P[] };

export function hubIntro<P extends HubProduct>(
  hub: CollectionHub,
  page: HubCopyPage<P>,
  context: HubCopyContext,
): string;
export function hubFaqs<P extends HubProduct>(
  hub: CollectionHub,
  page: HubCopyPage<P>,
  context: HubCopyContext,
): FaqEntry[];
export function hubAlternatives<P extends HubProduct>(
  hub: CollectionHub,
  page: HubCopyPage<P>,
  limit?: number,
): P[];

export function buildHubPage<P extends HubProduct>(
  hub: CollectionHub,
  input: HubPageInput<P>,
  context: HubCopyContext,
): {
  /** Hub products in the catalog, in stock or not. */
  catalogCount: number;
  indexable: boolean;
  description: string;
  intro: string;
  faqs: FaqEntry[];
  /** In-stock products of the parent section, while the hub has few in stock. */
  alternatives: P[];
};
