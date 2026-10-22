import type { Metadata } from "next";
import { canonicalBrand } from "@/lib/brand-directory";
import {
  allProducts,
  allProductsIncludingOutOfStock,
  outOfStockProducts,
  type CatalogProduct,
} from "@/lib/catalog";
import {
  buildHubPage,
  COLLECTION_HUBS,
  modelHubOf,
  type CollectionHub,
  type HubCopyContext,
} from "@/lib/collection-hubs.mjs";
import { collectionHubTrail, type Crumb } from "@/lib/collections";
import { formatPrice } from "@/lib/format";
import { displayProductName } from "@/lib/product-name";
import { collectionSchema, pageMetadata } from "@/lib/seo";

// Catalog wiring for the hubs defined in lib/collection-hubs.mjs: their
// products, copy, metadata, breadcrumbs and structured data, computed once
// per hub at build time.

const COPY_CONTEXT: HubCopyContext = {
  formatPrice,
  brandLabel: canonicalBrand,
  displayName: (product) => displayProductName(product.name, product.brand),
};

export type HubPage = ReturnType<typeof buildHubPage<CatalogProduct>> & {
  hub: CollectionHub;
  trail: Crumb[];
  inStock: CatalogProduct[];
  outOfStock: CatalogProduct[];
};

const pages = new Map<string, HubPage>();

export function getHubPage(hub: CollectionHub): HubPage {
  const cached = pages.get(hub.key);
  if (cached) return cached;

  const inStock = allProducts.filter(hub.matches);
  const outOfStock = outOfStockProducts.filter(hub.matches);
  const page: HubPage = {
    ...buildHubPage(
      hub,
      {
        inStock,
        outOfStock,
        parentInStock: allProducts.filter(hub.inParent),
        parentCatalog: allProductsIncludingOutOfStock.filter(hub.inParent),
      },
      COPY_CONTEXT,
    ),
    hub,
    trail: collectionHubTrail(hub),
    inStock,
    outOfStock,
  };
  pages.set(hub.key, page);
  return page;
}

/** Hub by URL segment within a group, e.g. ("model", "aviador"). */
export function findHubBySlug(
  group: CollectionHub["group"],
  slug: string,
  parent?: CollectionHub["parent"],
): CollectionHub | undefined {
  return COLLECTION_HUBS.find(
    (hub) =>
      hub.group === group && hub.slug === slug && (parent === undefined || hub.parent === parent),
  );
}

/** Hubs of a group, optionally under one parent section. */
export function hubsOf(
  group: CollectionHub["group"],
  parent?: CollectionHub["parent"],
): CollectionHub[] {
  return COLLECTION_HUBS.filter(
    (hub) => hub.group === group && (parent === undefined || hub.parent === parent),
  );
}

/**
 * Hubs that are indexed (enough products in the catalog and, for audience
 * hubs, a listing distinct from their parent's): the ones the sitemap,
 * llms.txt and site navigation link to.
 */
export function indexableHubs(hubs: readonly CollectionHub[] = COLLECTION_HUBS): CollectionHub[] {
  return hubs.filter((hub) => getHubPage(hub).indexable);
}

/**
 * The Ray-Ban model hub a product page's breadcrumb goes through ("Inicio >
 * Ray-Ban > Aviador"): the product's model hub, when that hub is indexed.
 */
export function productModelHub(product: CatalogProduct): CollectionHub | null {
  const hub = modelHubOf(product);
  return hub && getHubPage(hub).indexable ? hub : null;
}

/** Title, description, self-canonical and robots of a hub page. */
export function hubMetadata(page: HubPage): Metadata {
  return {
    ...pageMetadata({ title: page.hub.title, description: page.description, path: page.hub.path }),
    // Hubs with too few products in the catalog, or audience hubs that would
    // repeat their parent's listing, stay out of the index (and of the
    // sitemap and navigation), whatever their stock. No cross-canonical:
    // noindex is the one signal. Their links are still followed.
    robots: { index: page.indexable, follow: true },
  };
}

/**
 * CollectionPage + ItemList + BreadcrumbList. A hub with nothing in stock
 * lists its sold-out products, which stay published.
 */
export function hubSchema(page: HubPage) {
  return collectionSchema(
    page.hub.path,
    page.hub.h1,
    page.inStock.length > 0 ? page.inStock : page.outOfStock,
    page.trail,
  );
}
