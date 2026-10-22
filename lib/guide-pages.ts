import type { Metadata } from "next";
import { allProducts, allProductsIncludingOutOfStock } from "@/lib/catalog";
import { HOME_CRUMB, type Crumb } from "@/lib/collections";
import {
  buildGuides,
  GUIDES_INDEX,
  latestGuideDate,
  stripLinks,
  type Guide,
} from "@/lib/guides/guides.mjs";
import { displayProductName } from "@/lib/product-name";
import {
  absoluteUrl,
  breadcrumbSchema,
  ORGANIZATION_ID,
  pageMetadata,
  SITE_OPEN_GRAPH,
} from "@/lib/seo";

// Catalog wiring for the buying guides defined in lib/guides: resolved once
// at build time, plus their metadata, breadcrumbs and structured data.

export const GUIDES: Guide[] = buildGuides({
  catalog: allProductsIncludingOutOfStock,
  inStock: allProducts,
  displayName: (product) => displayProductName(product.name, product.brand),
});

/** Latest change to any guide: the index's own dateModified. */
export const GUIDES_LAST_MODIFIED = latestGuideDate(GUIDES);

const GUIDES_CRUMB: Crumb = { name: GUIDES_INDEX.crumb, href: GUIDES_INDEX.path };
export const GUIDES_INDEX_TRAIL: Crumb[] = [HOME_CRUMB, GUIDES_CRUMB];

export function getGuide(slug: string): Guide | undefined {
  return GUIDES.find((guide) => guide.slug === slug);
}

export function guideTrail(guide: Guide): Crumb[] {
  return [...GUIDES_INDEX_TRAIL, { name: guide.crumb, href: guide.path }];
}

const DATE_LABEL = new Intl.DateTimeFormat("es-AR", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

/** "21 de octubre de 2026" for an ISO date. */
export function formatGuideDate(isoDate: string): string {
  return DATE_LABEL.format(new Date(isoDate));
}

export function guideMetadata(guide: Guide): Metadata {
  return pageMetadata({
    title: guide.title,
    description: guide.description,
    path: guide.path,
    type: "article",
  });
}

export const guidesIndexMetadata: Metadata = pageMetadata({
  title: GUIDES_INDEX.title,
  description: GUIDES_INDEX.description,
  path: GUIDES_INDEX.path,
});

/** Article (by the store) + BreadcrumbList; the FAQ block adds its own FAQPage. */
export function guideSchema(guide: Guide) {
  const url = absoluteUrl(guide.path);
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        "@id": `${url}#article`,
        headline: guide.h1,
        description: guide.description,
        inLanguage: "es-AR",
        datePublished: guide.datePublished,
        dateModified: guide.dateModified,
        author: { "@id": ORGANIZATION_ID },
        publisher: { "@id": ORGANIZATION_ID },
        image: absoluteUrl(SITE_OPEN_GRAPH.images[0].url),
        mainEntityOfPage: { "@type": "WebPage", "@id": url },
        url,
        isPartOf: { "@id": `${absoluteUrl("/")}#website` },
        about: guide.about.map((name) => ({ "@type": "Thing", name })),
        citation: guide.sources.map((source) => ({
          "@type": "CreativeWork",
          name: source.title,
          url: source.url,
          publisher: { "@type": "Organization", name: source.publisher },
        })),
      },
      breadcrumbSchema(guideTrail(guide)),
    ],
  };
}

/** CollectionPage + ItemList of the guides + BreadcrumbList. */
export function guidesIndexSchema() {
  const url = absoluteUrl(GUIDES_INDEX.path);
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        "@id": `${url}#collection`,
        name: GUIDES_INDEX.h1,
        description: GUIDES_INDEX.description,
        url,
        inLanguage: "es-AR",
        dateModified: GUIDES_LAST_MODIFIED,
        isPartOf: { "@id": `${absoluteUrl("/")}#website` },
        publisher: { "@id": ORGANIZATION_ID },
      },
      {
        "@type": "ItemList",
        itemListElement: GUIDES.map((guide, index) => ({
          "@type": "ListItem",
          position: index + 1,
          url: absoluteUrl(guide.path),
          name: guide.h1,
        })),
      },
      breadcrumbSchema(GUIDES_INDEX_TRAIL),
    ],
  };
}

/** FAQ entries as plain text, for the visible block and its FAQPage JSON-LD. */
export function guideFaqs(guide: Guide) {
  return guide.faqs.map((faq) => ({ question: faq.question, answer: stripLinks(faq.answer) }));
}
