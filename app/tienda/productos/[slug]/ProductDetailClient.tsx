"use client";

import { useState } from "react";
import Link from "next/link";
import type { Product } from "@/lib/products";
import { formatPrice } from "@/lib/products";
import { useCart } from "@/context/CartContext";

interface Props {
  product: Product;
  brandHref: string;
  brandLabel: string;
}

const ACCENT = "#c9a96e";

export default function ProductDetailClient({
  product,
  brandHref,
  brandLabel,
}: Props) {
  const { addItem } = useCart();
  const [activeImage, setActiveImage] = useState(0);
  const [selectedVariant, setSelectedVariant] = useState(
    product.variants?.find((v) => v.inStock)?.label ??
      product.variants?.[0]?.label ??
      ""
  );
  const [added, setAdded] = useState(false);

  const selectedVariantData = product.variants?.find(
    (v) => v.label === selectedVariant
  );
  const displayPrice = selectedVariantData?.price ?? product.price;

  function handleAddToCart() {
    addItem(product, selectedVariant);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  }

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-[#f0ece4]">
      {/* Breadcrumb */}
      <div className="border-b border-white/6 px-6 py-5 md:px-12">
        <div className="mx-auto flex max-w-7xl items-center gap-2 text-[9px] uppercase tracking-[0.3em] text-[#4a4540]">
          <Link href="/tienda" className="transition hover:text-[#f0ece4]">
            Tienda
          </Link>
          <span>/</span>
          <Link href={brandHref} className="transition hover:text-[#f0ece4]">
            {brandLabel}
          </Link>
          <span>/</span>
          <span className="text-[#6a6560]">{product.name}</span>
        </div>
      </div>

      {/* Product layout */}
      <div className="mx-auto max-w-7xl px-6 py-12 md:px-12 md:py-20">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-20">
          {/* Images */}
          <div className="flex flex-col gap-4">
            {/* Main image */}
            <div className="relative overflow-hidden rounded-2xl bg-[#111]" style={{ aspectRatio: "1/1" }}>
              <img
                src={product.images[activeImage]}
                alt={product.name}
                className="h-full w-full object-cover transition-opacity duration-300"
                style={{ filter: "brightness(0.92) contrast(1.04)" }}
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='600' height='600'%3E%3Crect width='600' height='600' fill='%23181410'/%3E%3C/svg%3E";
                }}
              />
              {product.badge && (
                <div
                  className="absolute left-4 top-4 rounded-full px-3 py-1 text-[9px] uppercase tracking-[0.2em]"
                  style={{
                    background: `${ACCENT}22`,
                    color: ACCENT,
                    border: `1px solid ${ACCENT}40`,
                  }}
                >
                  {product.badge}
                </div>
              )}
            </div>

            {/* Thumbnails */}
            {product.images.length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-1">
                {product.images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveImage(i)}
                    className="h-20 w-20 shrink-0 overflow-hidden rounded-xl transition-all duration-200"
                    style={{
                      border: `2px solid ${i === activeImage ? ACCENT : "transparent"}`,
                      background: "#111",
                      opacity: i === activeImage ? 1 : 0.55,
                    }}
                  >
                    <img
                      src={img}
                      alt={`${product.name} vista ${i + 1}`}
                      className="h-full w-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex flex-col">
            {/* Collection label */}
            <p className="text-[9px] uppercase tracking-[0.44em] text-[#4a4540]">
              {product.collection}
            </p>

            {/* Name */}
            <h1 className="font-display mt-3 text-[2.4rem] font-light italic leading-[1.05] md:text-[3rem]">
              {product.name}
            </h1>
            <p className="mt-1 text-sm text-[#4a4540]">{product.subtitle}</p>

            {/* Price */}
            <p
              className="mt-6 font-display text-[1.8rem] font-light"
              style={{ color: ACCENT }}
            >
              {formatPrice(displayPrice)}
            </p>

            {/* Divider */}
            <div className="my-6 h-px bg-white/8" />

            {/* Variant selector */}
            {product.variants && product.variants.length > 1 && (
              <div className="mb-6">
                <p className="mb-3 text-[10px] uppercase tracking-[0.28em] text-[#4a4540]">
                  Color / variante
                </p>
                <div className="flex flex-wrap gap-2">
                  {product.variants.map((v) => (
                    <button
                      key={v.label}
                      onClick={() => !v.inStock ? null : setSelectedVariant(v.label)}
                      disabled={!v.inStock}
                      className="rounded-full border px-4 py-2 text-[10px] tracking-[0.14em] transition-all duration-200"
                      style={{
                        borderColor:
                          selectedVariant === v.label ? ACCENT : "#2a2520",
                        color: !v.inStock
                          ? "#2a2520"
                          : selectedVariant === v.label
                          ? ACCENT
                          : "#6a6560",
                        background:
                          selectedVariant === v.label
                            ? `${ACCENT}14`
                            : "transparent",
                        cursor: v.inStock ? "pointer" : "not-allowed",
                        textDecoration: !v.inStock ? "line-through" : "none",
                      }}
                    >
                      {v.label}
                      {v.price && v.price !== product.price && (
                        <span className="ml-1 opacity-60">
                          · {formatPrice(v.price)}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Add to cart */}
            <button
              onClick={handleAddToCart}
              disabled={!selectedVariantData?.inStock && product.variants !== undefined && product.variants.length > 0}
              className="flex w-full items-center justify-center gap-2 rounded-full py-4 text-[11px] uppercase tracking-[0.26em] font-medium transition-all duration-300"
              style={{
                background: added ? ACCENT : `${ACCENT}18`,
                color: added ? "#0a0a0a" : ACCENT,
                border: `1px solid ${ACCENT}40`,
              }}
            >
              {added ? (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  Agregado al carrito
                </>
              ) : (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                  Agregar al carrito
                </>
              )}
            </button>

            {/* External store link */}
            <a
              href={product.storeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-full border py-4 text-[11px] uppercase tracking-[0.26em] transition-all duration-200 hover:border-white/30 hover:bg-white/5"
              style={{ borderColor: "#2a2520", color: "#6a6560" }}
            >
              Ver en tienda oficial
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
                <polyline points="15 3 21 3 21 9" />
                <line x1="10" y1="14" x2="21" y2="3" />
              </svg>
            </a>

            {/* Description */}
            {product.description && (
              <>
                <div className="my-6 h-px bg-white/8" />
                <div>
                  <p className="mb-2 text-[9px] uppercase tracking-[0.4em] text-[#4a4540]">
                    Sobre este producto
                  </p>
                  <p className="text-sm leading-[1.9] text-[#6a6560]">
                    {product.description}
                  </p>
                </div>
              </>
            )}

            {/* Back link */}
            <div className="mt-8">
              <Link
                href={brandHref}
                className="inline-flex cursor-pointer items-center gap-2 text-[10px] uppercase tracking-[0.24em] text-[#4a4540] transition-colors hover:text-[#f0ece4]"
              >
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="19" y1="12" x2="5" y2="12" />
                  <polyline points="12 19 5 12 12 5" />
                </svg>
                Volver a {brandLabel}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
