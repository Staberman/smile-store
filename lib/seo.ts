import type { Metadata } from "next";
import type { CatalogProduct } from "@/lib/catalog";
import type { Crumb } from "@/lib/collections";
import { getProductSeo } from "@/lib/product-meta";
import { TITLE_SUFFIX } from "@/lib/product-seo.mjs";
import {
  INSTAGRAM_URL,
  PHONE_E164,
  STORE_ALTERNATE_NAME,
  STORE_EMAIL,
  STORE_LOCATION,
} from "@/lib/store-facts";

export const SITE_URL = "https://smiletiendaimp.com.ar";
export const SITE_NAME = "Smile";

const SITE_SOCIAL_IMAGE = {
  url: "/images/card-relojes.jpg",
  width: 1152,
  height: 603,
  alt: "Smile | Relojes, lentes y accesorios premium en Argentina",
};

/**
 * Site-wide OpenGraph/Twitter defaults. Next replaces (does not deep-merge)
 * a parent's `openGraph`/`twitter` when a page sets its own, so pages spread
 * these and add their own title, description and url.
 */
export const SITE_OPEN_GRAPH = {
  type: "website",
  locale: "es_AR",
  siteName: SITE_NAME,
  images: [SITE_SOCIAL_IMAGE],
} satisfies NonNullable<Metadata["openGraph"]>;

export const SITE_TWITTER = {
  card: "summary_large_image",
  images: [SITE_SOCIAL_IMAGE.url],
} satisfies NonNullable<Metadata["twitter"]>;

type SocialImage = { url: string; width?: number; height?: number; alt: string };

/**
 * Metadata for an indexable page: title, description, self-canonical and the
 * page's own OpenGraph/Twitter card (title, description, url, image), on top
 * of the site defaults. `title` excludes the " | Smile" suffix the root
 * layout's template appends; social titles include it.
 */
export function pageMetadata({
  title,
  description,
  path,
  image,
  type = "website",
}: {
  title: string;
  description: string;
  /** Site-relative path, resolved against metadataBase. */
  path: string;
  /** Defaults to the site's social image. */
  image?: SocialImage;
  type?: "website" | "article";
}): Metadata {
  const socialTitle = `${title}${TITLE_SUFFIX}`;
  const images = image ? [image] : SITE_OPEN_GRAPH.images;

  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      ...SITE_OPEN_GRAPH,
      type,
      url: path,
      title: socialTitle,
      description,
      images,
    },
    twitter: {
      ...SITE_TWITTER,
      title: socialTitle,
      description,
      images: images.map((entry) => entry.url),
    },
  };
}

/** JSON-LD id of the store; other nodes reference it instead of repeating it. */
export const ORGANIZATION_ID = `${SITE_URL}/#organization`;
export const LOGO_URL = `${SITE_URL}/images/smile-logo.png`;

/** The store as an OnlineStore (an Organization subtype), sitewide. */
export function organizationSchema() {
  return {
    "@type": "OnlineStore",
    "@id": ORGANIZATION_ID,
    name: SITE_NAME,
    alternateName: [STORE_ALTERNATE_NAME],
    url: SITE_URL,
    logo: {
      "@type": "ImageObject",
      url: LOGO_URL,
      width: 512,
      height: 512,
    },
    image: LOGO_URL,
    email: STORE_EMAIL,
    telephone: PHONE_E164,
    sameAs: [INSTAGRAM_URL],
    // City only. The pickup point is arranged over WhatsApp and has no public
    // street address or opening hours, so neither belongs here.
    address: {
      "@type": "PostalAddress",
      addressLocality: STORE_LOCATION.locality,
      addressRegion: STORE_LOCATION.region,
      addressCountry: STORE_LOCATION.countryCode,
    },
    areaServed: STORE_LOCATION.countryCode,
    contactPoint: {
      "@type": "ContactPoint",
      telephone: PHONE_E164,
      email: STORE_EMAIL,
      contactType: "customer service",
      areaServed: STORE_LOCATION.countryCode,
      availableLanguage: "es",
    },
  };
}

export function absoluteUrl(path: string): string {
  if (path.startsWith("http")) return path;
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

export function productUrl(product: Pick<CatalogProduct, "slug">): string {
  return absoluteUrl(`/tienda/productos/${product.slug}`);
}

export function productAvailability(product: CatalogProduct): string {
  return product.variants.some((variant) => variant.available && variant.stock > 0)
    ? "https://schema.org/InStock"
    : "https://schema.org/OutOfStock";
}

export function breadcrumbSchema(trail: Crumb[]) {
  return {
    "@type": "BreadcrumbList",
    itemListElement: trail.map((crumb, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: crumb.name,
      item: absoluteUrl(crumb.href),
    })),
  };
}

/**
 * CollectionPage + ItemList for a hub. Pass the same `trail` the page renders
 * in its visible breadcrumbs; it defaults to "Inicio > name".
 */
export function collectionSchema(
  path: string,
  name: string,
  products: CatalogProduct[],
  trail: Crumb[] = [
    { name: "Inicio", href: "/" },
    { name, href: path },
  ],
) {
  // The homepage has no parent level, so a breadcrumb would only repeat "/".
  const breadcrumb = path === "/" ? [] : [breadcrumbSchema(trail)];

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        "@id": `${absoluteUrl(path)}#collection`,
        name,
        url: absoluteUrl(path),
        isPartOf: { "@id": `${absoluteUrl("/")}#website` },
      },
      {
        "@type": "ItemList",
        itemListElement: products.slice(0, 50).map((product, index) => ({
          "@type": "ListItem",
          position: index + 1,
          url: productUrl(product),
          name: getProductSeo(product).displayName,
        })),
      },
      ...breadcrumb,
    ],
  };
}
