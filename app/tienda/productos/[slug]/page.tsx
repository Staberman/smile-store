import type { Metadata } from "next";
import { notFound } from "next/navigation";
import JsonLd from "@/components/seo/JsonLd";
import {
  allProducts,
  allProductsIncludingOutOfStock,
  getProductBySlug,
  getRecommendedProducts,
  hasPurchasableStock,
} from "@/lib/catalog";
import { getProductCopy, getProductDescription, getProductSeo } from "@/lib/product-meta";
import { productOffers } from "@/lib/product-offers.mjs";
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

  const path = `/tienda/productos/${product.slug}`;
  const metadata = pageMetadata({
    title: seo.title,
    description: seo.description,
    path,
    image: image ? { url: absoluteUrl(image), alt: seo.displayName } : undefined,
  });
  // The Markdown copy of the page (next.config.mjs serves it).
  return {
    ...metadata,
    alternates: { ...metadata.alternates, types: { "text/markdown": `${path}.md` } },
  };
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
  const offers = productOffers(product, {
    url: productLink,
    outOfStock,
    sellerId: ORGANIZATION_ID,
  });
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
