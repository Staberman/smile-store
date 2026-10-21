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
import { getProductSeo } from "@/lib/product-meta";
import { toProductDetail, toProductSummaries } from "@/lib/product-summary";
import { getComplementaryProducts } from "@/lib/storefront.mjs";
import { getProductTrail } from "@/lib/collections";
import {
  absoluteUrl,
  breadcrumbSchema,
  pageMetadata,
  productUrl,
  SITE_NAME,
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
  // Collection trail plus the product itself: drives both the visible
  // breadcrumbs and the BreadcrumbList below.
  const breadcrumbs = [
    ...getProductTrail(product),
    { name: seo.displayName, href: `/tienda/productos/${product.slug}` },
  ];
  const currentPrice = product.promotionalPrice ?? product.price;
  const hasValidPrice = typeof currentPrice === "number" && currentPrice > 0;
  const buildDate = new Date();
  const priceValidUntil = new Date(buildDate.getTime() + 30 * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);
  const productSchema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Product",
        "@id": `${productUrl(product)}#product`,
        name: seo.displayName,
        description: product.descriptionText,
        image: product.images.map(absoluteUrl),
        brand: {
          "@type": "Brand",
          name: seo.brand,
        },
        sku: product.variants.find((variant) => variant.sku)?.sku || product.slug,
        url: productUrl(product),
        dateModified: buildDate.toISOString(),
        ...(hasValidPrice
          ? {
              offers: {
                "@type": "Offer",
                url: productUrl(product),
                priceCurrency: "ARS",
                price: currentPrice,
                priceValidUntil,
                availability: outOfStock
                  ? "https://schema.org/OutOfStock"
                  : "https://schema.org/InStock",
                seller: {
                  "@type": "Organization",
                  name: SITE_NAME,
                  url: absoluteUrl("/"),
                },
              },
            }
          : {}),
      },
      breadcrumbSchema(breadcrumbs),
    ],
  };

  return (
    <>
      <JsonLd data={productSchema} />
      <ProductDetailClient
        product={toProductDetail(product, { name: seo.displayName, brand: seo.brand })}
        breadcrumbs={breadcrumbs}
        recommendations={toProductSummaries(recommendations)}
        complements={toProductSummaries(complements)}
        outOfStock={outOfStock}
      />
    </>
  );
}
