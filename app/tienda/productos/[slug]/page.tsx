import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { allProducts, formatPrice, getProductBySlug } from "@/lib/catalog";
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
    product.seoDescription ||
    product.descriptionText ||
    `${product.name} - disponible en Smile Argentina. ${formatPrice(
      product.promotionalPrice ?? product.price
    )}`;

  return {
    title: `${metaTitle} | Smile`,
    description: metaDescription,
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

  return (
    <ProductDetailClient
      product={product}
      brandHref={brandHref}
      brandLabel={brandLabel}
    />
  );
}
