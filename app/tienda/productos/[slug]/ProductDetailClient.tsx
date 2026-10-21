"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import TiendanubeCheckoutForm from "@/components/checkout/TiendanubeCheckoutForm";
import TrustHighlights from "@/components/brand/TrustHighlights";
import Breadcrumbs from "@/components/layout/Breadcrumbs";
import FavoriteButton from "@/components/product/FavoriteButton";
import RecentlyViewed from "@/components/product/RecentlyViewed";
import { useRecentlyViewed } from "@/lib/browser-lists";
import type { Crumb } from "@/lib/collections";
import { formatPrice } from "@/lib/format";
import type {
  ProductDetail,
  ProductSummary,
  ProductSummaryVariant,
} from "@/lib/product-summary";
import {
  getAvailableVariants,
  getDisplayPrice,
  getInstallmentPrice,
  getTransferPrice,
  isWatch,
  stockUrgencyLabel,
} from "@/lib/storefront.mjs";
import { productUrl } from "@/lib/seo";

interface Props {
  product: ProductDetail;
  /** Home → collection → this product; mirrors the BreadcrumbList JSON-LD. */
  breadcrumbs: Crumb[];
  recommendations: ProductSummary[];
  complements: ProductSummary[];
  outOfStock?: boolean;
}

const ACCENT = "#c9a96e";
const IMAGE_FALLBACK =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='600' height='600'%3E%3Crect width='600' height='600' fill='%23181410'/%3E%3C/svg%3E";

function getVariantLabel(variant: ProductSummaryVariant, index: number): string {
  const optionLabel = variant.options.filter(Boolean).join(" / ");
  if (optionLabel) return optionLabel;
  if (variant.id !== null) return `Variante ${index + 1}`;
  return "Unica opcion";
}

