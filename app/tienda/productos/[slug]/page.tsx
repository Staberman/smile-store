import type { Metadata } from "next";
import { notFound } from "next/navigation";
import JsonLd from "@/components/seo/JsonLd";
import { allProducts, formatPrice, getProductBySlug } from "@/lib/catalog";
import {
  absoluteUrl,
  productAvailability,
  productUrl,
  SITE_NAME,
  truncateMetaDescription,
} from "@/lib/seo";
import ProductDetailClient from "./ProductDetailClient";

interface Props {
  params: { slug: string };
}

export async function generateStaticParams() {
  return allProducts.map((product) => ({ slug: product.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const product = getProductBySlug(params.slug);
  if (!product) return { title: "Producto | Smile" };

  const metaTitle = product.seoTitle || product.name;
  const metaDescription =
    product.seoDescription || product.descriptionText ||
    `${product.name} - disponible en Smile Argentina. ${formatPrice(
      product.promotionalPrice ?? product.price
    )}`;
  const canonical = productUrl(product);
  const image = product.images[0];

  return {
    title: `${metaTitle} | Smile`,
    description: truncateMetaDescription(metaDescription),
    alternates: {
      canonical,
    },
    openGraph: {
      type: "website",
      locale: "es_AR",
      siteName: SITE_NAME,
      title: `${metaTitle} | Smile`,
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
      title: `${metaTitle} | Smile`,
      description: truncateMetaDescription(metaDescription),
      images: image ? [image] : undefined,
    },
  };
}

export default function ProductPage({ params }: Props) {
  const product = getProductBySlug(params.slug);
  if (!product) notFound();

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
            : "/tienda";

  const brandLabel = isRayBan
    ? "Ray-Ban"
    : normalizedBrand === "omega x swatch"
      ? "OMEGA x Swatch"
      : product.brand;
  const currentPrice = product.promotionalPrice ?? product.price;
  const productSchema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Product",
        "@id": `${productUrl(product)}#product`,
        name: product.name,
        description: product.descriptionText,
        image: product.images,
        brand: {
          "@type": "Brand",
          name: brandLabel,
        },
        sku: product.variants.find((variant) => variant.sku)?.sku || product.slug,
        url: productUrl(product),
        offers: {
          "@type": "Offer",
          url: productUrl(product),
          priceCurrency: "ARS",
          price: currentPrice ?? undefined,
          availability: productAvailability(product),
          seller: {
            "@type": "Organization",
            name: SITE_NAME,
            url: absoluteUrl("/"),
          },
        },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "Tienda",
            item: absoluteUrl("/tienda"),
          },
          {
            "@type": "ListItem",
            position: 2,
            name: brandLabel,
            item: absoluteUrl(brandHref),
          },
          {
            "@type": "ListItem",
            position: 3,
            name: product.name,
            item: productUrl(product),
          },
        ],
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
      />
    </>
  );
}
