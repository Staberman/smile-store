"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import TiendanubeCheckoutForm from "@/components/checkout/TiendanubeCheckoutForm";
import TrustHighlights from "@/components/brand/TrustHighlights";
import type { CatalogProduct, CatalogVariant } from "@/lib/catalog";
import { formatPrice } from "@/lib/catalog";

interface Props {
  product: CatalogProduct;
  brandHref: string;
  brandLabel: string;
  recommendations: CatalogProduct[];
}

const ACCENT = "#c9a96e";
const IMAGE_FALLBACK =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='600' height='600'%3E%3Crect width='600' height='600' fill='%23181410'/%3E%3C/svg%3E";

function getVariantLabel(variant: CatalogVariant, index: number): string {
  const optionLabel = variant.options.filter(Boolean).join(" / ");
  if (optionLabel) return optionLabel;
  if (variant.id !== null) return `Variante ${index + 1}`;
  return "Unica opcion";
}

export default function ProductDetailClient({
  product,
  brandHref,
  brandLabel,
  recommendations,
}: Props) {
  const [selectedVariantId, setSelectedVariantId] = useState<number | null>(
    product.variants.find((variant) => variant.available)?.id ??
      product.variants[0]?.id ??
      null
  );

  const selectedVariant =
    product.variants.find((variant) => variant.id === selectedVariantId) ??
    product.variants[0] ??
    null;

  const galleryImages = useMemo(
    () =>
      Array.from(
        new Set(
          [selectedVariant?.image, ...product.images].filter(
            (image): image is string => Boolean(image)
          )
        )
      ),
    [product.images, selectedVariant?.image]
  );

  const [activeImage, setActiveImage] = useState(
    galleryImages[0] ?? IMAGE_FALLBACK
  );

  useEffect(() => {
    setActiveImage(galleryImages[0] ?? IMAGE_FALLBACK);
  }, [galleryImages]);

  const displayPrice =
    selectedVariant?.promotionalPrice ??
    selectedVariant?.price ??
    product.promotionalPrice ??
    product.price;
  const collectionLabel =
    product.categories[product.categories.length - 1] ?? product.brand;
  const subtitle = product.brand;

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-[#f0ece4]">
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

      <div className="mx-auto max-w-7xl px-6 py-12 md:px-12 md:py-20">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-20">
          <div className="flex flex-col gap-4">
            <div
              className="relative overflow-hidden rounded-2xl bg-[#111]"
              style={{ aspectRatio: "1/1" }}
            >
              <img
                src={activeImage}
                alt={product.name}
                className="h-full w-full object-contain p-6 transition-opacity duration-300"
                style={{ filter: "brightness(0.92) contrast(1.04)" }}
                onError={(event) => {
                  (event.target as HTMLImageElement).src = IMAGE_FALLBACK;
                }}
              />
              {!product.stock && (
                <div
                  className="absolute left-4 top-4 rounded-full px-3 py-1 text-[9px] uppercase tracking-[0.2em]"
                  style={{
                    background: `${ACCENT}22`,
                    color: ACCENT,
                    border: `1px solid ${ACCENT}40`,
                  }}
                >
                  Sin stock
                </div>
              )}
            </div>

            {galleryImages.length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-1">
                {galleryImages.map((image, index) => (
                  <button
                    key={`${image}-${index}`}
                    onClick={() => setActiveImage(image)}
                    className="h-20 w-20 shrink-0 overflow-hidden rounded-xl transition-all duration-200"
                    style={{
                      border: `2px solid ${image === activeImage ? ACCENT : "transparent"}`,
                      background: "#111",
                      opacity: image === activeImage ? 1 : 0.55,
                    }}
                  >
                    <img
                      src={image}
                      alt={`${product.name} vista ${index + 1}`}
                      className="h-full w-full object-contain p-1"
                      onError={(event) => {
                        (event.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-col">
            <p className="text-[9px] uppercase tracking-[0.44em] text-[#4a4540]">
              {collectionLabel}
            </p>

            <h1 className="font-display mt-3 text-[2.4rem] font-light italic leading-[1.05] md:text-[3rem]">
              {product.name}
            </h1>
            <p className="mt-1 text-sm text-[#4a4540]">{subtitle}</p>

            <p
              className="mt-6 font-display text-[1.8rem] font-light"
              style={{ color: ACCENT }}
            >
              {formatPrice(displayPrice)}
            </p>

            <div className="my-6 h-px bg-white/8" />

            {product.variants.length > 1 && (
              <div className="mb-6">
                <p className="mb-3 text-[10px] uppercase tracking-[0.28em] text-[#4a4540]">
                  Color / variante
                </p>
                <div className="flex flex-wrap gap-2">
                  {product.variants.map((variant, index) => {
                    const variantPrice =
                      variant.promotionalPrice ?? variant.price;
                    return (
                      <button
                        key={`${variant.id ?? "null"}-${index}`}
                        onClick={() =>
                          !variant.available
                            ? null
                            : setSelectedVariantId(variant.id)
                        }
                        disabled={!variant.available}
                        className="rounded-full border px-4 py-2 text-[10px] tracking-[0.14em] transition-all duration-200"
                        style={{
                          borderColor:
                            selectedVariantId === variant.id
                              ? ACCENT
                              : "#2a2520",
                          color: !variant.available
                            ? "#2a2520"
                            : selectedVariantId === variant.id
                              ? ACCENT
                              : "#6a6560",
                          background:
                            selectedVariantId === variant.id
                              ? `${ACCENT}14`
                              : "transparent",
                          cursor: variant.available ? "pointer" : "not-allowed",
                          textDecoration: !variant.available
                            ? "line-through"
                            : "none",
                        }}
                      >
                        {getVariantLabel(variant, index)}
                        {variantPrice !== null &&
                          variantPrice !== undefined &&
                          variantPrice !== displayPrice && (
                            <span className="ml-1 opacity-60">
                              · {formatPrice(variantPrice)}
                            </span>
                          )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <TiendanubeCheckoutForm
              product={product}
              variant={selectedVariant}
              disabled={!selectedVariant?.available}
              className="sticky bottom-4 z-20 md:static"
            />

            {product.descriptionText && (
              <>
                <div className="my-6 h-px bg-white/8" />
                <div>
                  <p className="mb-2 text-[9px] uppercase tracking-[0.4em] text-[#4a4540]">
                    Sobre este producto
                  </p>
                  <p className="text-sm leading-[1.9] text-[#6a6560]">
                    {product.descriptionText}
                  </p>
                </div>
              </>
            )}

            <div className="mt-8">
              <Link
                href={brandHref}
                className="inline-flex cursor-pointer items-center gap-2 text-[10px] uppercase tracking-[0.24em] text-[#4a4540] transition-colors hover:text-[#f0ece4]"
              >
                <svg
                  width="10"
                  height="10"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <line x1="19" y1="12" x2="5" y2="12" />
                  <polyline points="12 19 5 12 12 5" />
                </svg>
                Volver a {brandLabel}
              </Link>
            </div>
          </div>
        </div>
      </div>
      {recommendations.length >= 3 && (
        <section className="border-t border-white/6 px-6 py-16 md:px-12 md:py-20">
          <div className="mx-auto max-w-7xl">
            <div className="mb-8 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-[9px] uppercase tracking-[0.44em] text-[#4a4540]">
                  Tambien te puede gustar
                </p>
                <h2 className="font-display mt-2 text-[2rem] font-light italic text-[#f0ece4]">
                  Piezas similares
                </h2>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {recommendations.map((recommendedProduct) => (
                <RecommendationCard
                  key={recommendedProduct.id}
                  product={recommendedProduct}
                />
              ))}
            </div>
          </div>
        </section>
      )}
      <TrustHighlights />
    </main>
  );
}

function RecommendationCard({ product }: { product: CatalogProduct }) {
  const image =
    product.images[0] ?? product.variants.find((variant) => variant.image)?.image;
  const price = product.promotionalPrice ?? product.price;
  const collectionLabel =
    product.categories[product.categories.length - 1] ?? product.brand;

  return (
    <Link
      href={`/tienda/productos/${product.slug}`}
      className="group block overflow-hidden rounded-2xl border border-white/8 bg-white/[0.025] transition duration-300 hover:-translate-y-1 hover:border-[#c9a96e]/45"
    >
      <div className="relative h-52 bg-[#111]">
        <img
          src={image ?? IMAGE_FALLBACK}
          alt={product.name}
          className="h-full w-full object-contain p-4 transition-transform duration-700 group-hover:scale-105"
          style={{ filter: "brightness(0.9) contrast(1.03)" }}
          onError={(event) => {
            (event.target as HTMLImageElement).src = IMAGE_FALLBACK;
          }}
        />
        <div
          className="absolute right-3 top-3 rounded-full border px-3 py-1 text-[9px] uppercase tracking-[0.18em]"
          style={{
            background: `${ACCENT}18`,
            borderColor: `${ACCENT}40`,
            color: ACCENT,
          }}
        >
          Disponible
        </div>
      </div>

      <div className="p-5">
        <p className="text-[9px] uppercase tracking-[0.28em] text-[#4a4540]">
          {collectionLabel}
        </p>
        <h3 className="mt-2 min-h-10 text-sm font-medium leading-5 text-[#f0ece4]">
          {product.name}
        </h3>
        <p className="mt-1 text-xs text-[#4a4540]">{product.brand}</p>
        <div className="mt-4 flex items-center justify-between gap-3">
          <p className="text-[12px]" style={{ color: ACCENT }}>
            {formatPrice(price)}
          </p>
          <span className="text-[10px] uppercase tracking-[0.18em] text-[#6a6560] transition group-hover:text-[#c9a96e]">
            Ver detalle
          </span>
        </div>
      </div>
    </Link>
  );
}
