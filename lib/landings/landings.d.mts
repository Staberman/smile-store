import type { CollectionHub, HubPriceBlock, HubProduct } from "../collection-hubs.mjs";
import type { GuideBlock, GuideFaq } from "../guides/guides.mjs";

/** Catalog fields the landing pages read (price, stock and variants included). */
export type LandingProduct = HubProduct & { slug: string };

/** What the landing pages need from the app. */
export type LandingContext<P extends LandingProduct = LandingProduct> = {
  /** Purchasable products only. */
  inStock: readonly P[];
  /** Purchasable products in the sales ranking, best sellers first. */
  bestSellers?: readonly P[];
  /** Display name of a raw catalog brand ("Ray ban" -> "Ray-Ban"). */
  brandLabel: (rawBrand: string) => string;
  /** Page of a brand by display name, or null. */
  brandHref: (brand: string) => string | null;
  /** Indexed sunglasses audience hubs (mujer / hombre); empty while noindex. */
  audienceHubs: readonly CollectionHub[];
  /** The build date by default: sets the summer season. */
  date?: Date;
};

/** A product card and the small label above its name. */
export type LandingItem<P> = { product: P; label: string };

export type LandingSection<P> = {
  /** Anchor id, unique within the page. */
  id: string;
  /** H2. */
  heading: string;
  /** Opening paragraph; may carry `[label](/path)` links. */
  answer: string;
  blocks: GuideBlock[];
  /** Product cards under the text; empty for text-only sections. */
  items: LandingItem<P>[];
};

export type SummerSeason = {
  /** The summer's year: 2027 from July 2026 to June 2027. */
  year: number;
  /** "verano 2027". */
  label: string;
  /** True from 1 October to 25 December: the gift section speaks of Christmas. */
  christmas: boolean;
  /** ISO date of the last calendar switch (1 July, 1 October or 26 December). */
  since: string;
};

export type Landing<P = LandingProduct> = {
  key: "rosario" | "summer";
  /** Site-relative URL, also the canonical. */
  path: string;
  /** <title> without the " | Smile" suffix. */
  title: string;
  h1: string;
  eyebrow: string;
  /** Last breadcrumb. */
  crumb: string;
  /** Text of links to the page (hubs, home, footer). */
  linkLabel: string;
  /** One line for llms.txt. */
  summary: string;
  /** Meta description, one sentence of at most 155 characters. */
  description: string;
  /** Plain-text intro under the H1. */
  lead: string;
  /** Null without stock: the page omits the block. */
  priceBlock: HubPriceBlock | null;
  sections: LandingSection<P>[];
  faqTitle: string;
  /** Plain-text questions and answers, for the FAQ block and its FAQPage JSON-LD. */
  faqs: GuideFaq[];
  /** Related pages, as chips at the end. */
  links: { label: string; href: string }[];
  /** Every product the page shows, once, in order: the ItemList. */
  products: P[];
  /** ISO dates (YYYY-MM-DD). */
  datePublished: string;
  dateModified: string;
  /** Summer page only. */
  season?: SummerSeason;
};

export declare const LANDING_PATHS: { readonly rosario: string; readonly summer: string };
export declare const LANDING_GRID_LIMIT: number;
export declare const MIN_BEST_SELLERS: number;
export declare const ROSARIO_DATES: { published: string; modified: string };
export declare const SUMMER_DATES: { published: string; modified: string };

/** The summer a page sells for on a date (Argentina time), and its Christmas angle. */
export function summerSeason(date?: Date): SummerSeason;
/** Ready-made links to both pages; the summer label follows the date. */
export function landingLinks(date?: Date): {
  rosario: { label: string; href: string };
  summer: { label: string; href: string };
};

export function rosarioLanding<P extends LandingProduct>(context: LandingContext<P>): Landing<P>;
export function summerLanding<P extends LandingProduct>(context: LandingContext<P>): Landing<P>;
export function buildLandings<P extends LandingProduct>(context: LandingContext<P>): Landing<P>[];

/** Visible text without link markup: H1, lead, sections and FAQ. */
export function landingText(landing: Landing<unknown>): string;
/** Internal hrefs the page body links to. */
export function landingHrefs(landing: Landing<unknown>): string[];

/** True when the price a product card shows is a promotional one, in stock. */
export function isOnSale(product: LandingProduct): boolean;
/** Products on sale, the largest reduction first. */
export function saleProducts<P extends LandingProduct>(products: readonly P[]): P[];
/** True when the product sheet states UV protection. */
export function statesUvProtection(product: Pick<HubProduct, "descriptionHtml">): boolean;
/** Gift price bands split at the free-shipping minimum. */
export function giftBands<P extends LandingProduct>(
  products: readonly P[],
  options: { minimumArs: number; brandLabel: (rawBrand: string) => string },
): { label: string; count: number; range: { min: number; max: number }; brands: string; products: P[] }[];
