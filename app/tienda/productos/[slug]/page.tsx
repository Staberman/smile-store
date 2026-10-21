import type { Metadata } from "next";
import { notFound } from "next/navigation";
import JsonLd from "@/components/seo/JsonLd";
import {
  allProducts,
  allProductsIncludingOutOfStock,
  formatPrice,
  getProductBySlug,
  getRecommendedProducts,
  hasPurchasableStock,
} from "@/lib/catalog";
import { getComplementaryProducts } from "@/lib/storefront.mjs";
import {
  absoluteUrl,
  productUrl,
  SITE_NAME,
  truncateMetaDescription,
} from "@/lib/seo";
import ProductDetailClient from "./ProductDetailClient";

interface Props {
  params: { slug: string };
}

export async function generateStaticParams() {
  // Include out-of-stock slugs so their pages are statically rendered and 200.
  return allProductsIncludingOutOfStock.map((product) => ({ slug: product.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const product = getProductBySlug(params.slug);
  if (!product) return { title: "Producto" };

  const metaTitle = product.seoTitle || product.name;
  const metaDescription =
    product.seoDescription || product.descriptionText ||
    `${product.name} - disponible en Smile Argentina. ${formatPrice(
      product.promotionalPrice ?? product.price
    )}`;
  const canonical = productUrl(product);
  const image = product.images[0] ? absoluteUrl(product.images[0]) : undefined;

  return {
    title: metaTitle,
    description: truncateMetaDescription(metaDescription),
    alternates: {
      canonical,
    },
    openGraph: {
      type: "website",
      locale: "es_AR",
      siteName: SITE_NAME,
      title: metaTitle,
      description: truncateMetaDescription(metaDescription),
      url: canonical,
      images: image
        ? [
            {
              url: image,
              alt: product.name,
            },
          ]
        : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: metaTitle,
      description: truncateMetaDescription(metaDescription),
      images: image ? [image] : undefined,
    },
  };
}

export default function ProductPage({ params }: Props) {
  const product = getProductBySlug(params.slug);
  if (!product) notFound();
  const outOfStock = !hasPurchasableStock(product);
  const recommendations = getRecommendedProducts(product, 4);
  const complements = getComplementaryProducts(product, allProducts, 4);

  const normalizedBrand = product.brand.trim().toLowerCase();
  const categoryText = product.categories.join(" ").toLowerCase();
  const isRayBan =
    normalizedBrand === "ray ban" ||
    normalizedBrand === "ray-ban" ||
    normalizedBrand === "rayban";
  const isFerrari =
    categoryText.includes("ferrari") || product.name.toLowerCase().includes("ferrari");
  const premiumBrandSlugs: Record<string, string> = {
    balenciaga: "balenciaga",
    cartier: "cartier",
    "celine paris": "celine",
    "christian dior": "christian-dior",
    "dolce&gabbana": "dolce-gabbana",
    fendi: "fendi",
    gucci: "gucci",
    "louis vuitton": "louis-vuitton",
    prada: "prada",
    "saint laurent": "saint-laurent",
    versace: "versace",
  };

  const brandHref = isRayBan
    ? isFerrari
      ? "/tienda/marcas/ray-ban/ferrari"
      : "/tienda/marcas/ray-ban"
    : normalizedBrand === "invicta"
      ? "/tienda/marcas/invicta"
      : normalizedBrand === "tommy hilfiger"
        ? "/tienda/marcas/tommy-hilfiger"
        : normalizedBrand === "omega x swatch"
          ? "/tienda/relojes/omega-swatch"
          : premiumBrandSlugs[normalizedBrand]
            ? `/tienda/marcas/premium/${premiumBrandSlugs[normalizedBrand]}`
            : "/";

  const brandLabel = isRayBan
    ? "Ray-Ban"
    : normalizedBrand === "omega x swatch"
      ? "OMEGA x Swatch"
      : product.brand;
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
        name: product.name,
        description: product.descriptionText,
        image: product.images.map(absoluteUrl),
        brand: {
          "@type": "Brand",
          name: brandLabel,
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
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { name: "Inicio", item: absoluteUrl("/") },
          // Brands without their own collection page fall back to "/";
          // skip that level so the breadcrumb does not repeat the homepage.
          ...(brandHref === "/"
            ? []
            : [{ name: brandLabel, item: absoluteUrl(brandHref) }]),
          { name: product.name, item: productUrl(product) },
        ].map((crumb, index) => ({
          "@type": "ListItem",
          position: index + 1,
          ...crumb,
        })),
      },
    ],
  };

  return (
    <>
      <JsonLd data={productSchema} />
      <ProductDetailClient
        product={product}
        brandHref={brandHref}
        brandLabel={brandLabel}
        recommendations={recommendations}
        complements={complements}
        outOfStock={outOfStock}
      />
    </>
  );
}
