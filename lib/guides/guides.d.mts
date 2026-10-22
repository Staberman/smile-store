import type { HubProduct } from "../collection-hubs.mjs";

/** Catalog fields the guides read. */
export type GuideProduct = HubProduct & { slug: string };

/** What the guides need from the app: the catalog and the display name. */
export type GuideContext<P extends GuideProduct = GuideProduct> = {
  /** Every catalog product, in stock or not. */
  catalog: readonly P[];
  /** Purchasable products only. */
  inStock: readonly P[];
  displayName: (product: P) => string;
};

/**
 * Body blocks. Text fields may carry internal links as `[label](/path)`;
 * render them with inlineSegments() and strip them with stripLinks().
 * `catalog` marks blocks built from the products in stock: capped at
 * CATALOG_LIST_LIMIT products and left out of guideAuthoredText().
 */
export type GuideBlock = { catalog?: boolean } & (
  | { type: "paragraph"; text: string }
  | { type: "list"; ordered: boolean; items: string[] }
  | { type: "steps"; items: { title: string; text: string }[] }
  | { type: "table"; caption: string; head: string[]; rows: string[][] }
  | { type: "links"; items: { label: string; href: string }[] }
);

export type GuideSection = {
  /** Anchor id, unique within the guide. */
  id: string;
  /** Question-style H2. */
  heading: string;
  /** Direct 40-60 word answer that opens the section. */
  answer: string;
  blocks: GuideBlock[];
};

export type GuideSource = {
  publisher: string;
  title: string;
  /** https URL. */
  url: string;
};

export type GuideFaq = { question: string; answer: string };

/** Index section a guide belongs to. */
export type GuideTopic = "anteojos" | "relojes";

export type Guide = {
  slug: string;
  topic: GuideTopic;
  /** Site-relative URL, also the canonical. */
  path: string;
  /** <title> without the " | Smile" suffix. */
  title: string;
  h1: string;
  /** Meta description, 140-155 characters. */
  description: string;
  /** One or two sentences for the guides index. */
  summary: string;
  /** Last breadcrumb. */
  crumb: string;
  /** ISO dates (YYYY-MM-DD). */
  datePublished: string;
  dateModified: string;
  /** Direct answer under the H1, within the first 60 words. */
  lead: string;
  sections: GuideSection[];
  /** Plain-text questions and answers; the page adds FAQPage JSON-LD only when present. */
  faqs: GuideFaq[];
  sources: GuideSource[];
  /** Topics for Article.about. */
  about: string[];
};

export declare const GUIDES_PATH: "/guias";
export function guidePath(slug: string): string;

type GuideKey =
  | "rayBanOriginals"
  | "rayBanModels"
  | "polarized"
  | "invictaOriginals"
  | "waterResistance"
  | "watchGift";
export declare const GUIDE_SLUGS: Readonly<Record<GuideKey, string>>;
/** Ready-made links to each guide, for the hubs. */
export declare const GUIDE_LINKS: Readonly<Record<GuideKey, { label: string; href: string }>>;

export declare const GUIDES_INDEX: {
  path: "/guias";
  title: string;
  h1: string;
  description: string;
  intro: string;
  crumb: string;
};

/** Index sections, in display order: every guide belongs to one. */
export declare const GUIDE_TOPICS: readonly { key: GuideTopic; label: string }[];
/** Guides of one topic, in display order. */
export function guidesOfTopic<G extends Guide>(guides: readonly G[], topic: GuideTopic): G[];

export function inlineSegments(text: string): { text: string; href?: string }[];
export function stripLinks(text: string): string;
export function inlineHrefs(text: string): string[];

/** Sunglasses the catalog names as polarized ("Aviador Polarizado 3025"). */
export function isPolarizedProduct(product: Pick<HubProduct, "name" | "categories">): boolean;
/** Invicta watches, by catalog brand. */
export function isInvictaProduct(product: Pick<HubProduct, "brand" | "categories">): boolean;

/** Every guide, resolved against the catalog, in display order. */
export function buildGuides<P extends GuideProduct>(context: GuideContext<P>): Guide[];

/** Visible body text without link markup: lead, sections and FAQ. */
export function guideText(guide: Guide): string;
/** guideText() without the catalog blocks: the copy the word-count rule applies to. */
export function guideAuthoredText(guide: Guide): string;
/** Blocks built from the products in stock (`catalog: true`), in order. */
export function catalogBlocks(guide: Guide): GuideBlock[];
/** Most products a catalog block lists before a "y N más" link to the hub. */
export declare const CATALOG_LIST_LIMIT: number;
/** Internal hrefs the guide body links to (inline links and link lists). */
export function guideLinks(guide: Guide): string[];
/** Latest dateModified among the guides. */
export function latestGuideDate(guides: readonly Guide[]): string;
