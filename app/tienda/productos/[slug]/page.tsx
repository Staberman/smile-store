import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { allProducts, getProductBySlug, formatPrice } from "@/lib/products";
import ProductDetailClient from "./ProductDetailClient";

interface Props {
  params: { slug: string };
}

export async function generateStaticParams() {
  return allProducts.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const product = getProductBySlug(params.slug);
  if (!product) return { title: "Producto | Smile" };
  return {
    title: `${product.name} ${product.subtitle} | Smile`,
    description:
      product.description ??
      `${product.name} ${product.subtitle} — disponible en Smile Argentina. ${formatPrice(product.price)}`,
  };
}

export default function ProductPage({ params }: Props) {
  const product = getProductBySlug(params.slug);
  if (!product) notFound();

  const brandHref =
    product.brand === "ray-ban"
      ? product.subcollection === "ferrari"
        ? "/tienda/marcas/ray-ban/ferrari"
        : "/tienda/marcas/ray-ban"
      : product.brand === "invicta"
      ? "/tienda/marcas/invicta"
      : "/tienda/marcas/tommy-hilfiger";

  const brandLabel =
    product.brand === "ray-ban"
      ? "Ray-Ban"
      : product.brand === "invicta"
      ? "Invicta"
      : "Tommy Hilfiger";

  return (
    <ProductDetailClient
      product={product}
      brandHref={brandHref}
      brandLabel={brandLabel}
    />
  );
}
