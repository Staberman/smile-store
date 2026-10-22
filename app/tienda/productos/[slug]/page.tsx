import type { Metadata } from "next";
import { notFound } from "next/navigation";
import JsonLd from "@/components/seo/JsonLd";
import {
  type CatalogProduct,
  allProducts,
  allProductsIncludingOutOfStock,
  getProductBySlug,
  getRecommendedProducts,
  hasPurchasableStock,
} from "@/lib/catalog";
import { getProductCopy, getProductDescription, getProductSeo } from "@/lib/product-meta";
import { toProductDetail, toProductSummaries } from "@/lib/product-summary";
import { getComplementaryProducts } from "@/lib/storefront.mjs";
import { getProductTrail } from "@/lib/collections";
import { productModelHub } from "@/lib/hub-pages";
import {
  absoluteUrl,
  breadcrumbSchema,
  ORGANIZATION_ID,
  pageMetadata,
  productUrl,
} from "@/lib/seo";
import ProductDetailClient from "./ProductDetailClient";

interface Props {
  params: { slug: string };
}

// Every product page is prerendered from the build-time catalog. Unknown slugs
// get the static 404 page; rendering them on demand produced a client-only
// error shell instead of server-rendered 404 HTML.
export const dynamicParams = false;

export async function generateStaticParams() {
  // Include out-of-stock slugs so their pages are statically rendered and 200.
  return allProductsIncludingOutOfStock.map((product) => ({ slug: product.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const product = getProductBySlug(params.slug);
  if (!product) return { title: "Producto" };

  // Title and description come from the catalog's structured fields (brand,
  // model, type), not from Tiendanube's SEO fields, which are often store-wide
  // defaults, lack the brand or run past 60 characters.
  const seo = getProductSeo(product);
  const image = product.images[0];

  return pageMetadata({
    title: seo.title,
    description: seo.description,
    path: `/tienda/productos/${product.slug}`,
    image: image ? { url: absoluteUrl(image), alt: seo.displayName } : undefined,
  });
}

export default function ProductPage({ params }: Props) {
  const product = getProductBySlug(params.slug);
  if (!product) notFound();
  const outOfStock = !hasPurchasableStock(product);
  const recommendations = getRecommendedProducts(product, 4);
  const complements = getComplementaryProducts(product, allProducts, 4);

  const seo = getProductSeo(product);
  // Collection trail, through the product's indexed Ray-Ban model hub, plus
  // the product itself: drives both the visible breadcrumbs and the
  // BreadcrumbList below.
  const breadcrumbs = [
    ...getProductTrail(product, productModelHub(product)),
    { name: seo.displayName, href: `/tienda/productos/${product.slug}` },
  ];
  const productLink = productUrl(product);
  const offers = productOffers(product, productLink, outOfStock);
  const sku = product.variants.map((variant) => variant.sku.trim()).find(Boolean);
  // The spec table on the page, as name/value pairs.
  const { specs } = getProductCopy(product);
  const productSchema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Product",
        "@id": `${productLink}#product`,
        name: seo.displayName,
        description: getProductDescription(product),
        image: seo.images.map(absoluteUrl),
        brand: {
          "@type": "Brand",
          name: seo.brand,
        },
        ...(sku ? { sku } : {}),
        ...(seo.mpn ? { mpn: seo.mpn } : {}),
        ...(specs.length > 0
          ? {
              additionalProperty: specs.map((spec) => ({
                "@type": "PropertyValue",
                name: spec.name,
                value: spec.value,
              })),
            }
          : {}),
        url: productLink,
        ...(offers ? { offers } : {}),
      },
      breadcrumbSchema(breadcrumbs),
    ],
  };

  return (
    <>
      <JsonLd data={productSchema} />
      <ProductDetailClient
        product={toProductDetail(product, {
          name: seo.displayName,
          brand: seo.brand,
          images: seo.images,
        })}
        breadcrumbs={breadcrumbs}
        recommendations={toProductSummaries(recommendations)}
        complements={toProductSummaries(complements)}
        outOfStock={outOfStock}
      />
    </>
  );
}

/**
 * Offer for a single price, AggregateOffer when the offered variants differ
 * in price. In-stock variants are the ones on offer; an out-of-stock product
 * reports its listed variants as out of stock.
 */
function productOffers(product: CatalogProduct, url: string, outOfStock: boolean) {
  const offered = product.variants.filter(
    (variant) => outOfStock || (variant.available && variant.stock > 0),
  );
  const prices = offered
    .map((variant) => variant.promotionalPrice ?? variant.price)
    .filter((price): price is number => typeof price === "number" && price > 0);
  const productPrice = product.promotionalPrice ?? product.price;
  if (prices.length === 0 && !(typeof productPrice === "number" && productPrice > 0)) {
    return null;
  }

  const common = {
    url,
    priceCurrency: "ARS",
    itemCondition: "https://schema.org/NewCondition",
    availability: outOfStock ? "https://schema.org/OutOfStock" : "https://schema.org/InStock",
    seller: { "@id": ORGANIZATION_ID },
  };
  const lowPrice = prices.length > 0 ? Math.min(...prices) : (productPrice as number);
  const highPrice = prices.length > 0 ? Math.max(...prices) : (productPrice as number);

  if (lowPrice !== highPrice) {
    return {
      "@type": "AggregateOffer",
      ...common,
      lowPrice,
      highPrice,
      offerCount: offered.length,
    };
  }

  // Prices sync from Tiendanube hourly; each build restates them.
  const priceValidUntil = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);
  return { "@type": "Offer", ...common, price: lowPrice, priceValidUntil };
}