export default function ProductDetailClient({
  product,
  breadcrumbs,
  recommendations,
  complements,
  outOfStock = false,
}: Props) {
  const availableVariants = getAvailableVariants(product);
  const isOutOfStock = outOfStock || availableVariants.length === 0;
  const [selectedVariantId, setSelectedVariantId] = useState<number | null>(
    availableVariants[0]?.id ?? null
  );

  const selectedVariant =
    availableVariants.find((variant) => variant.id === selectedVariantId) ??
    availableVariants[0] ??
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

  const galleryRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  // Per-slide fallback (preserves the old single mainFailed behaviour, but the
  // carousel renders every image at once so failures are tracked per index).
  const [failedIndexes, setFailedIndexes] = useState<Record<number, boolean>>({});
  const [zoomOpen, setZoomOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  // Variant switch rebuilds galleryImages -> reset the carousel to the first slide.
  useEffect(() => {
    setActiveIndex(0);
    setFailedIndexes({});
    galleryRef.current?.scrollTo({ left: 0 });
  }, [galleryImages]);

  // Keep the active slide/thumb in sync while the user swipes.
  const handleGalleryScroll = () => {
    const el = galleryRef.current;
    if (!el || el.clientWidth === 0) return;
    const index = Math.round(el.scrollLeft / el.clientWidth);
    setActiveIndex((prev) => (prev === index ? prev : index));
  };

  // Tapping a thumb scrolls the carousel to that slide.
  const goToSlide = (index: number) => {
    setActiveIndex(index);
    const el = galleryRef.current;
    if (el) el.scrollTo({ left: index * el.clientWidth, behavior: "smooth" });
  };

  // Esc closes the zoom overlay; lock body scroll while it is open.
  useEffect(() => {
    if (!zoomOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setZoomOpen(false);
    };
    window.addEventListener("keydown", onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [zoomOpen]);

  const activeImage = galleryImages[activeIndex] ?? galleryImages[0] ?? IMAGE_FALLBACK;
  const zoomFailed = failedIndexes[activeIndex] ?? false;

  const complementLabel = isWatch(product) ? "Sumá unos lentes" : "Sumá un reloj";

  const displayPrice = getDisplayPrice(product, selectedVariant);
  const transferPrice = getTransferPrice(displayPrice);
  const installmentPrice = getInstallmentPrice(displayPrice);
  const collectionLabel =
    product.categories[product.categories.length - 1] ?? product.brand;
  const subtitle = product.brand;
  // The product's collection (the crumb before the product itself).
  const backCrumb = breadcrumbs[breadcrumbs.length - 2] ?? breadcrumbs[0];
  const backLabel = backCrumb.href === "/" ? "la tienda" : backCrumb.name;
  const lowStock = stockUrgencyLabel(product);

  // Absolute, canonical product URL for sharing. productUrl() already yields an
  // absolute URL (SITE_URL + path); fall back to the live URL only if empty.
  const shareUrl =
    productUrl(product) ||
    (typeof window !== "undefined" ? window.location.href : "");
  const shareText = `${product.name} ${shareUrl}`;
  const whatsappHref = `https://wa.me/?text=${encodeURIComponent(shareText)}`;

  // Copy the link with a brief confirmation. Clipboard access can be missing or
  // rejected (insecure context, permissions), so guard and degrade gracefully.
  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard unavailable — leave the UI untouched rather than throw.
    }
  };

  // Minimal snapshot from the product in scope — never a catalog lookup.
  const snapshot = {
    slug: product.slug,
    name: product.name,
    brand: product.brand,
    image: product.images[0] ?? selectedVariant?.image ?? null,
    price: product.price,
    promotionalPrice: product.promotionalPrice,
    href: `/tienda/productos/${product.slug}`,
  };

  const { record } = useRecentlyViewed();
  // Record this product once per PDP mount / slug change.
  useEffect(() => {
    record({
      slug: product.slug,
      name: product.name,
      brand: product.brand,
      image: product.images[0] ?? null,
      price: product.price,
      promotionalPrice: product.promotionalPrice,
      href: `/tienda/productos/${product.slug}`,
    });
    // record is stable; re-run only when the viewed product changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product.slug]);

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-[#f0ece4]">
      <Breadcrumbs trail={breadcrumbs} />

      <div className="mx-auto max-w-7xl px-6 py-12 md:px-12 md:py-20">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-20">
          <div className="flex flex-col gap-4">
            <div className="relative overflow-hidden rounded-2xl bg-[#111]">
              <div
                ref={galleryRef}
                onScroll={handleGalleryScroll}
                className="smile-gallery-scroll flex snap-x snap-mandatory overflow-x-auto"
                style={{ scrollbarWidth: "none" }}
              >
                {galleryImages.map((image, index) => (
                  <button
                    key={`${image}-${index}`}
                    type="button"
                    onClick={() => setZoomOpen(true)}
                    aria-label={`Ampliar imagen ${index + 1} de ${product.name}`}
                    className="relative aspect-square w-full shrink-0 cursor-zoom-in snap-center bg-[#111]"
                  >
                    <Image
                      src={failedIndexes[index] ? IMAGE_FALLBACK : image}
                      alt={`${product.name} vista ${index + 1}`}
                      fill
                      sizes="(max-width:1024px) 100vw, 50vw"
                      // The first slide is the product page's LCP image.
                      priority={index === 0}
                      className="object-contain p-6 transition-opacity duration-300"
                      style={{ filter: "brightness(0.92) contrast(1.04)" }}
                      onError={() =>
                        setFailedIndexes((prev) =>
                          prev[index] ? prev : { ...prev, [index]: true }
                        )
                      }
                    />
                  </button>
                ))}
              </div>
              {isOutOfStock && (
                <div
                  className="pointer-events-none absolute left-4 top-4 rounded-full px-3 py-1 text-[9px] uppercase tracking-[0.2em]"
                  style={{
                    background: `${ACCENT}22`,
                    color: ACCENT,
                    border: `1px solid ${ACCENT}40`,
                  }}
                >
                  Sin stock
                </div>
              )}
              <style>{`.smile-gallery-scroll::-webkit-scrollbar{display:none}`}</style>
            </div>

            {galleryImages.length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-1">
                {galleryImages.map((image, index) => (
                  <button
                    key={`${image}-${index}`}
                    type="button"
                    onClick={() => goToSlide(index)}
                    aria-label={`Ver imagen ${index + 1}`}
                    aria-current={index === activeIndex}
                    className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl transition-all duration-200"
                    style={{
                      border: `2px solid ${index === activeIndex ? ACCENT : "transparent"}`,
                      background: "#111",
                      opacity: index === activeIndex ? 1 : 0.55,
                    }}
                  >
                    <Image
                      src={image}
                      alt={`${product.name} vista ${index + 1}`}
                      fill
                      sizes="80px"
                      className="object-contain p-1"
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

            <div className="mt-3 flex items-start justify-between gap-4">
              <h1 className="font-display break-words text-[2rem] font-light italic leading-[1.08] sm:text-[2.4rem] md:text-[3rem]">
                {product.name}
              </h1>
              <FavoriteButton
                item={snapshot}
                size={20}
                className="mt-1 h-11 w-11 shrink-0"
              />
            </div>
            <p className="mt-1 text-sm text-[#4a4540]">{subtitle}</p>

            {!isOutOfStock && lowStock && (
              <span
                className="mt-4 inline-flex items-center gap-1.5 self-start rounded-full border px-3 py-1 text-[10px] uppercase tracking-[0.18em]"
                style={{
                  color: ACCENT,
                  borderColor: `${ACCENT}55`,
                  background: `${ACCENT}14`,
                }}
              >
                <span
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ background: ACCENT }}
                  aria-hidden="true"
                />
                {lowStock}
              </span>
            )}

            <p
              className="mt-6 font-display text-[1.8rem] font-light"
              style={{ color: ACCENT }}
            >
              {formatPrice(displayPrice)}
            </p>
            <p className="mt-2 text-sm text-[#b8b0a4]">
              {formatPrice(transferPrice)} por transferencia
            </p>
            <p className="mt-1 text-xs text-[#6a6560]">
              6 cuotas sin interés de {formatPrice(installmentPrice)}
            </p>

            <div className="my-6 h-px bg-white/8" />

            {availableVariants.length > 1 && (
              <div className="mb-6">
                <p className="mb-3 text-[10px] uppercase tracking-[0.28em] text-[#4a4540]">
                  Color / variante
                </p>
                <div className="flex flex-wrap gap-2">
                  {availableVariants.map((variant, index) => {
                    const variantPrice =
                      variant.promotionalPrice ?? variant.price;
                    return (
                      <button
                        key={`${variant.id ?? "null"}-${index}`}
                        onClick={() => setSelectedVariantId(variant.id)}
                        className="rounded-full border px-4 py-2 text-[10px] tracking-[0.14em] transition-all duration-200"
                        style={{
                          borderColor:
                            selectedVariantId === variant.id
                              ? ACCENT
                              : "#2a2520",
                          color: selectedVariantId === variant.id
                              ? ACCENT
                              : "#6a6560",
                          background:
                            selectedVariantId === variant.id
                              ? `${ACCENT}14`
                              : "transparent",
                          cursor: "pointer",
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
              disabled={isOutOfStock || !selectedVariant?.available}
              className="sticky bottom-4 z-20 md:static"
            />

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <span className="text-[10px] uppercase tracking-[0.28em] text-[#4a4540]">
                Compartir
              </span>
              <a
                href={whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Compartir por WhatsApp"
                className="inline-flex min-h-11 items-center gap-2 rounded-full border px-4 text-[10px] uppercase tracking-[0.16em] transition-colors hover:text-[#c9a96e]"
                style={{ borderColor: "#2a2520", color: "#8b8580" }}
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path d="M12.04 2c-5.46 0-9.9 4.44-9.9 9.9 0 1.75.46 3.45 1.32 4.95L2 22l5.3-1.38a9.87 9.87 0 0 0 4.73 1.2h.01c5.46 0 9.9-4.44 9.9-9.9 0-2.64-1.03-5.13-2.9-7A9.82 9.82 0 0 0 12.04 2Zm0 1.8c2.16 0 4.19.84 5.72 2.37a8.05 8.05 0 0 1 2.37 5.73c0 4.46-3.63 8.09-8.1 8.09a8.09 8.09 0 0 1-4.12-1.13l-.3-.18-3.05.8.81-2.98-.19-.31a8.03 8.03 0 0 1-1.24-4.3c0-4.46 3.63-8.08 8.09-8.08Zm-2.68 4.3c-.14 0-.37.05-.56.26-.19.21-.74.72-.74 1.76 0 1.03.76 2.03.86 2.17.11.14 1.49 2.28 3.62 3.19.51.22.9.35 1.21.45.51.16.97.14 1.34.08.41-.06 1.26-.51 1.44-1.01.18-.5.18-.93.13-1.02-.05-.09-.19-.14-.4-.25-.21-.11-1.26-.62-1.45-.69-.19-.07-.34-.11-.48.11-.14.21-.55.69-.67.83-.12.14-.25.16-.46.05-.21-.11-.9-.33-1.71-1.06a6.4 6.4 0 0 1-1.18-1.47c-.12-.21-.01-.33.09-.44.1-.1.21-.25.32-.38.11-.13.14-.22.21-.37.07-.14.04-.27-.02-.38-.05-.11-.47-1.16-.65-1.58-.17-.42-.34-.36-.47-.36l-.4-.01Z" />
                </svg>
                WhatsApp
              </a>
              <button
                type="button"
                onClick={handleCopyLink}
                aria-label="Copiar enlace del producto"
                className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-full border px-4 text-[10px] uppercase tracking-[0.16em] transition-colors hover:text-[#c9a96e]"
                style={{
                  borderColor: copied ? `${ACCENT}55` : "#2a2520",
                  color: copied ? ACCENT : "#8b8580",
                  background: copied ? `${ACCENT}14` : "transparent",
                }}
              >
                {copied ? (
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                ) : (
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                  </svg>
                )}
                {copied ? "¡Copiado!" : "Copiar enlace"}
              </button>
            </div>

            {product.descriptionText && (
              <>
                <div className="my-6 h-px bg-white/8" />
                <div>
                  <p className="mb-2 text-[9px] uppercase tracking-[0.4em] text-[#4a4540]">
                    Sobre este producto
                  </p>
                  <p className="text-sm leading-[1.9] text-[#b8b0a4]">
                    {product.descriptionText}
                  </p>
                </div>
              </>
            )}

            <div className="mt-8">
              <Link
                href={backCrumb.href}
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
                Volver a {backLabel}
              </Link>
            </div>
          </div>
        </div>
      </div>
      {complements.length >= 2 && (
        <section className="border-t border-white/6 px-6 py-16 md:px-12 md:py-20">
          <div className="mx-auto max-w-7xl">
            <div className="mb-8">
              <p className="text-[9px] uppercase tracking-[0.44em] text-[#4a4540]">
                Completá el look
              </p>
              <h2 className="font-display mt-2 text-[2rem] font-light italic text-[#f0ece4]">
                {complementLabel}
              </h2>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {complements.map((complementProduct) => (
                <RecommendationCard
                  key={complementProduct.slug}
                  product={complementProduct}
                />
              ))}
            </div>
          </div>
        </section>
      )}
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
                  key={recommendedProduct.slug}
                  product={recommendedProduct}
                />
              ))}
            </div>
          </div>
        </section>
      )}
      <div className="border-t border-white/6">
        <RecentlyViewed excludeSlug={product.slug} />
      </div>

      <TrustHighlights />

      {zoomOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`Imagen ampliada de ${product.name}`}
          onClick={() => setZoomOpen(false)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm"
        >
          <button
            type="button"
            onClick={() => setZoomOpen(false)}
            aria-label="Cerrar"
            className="absolute right-5 top-5 flex h-10 w-10 items-center justify-center rounded-full border border-white/20 text-[#f0ece4] transition hover:border-[#c9a96e] hover:text-[#c9a96e]"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
          <div
            className="relative h-[82vh] w-[92vw] max-w-4xl"
            onClick={(event) => event.stopPropagation()}
          >
            <Image
              src={zoomFailed ? IMAGE_FALLBACK : activeImage}
              alt={`${product.name} ampliada`}
              fill
              sizes="92vw"
              className="object-contain"
              onError={() =>
                setFailedIndexes((prev) =>
                  prev[activeIndex] ? prev : { ...prev, [activeIndex]: true }
                )
              }
            />
          </div>
        </div>
      )}
    </main>
  );
}

function RecommendationCard({ product }: { product: ProductSummary }) {
  const [failed, setFailed] = useState(false);
  const image =
    product.image ?? product.variants.find((variant) => variant.image)?.image;
  const price = product.promotionalPrice ?? product.price;
  const collectionLabel =
    product.categories[product.categories.length - 1] ?? product.brand;

  return (
    <Link
      href={`/tienda/productos/${product.slug}`}
      className="group block overflow-hidden rounded-2xl border border-white/8 bg-white/[0.025] transition duration-300 hover:-translate-y-1 hover:border-[#c9a96e]/45"
    >
      <div className="relative h-52 bg-[#111]">
        <Image
          src={failed ? IMAGE_FALLBACK : image ?? IMAGE_FALLBACK}
          alt={product.name}
          fill
          sizes="(max-width:640px) 100vw, (max-width:1024px) 50vw, 25vw"
          className="object-contain p-4 transition-transform duration-700 group-hover:scale-105"
          style={{ filter: "brightness(0.9) contrast(1.03)" }}
          onError={() => setFailed(true)}
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
        <h3 className="mt-2 line-clamp-2 min-h-10 text-sm font-medium leading-5 text-[#f0ece4]">
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
