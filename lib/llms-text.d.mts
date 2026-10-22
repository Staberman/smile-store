import type { CollectionHub } from "./collection-hubs.mjs";
import type { ProductSpec } from "./product-copy.mjs";
import type { ProductKind } from "./product-seo.mjs";

export type LlmsStore = {
  /** Site name, e.g. "Smile". */
  name: string;
  /** e.g. "Smile Tienda". */
  alternateName: string;
};

export type LlmsContact = {
  whatsappUrl: string;
  /** As displayed, e.g. "+54 9 341 261 3504". */
  phone: string;
  email: string;
  instagramUrl: string;
};

/** An indexed hub: its name, site-relative path and one-line description. */
export type LlmsHub = {
  name: string;
  path: string;
  description: string;
};

/** Catalog fields the full version reads. */
export type LlmsCatalogProduct = {
  slug: string;
  name: string;
  brand: string;
  categories: string[];
  descriptionHtml: string;
  price: number | null;
  promotionalPrice: number | null;
  variants: {
    id: number | null;
    price: number | null;
    promotionalPrice: number | null;
    stock: number;
    available: boolean;
  }[];
};

export type LlmsEntry<P extends LlmsCatalogProduct = LlmsCatalogProduct> = {
  product: P;
  facts: {
    /** Display name, as the product page's H1. */
    name: string;
    /** Canonical brand label, e.g. "Ray-Ban". */
    brand: string;
    /** lib/catalog's hasPurchasableStock. */
    purchasable: boolean;
  };
};

export type LlmsProduct = {
  slug: string;
  name: string;
  url: string;
  brand: string;
  kind: ProductKind;
  /** As the product page displays it, e.g. "$ 182.700". */
  price: string;
  inStock: boolean;
  specs: ProductSpec[];
  /** The Ray-Ban model hub that lists the product, if any. */
  model: CollectionHub | null;
};

/** The opening summary of /llms.txt and /llms-full.txt. */
export function llmsSummary(store: LlmsStore): string;

export function llmsProduct(entry: LlmsEntry, siteUrl: string): LlmsProduct;

/** The /llms-full.txt document. */
export function buildLlmsFull(input: {
  siteUrl: string;
  store: LlmsStore;
  contact: LlmsContact;
  hubs: readonly LlmsHub[];
  entries: readonly LlmsEntry[];
  faqs?: readonly { question: string; answer: string }[];
}): string;
