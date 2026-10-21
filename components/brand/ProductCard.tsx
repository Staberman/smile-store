"use client";

import { useState } from "react";
import Link from "next/link";
import FavoriteButton from "@/components/product/FavoriteButton";
import ProductMedia from "@/components/product/ProductMedia";
import { formatPrice } from "@/lib/format";
import type { ProductSummary } from "@/lib/product-summary";
import {
  getAvailableVariants,
  getDisplayPrice,
  getInstallmentPrice,
  getTransferPrice,
  stockUrgencyLabel,
} from "@/lib/storefront.mjs";

const ACCENT = "#c9a96e";

function getVariantLabel(product: ProductSummary, variantId: number | null): string {
  const variant = product.variants.find((item) => item.id === variantId);
  if (!variant) return "Única opción";
  const optionLabel = variant.options.filter(Boolean).join(" / ");
  return optionLabel || `Variante ${variant.id ?? ""}`.trim();
}

function getVariantValue(variantId: number | null): string {
  return variantId === null ? "null" : String(variantId);
}

/**
 * Storefront product card: image, name, variant picker, price and links to the
 * product page. `outOfStock` cards show the "Sin stock" badge instead of the
 * payment breakdown.
 */
export default function ProductCard({
  product,
  collectionLabel,
  outOfStock = false,
}: {
  product: ProductSummary;
  collectionLabel: string;
  outOfStock?: boolean;
}) {
  const availableVariants = getAvailableVariants(product);
  const [hovered, setHovered] = useState(false);
  const [selectedVariantId, setSelectedVariantId] = useState<number | null>(
    availableVariants[0]?.id ?? product.variants[0]?.id ?? null
  );

  const selectedVariant =
    product.variants.find((variant) => variant.id === selectedVariantId) ??
    availableVariants[0] ??
    product.variants[0] ??
    null;

  const image = selectedVariant?.image ?? product.image;
  const price = getDisplayPrice(product, selectedVariant);
  const transferPrice = getTransferPrice(price);
  const installmentPrice = getInstallmentPrice(price);
  const lowStock = stockUrgencyLabel(product);

  // Minimal snapshot taken from the product already in scope — no catalog lookup.
  const snapshot = {
    slug: product.slug,
    name: product.name,
    brand: product.brand,
    image: image ?? null,
    price: product.price,
    promotionalPrice: product.promotionalPrice,
    href: `/tienda/productos/${product.slug}`,
  };

  return (
    <div
      className="group relative overflow-hidden rounded-[1.4rem] border border-white/8 bg-white/[0.025] transition-all duration-500"
      style={{ transform: hovered ? "translateY(-4px)" : "translateY(0)" }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <FavoriteButton
        item={snapshot}
        size={17}
        className="absolute right-3 top-3 z-10 h-9 w-9"
      />

      <Link href={`/tienda/productos/${product.slug}`} className="block">
        <div className="relative flex h-60 items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_center,rgba(201,169,110,0.12),rgba(18,16,16,0)_62%)] sm:h-56">
          <ProductMedia product={product} src={image} hovered={hovered} />

          {outOfStock && (
            <span
              className="pointer-events-none absolute left-3 top-3 rounded-full px-3 py-1 text-[9px] uppercase tracking-[0.2em]"
              style={{
                background: `${ACCENT}22`,
                color: ACCENT,
                border: `1px solid ${ACCENT}40`,
              }}
            >
              Sin stock
            </span>
          )}

          <div
            className="absolute inset-0 flex items-center justify-center transition-all duration-300"
            style={{ background: hovered ? "rgba(0,0,0,0.35)" : "rgba(0,0,0,0)", opacity: hovered ? 1 : 0 }}
          >
            <span className="rounded-full bg-[#f0ece4] px-4 py-1.5 text-[10px] uppercase tracking-[0.2em] text-[#0a0a0a]">
              Ver detalle
            </span>
          </div>
        </div>
      </Link>

      <div className="p-5">
        <p className="text-[9px] uppercase tracking-[0.32em] text-[#8b8580]">{collectionLabel}</p>
        <h3 className="mt-1.5 line-clamp-2 min-h-[2.5rem] text-sm font-medium leading-tight text-[#f0ece4]">
          {product.name}
        </h3>
        <p className="mt-0.5 text-xs text-[#4a4540]">{product.brand}</p>

        {availableVariants.length > 1 && (
          <select
            value={getVariantValue(selectedVariantId)}
            onChange={(event) =>
              setSelectedVariantId(event.target.value === "null" ? null : Number(event.target.value))
            }
            className="mt-3 w-full rounded-lg border border-white/8 bg-transparent px-3 py-1.5 text-base md:text-[10px] text-[#6a6560] outline-none"
          >
            {availableVariants.map((variant, index) => (
              <option
                key={`${variant.id ?? "null"}-${index}`}
                value={getVariantValue(variant.id)}
                className="bg-[#0a0a0a]"
              >
                {getVariantLabel(product, variant.id)}
              </option>
            ))}
          </select>
        )}

        <div className="mt-4 flex items-end justify-between gap-3">
          <div>
            {lowStock && (
              <span
                className="mb-1.5 inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[9px] uppercase tracking-[0.16em]"
                style={{
                  color: ACCENT,
                  borderColor: `${ACCENT}55`,
                  background: `${ACCENT}14`,
                }}
              >
                <span
                  className="h-1 w-1 rounded-full"
                  style={{ background: ACCENT }}
                  aria-hidden="true"
                />
                {lowStock}
              </span>
            )}
            <p className="text-[13px]" style={{ color: ACCENT }}>
              {formatPrice(price)}
            </p>
            {!outOfStock && (
              <>
                <p className="mt-1 text-xs text-[#b8b0a4]">
                  {formatPrice(transferPrice)} por transferencia
                </p>
                <p className="mt-0.5 text-[11px] text-[#b8b0a4]">
                  6 cuotas de {formatPrice(installmentPrice)}
                </p>
              </>
            )}
          </div>

          <Link
            href={`/tienda/productos/${product.slug}`}
            className="inline-flex min-h-10 items-center justify-center rounded-full border px-4 text-[10px] uppercase tracking-[0.18em] transition hover:border-[#c9a96e] hover:text-[#c9a96e]"
            style={{ borderColor: "#2a2520", color: "#6a6560" }}
          >
            Ver detalle
          </Link>
        </div>
      </div>
    </div>
  );
}
