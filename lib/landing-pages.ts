import type { Metadata } from "next";
import { BRAND_DIRECTORY, canonicalBrand } from "@/lib/brand-directory";
import { allProducts, getBestSellers, type CatalogProduct } from "@/lib/catalog";
import { COLLECTION_TRAILS, type Crumb } from "@/lib/collections";
import { hubsOf, indexableHubs } from "@/lib/hub-pages";
import { rosarioLanding, summerLanding, type Landing } from "@/lib/landings/landings.mjs";
import { collectionSchema, pageMetadata } from "@/lib/seo";

// Catalog wiring for the landing pages defined in lib/landings: built once at
// build time from the products in stock, plus their metadata, breadcrumbs and
// structured data.

export type LandingPage = Landing<CatalogProduct>;

const context = {
  inStock: allProducts,
  bestSellers: getBestSellers(),
  brandLabel: canonicalBrand,
  brandHref: (brand: string) => BRAND_DIRECTORY.find((entry) => entry.name === brand)?.href ?? null,
  // Same rule as the navigation: noindex audience hubs get no link.
  audienceHubs: indexableHubs(hubsOf("audience", "anteojos-de-sol")),
};

export const ROSARIO_LANDING: LandingPage = rosarioLanding(context);
export const SUMMER_LANDING: LandingPage = summerLanding(context);
export const LANDINGS: LandingPage[] = [ROSARIO_LANDING, SUMMER_LANDING];

/** "Inicio > Anteojos de sol > En Rosario": the pages sit under the sunglasses hub. */
export function landingTrail(landing: LandingPage): Crumb[] {
  return [...COLLECTION_TRAILS["anteojos-de-sol"], { name: landing.crumb, href: landing.path }];
}

export function landingMetadata(landing: LandingPage): Metadata {
  return pageMetadata({ title: landing.title, description: landing.description, path: landing.path });
}

/**
 * CollectionPage + ItemList of the products the page shows + BreadcrumbList;
 * the FAQ block adds its own FAQPage. No LocalBusiness: the pickup point has
 * no public address or opening hours.
 */
export function landingSchema(landing: LandingPage) {
  return collectionSchema(landing.path, landing.h1, landing.products, landingTrail(landing));
}
