"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import { formatPrice } from "@/lib/format";
import type { ProductSummary } from "@/lib/product-summary";
import { isWatch } from "@/lib/storefront.mjs";

interface Props {
  products: ProductSummary[];
  brand: string;
  accentColor?: string; // CSS hex, default gold
  showNav?: boolean; // show internal nav bar (default true)
  semanticHeading?: boolean;
}

const ACCENT = "#c9a96e";
const IMAGE_FALLBACK =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='600' height='600' viewBox='0 0 600 600'%3E%3Crect width='600' height='600' fill='%23110f0d'/%3E%3Ctext x='300' y='288' text-anchor='middle' fill='%23c9a96e' font-family='Arial,sans-serif' font-size='58' font-weight='700' letter-spacing='6'%3ESMILE%3C/text%3E%3Cpath d='M235 326c42 28 88 28 130 0' fill='none' stroke='%23c9a96e' stroke-width='12' stroke-linecap='round'/%3E%3C/svg%3E";
// Rendered size of the circular slide image (220px mobile, 260px desktop).
const SLIDE_IMAGE_SIZE = 260;
const BG_GRADIENTS = [
  "radial-gradient(ellipse at 62% 52%, #1a1510 0%, #0a0a0a 72%)",
  "radial-gradient(ellipse at 38% 50%, #0d1520 0%, #0a0a0a 72%)",
  "radial-gradient(ellipse at 56% 50%, #150d0d 0%, #0a0a0a 72%)",
  "radial-gradient(ellipse at 50% 50%, #0d150d 0%, #0a0a0a 72%)",
  "radial-gradient(ellipse at 44% 48%, #14100a 0%, #0a0a0a 72%)",
];

function hasAvailableVariant(product: ProductSummary) {
  return product.variants.some(
    (variant) => variant.available && variant.stock > 0,
  );
}

function getCarouselImage(product: ProductSummary): string | null {
  return product.image ?? product.variants.find((variant) => variant.image)?.image ?? null;
}

function hasCarouselImage(product: ProductSummary) {
  return Boolean(getCarouselImage(product));
}

function buildSlides(products: ProductSummary[]) {
  const preferred = products.filter(
    (product) => hasAvailableVariant(product) && hasCarouselImage(product),
  );
  const imageProducts = products.filter(hasCarouselImage);
  const source = preferred.length > 0 ? preferred : imageProducts.length > 0 ? imageProducts : products;
  const slides: ProductSummary[] = [];
  const seen = new Set<string>();

  for (const product of source) {
    if (slides.length >= 5) break;
    slides.push(product);
    seen.add(product.slug);
  }

  if (preferred.length > 0 && slides.length < 5) {
    for (const product of products) {
      if (slides.length >= 5) break;
      if (seen.has(product.slug)) continue;
      slides.push(product);
      seen.add(product.slug);
    }
  }

  if (imageProducts.length > 0 && slides.length < 5) {
    for (const product of imageProducts) {
      if (slides.length >= 5) break;
      if (seen.has(product.slug)) continue;
      slides.push(product);
      seen.add(product.slug);
    }
  }

  return slides.slice(0, 5);
}

export default function BrandCarousel({
  products,
  brand,
  showNav = true,
  semanticHeading = true,
}: Props) {
  const featured = buildSlides(products);
  const [current, setCurrent] = useState(0);
  const [exiting, setExiting] = useState<number | null>(null);
  const [animating, setAnimating] = useState(false);
  const slideCount = featured.length;
  const currentIndex = slideCount > 0 ? current % slideCount : 0;
  const slide = featured[currentIndex];

  // Auto-advance
  useEffect(() => {
    if (slideCount <= 1) return;
    const t = setInterval(() => goTo((current + 1) % slideCount), 5500);
    return () => clearInterval(t);
  }, [current, slideCount]);

  // Keyboard
  useEffect(() => {
    if (slideCount <= 1) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === "ArrowDown")
        goTo((current + 1) % slideCount);
      if (e.key === "ArrowLeft" || e.key === "ArrowUp")
        goTo((current - 1 + slideCount) % slideCount);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [current, slideCount]);

  function goTo(next: number) {
    if (animating || next === current) return;
    setAnimating(true);
    setExiting(current);
    setTimeout(() => setExiting(null), 800);
    setTimeout(() => {
      setCurrent(next);
      setAnimating(false);
    }, 80);
  }

  if (slideCount === 0) {
    return semanticHeading ? (
      <h1 className="sr-only">{brand} en Smile Argentina</h1>
    ) : null;
  }

  const bgGradient = BG_GRADIENTS[currentIndex % BG_GRADIENTS.length];
  const subtitle = slide.categories[slide.categories.length - 1] ?? slide.brand;
  const price = slide.promotionalPrice ?? slide.price;

  return (
    <section className="relative h-[720px] w-full overflow-hidden bg-[#0a0a0a] md:h-screen md:min-h-[680px]">
      {semanticHeading && (
        <h1 className="sr-only">{brand} en Smile Argentina</h1>
      )}

      {/* Grain overlay */}
      <div
        className="pointer-events-none absolute inset-0 z-[9000] opacity-[0.035]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E")`,
          backgroundSize: "180px",
        }}
      />

      {/* Animated background gradient */}
      <AnimatePresence>
        <motion.div
          key={`bg-${current}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8 }}
          className="absolute inset-0"
          style={{ background: bgGradient }}
        />
      </AnimatePresence>

      {/* Nav bar */}
      {showNav && <nav className="absolute left-0 right-0 top-0 z-50 flex items-center justify-between px-12 py-7">
        <a href="/" aria-label="Smile inicio">
          <Image
            src="/images/smile-logo.svg"
            alt="Smile"
            width={120}
            height={44}
            className="h-auto w-[88px] opacity-90 transition hover:opacity-100"
          />
        </a>
        <ul className="flex items-center gap-1 list-none">
          {[
            { label: "Colecciones", href: "/#catalogo" },
            { label: "Tienda", href: "/" },
            { label: "Marcas", href: "/" },
          ].map((link, i) => (
            <li key={link.label} className="flex items-center">
              {i > 0 && (
                <span className="mx-1 h-3 w-px bg-white/15" aria-hidden="true" />
              )}
              <a
                href={link.href}
                className="px-3 py-1.5 text-[0.6rem] uppercase tracking-[0.22em] text-white/38 transition-colors hover:text-white/90"
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>}

      {/* Slides */}
      <div className="absolute inset-0 flex items-center justify-center">
        {featured.map((prod, index) => {
          const isActive = index === currentIndex;
          const isExiting = index === exiting;
          const image = getCarouselImage(prod);

          return (
            <div
              key={prod.slug}
              className="absolute inset-0 flex items-center justify-center"
              style={{ pointerEvents: isActive ? "auto" : "none" }}
            >
              {/* Content grid */}
              <div className="grid w-full max-w-[1100px] grid-cols-1 items-center gap-5 px-6 pb-16 pt-8 md:grid-cols-2 md:gap-16 md:px-16 md:py-0">
                {/* Text side */}
                <div
                  className="order-2 mx-auto max-w-[330px] text-center transition-all duration-[900ms] md:order-1 md:mx-0 md:max-w-none md:text-left"
                  style={{
                    transform: isActive
                      ? "translateX(0)"
                      : isExiting
                      ? "translateX(-40px)"
                      : "translateX(-60px)",
                    opacity: isActive ? 1 : 0,
                    transitionTimingFunction: isExiting
                      ? "cubic-bezier(0.4,0,0.6,1)"
                      : "cubic-bezier(0.16,1,0.3,1)",
                    transitionDelay: isActive ? "150ms" : "0ms",
                  }}
                >
                  <p
                    className="mb-3 text-[0.58rem] uppercase tracking-[0.28em] md:mb-6"
                    style={{ color: ACCENT }}
                  >
                    {brand}
                  </p>

                  <h2 className="font-display break-words text-[2.15rem] font-light leading-[1.02] text-[#f0ece4] md:text-[4.5rem]">
                    {prod.name.split(" ").map((part, wordIndex, words) => (
                      <span key={`${part}-${wordIndex}`}>
                        {part}
                        {wordIndex === 0 && words.length > 1 ? (
                          <>
                            {" "}
                            <br className="hidden md:block" />
                          </>
                        ) : (
                          " "
                        )}
                      </span>
                    ))}
                  </h2>

                  <p
                    className="font-display mt-2 text-[1.05rem] italic"
                    style={{ color: "#4a4540" }}
                  >
                    {index === currentIndex
                      ? subtitle
                      : (prod.categories[prod.categories.length - 1] ?? prod.brand)}
                  </p>

                  <p
                    className="mt-4 text-[0.72rem] tracking-[0.14em] md:mt-6"
                    style={{ color: ACCENT }}
                  >
                    {formatPrice(index === currentIndex ? price : prod.promotionalPrice ?? prod.price)}
                  </p>

                  <a
                    href={`/tienda/productos/${prod.slug}`}
                    className="mt-6 inline-flex items-center gap-4 border-b pb-2 text-[0.6rem] uppercase tracking-[0.26em] text-[#f0ece4] transition-all hover:gap-6 md:mt-10"
                    style={{
                      borderColor: "#4a4540",
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLAnchorElement).style.borderColor = ACCENT;
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLAnchorElement).style.borderColor = "#4a4540";
                    }}
                    >
                    Ver detalle{" "}
                    <span style={{ color: ACCENT }}>→</span>
                  </a>
                </div>

                {/* Visual side */}
                <div className="order-1 flex items-center justify-center md:order-2">
                  <div
                    className="relative h-[280px] w-[280px] transition-all duration-[900ms] md:h-[340px] md:w-[340px]"
                    style={{
                      transform: isActive
                        ? "translateX(0) translateY(0)"
                        : isExiting
                        ? "translateY(-110px)"
                        : "translateX(120px)",
                      opacity: isActive ? 1 : 0,
                      transitionTimingFunction: isExiting
                        ? "cubic-bezier(0.4,0,0.6,1)"
                        : "cubic-bezier(0.16,1,0.3,1)",
                      transitionDelay: isActive ? "50ms" : "0ms",
                      transitionDuration: isExiting ? "750ms" : "1000ms",
                    }}
                  >
                    {/* Rotating ring */}
                    <div
                      className="absolute"
                      style={{
                        inset: "-20px",
                        borderRadius: "50%",
                        border: `1px solid ${ACCENT}20`,
                        animation: "rotate 20s linear infinite",
                      }}
                    >
                      <div
                        className="absolute"
                        style={{
                          top: "50%",
                          left: "-4px",
                          width: "8px",
                          height: "8px",
                          background: ACCENT,
                          borderRadius: "50%",
                          transform: "translateY(-50%)",
                        }}
                      />
                    </div>

                    {/* Product image */}
                    <div
                      className="relative m-[30px] h-[220px] w-[220px] overflow-hidden rounded-full md:m-[40px] md:h-[260px] md:w-[260px]"
                      style={{
                        background: "radial-gradient(circle at 50% 45%, #f2f0eb 0%, #dfddd8 100%)",
                        boxShadow: `0 0 0 2px ${ACCENT}50, 0 0 0 8px ${ACCENT}14, 0 30px 80px rgba(0,0,0,0.85)`,
                      }}
                    >
                      {/* strap top */}
                      <div
                        className="absolute left-1/2 -translate-x-1/2 rounded-md"
                        style={{
                          top: "-46px",
                          width: "50px",
                          height: "50px",
                          background: `linear-gradient(to bottom, ${ACCENT}cc, ${ACCENT}88)`,
                        }}
                      />
                      <CarouselImage
                        src={image}
                        alt={prod.name}
                        watch={isWatch(prod)}
                        priority={index === 0}
                      />
                      {/* strap bottom */}
                      <div
                        className="absolute left-1/2 -translate-x-1/2 rounded-md"
                        style={{
                          bottom: "-46px",
                          width: "50px",
                          height: "50px",
                          background: `linear-gradient(to bottom, ${ACCENT}88, ${ACCENT}44)`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Dots */}
      <div className="absolute bottom-5 left-1/2 z-50 flex -translate-x-1/2 items-center gap-4 md:bottom-12">
        {featured.map((_, i) => (
          <button
            key={i}
            onClick={() => goTo(i)}
            className="rounded-full transition-all duration-300"
            style={{
              width: i === current ? "16px" : "4px",
              height: "4px",
              background: i === current ? ACCENT : "#4a4540",
            }}
            aria-label={`Slide ${i + 1}`}
          />
        ))}
      </div>

      {/* Arrows */}
      <div className="absolute right-12 top-1/2 z-50 hidden -translate-y-1/2 flex-col gap-6 md:flex">
        {[
          {
            dir: "up",
            onClick: () => goTo((current - 1 + slideCount) % slideCount),
            path: "M18 15 L12 9 L6 15",
          },
          {
            dir: "down",
            onClick: () => goTo((current + 1) % slideCount),
            path: "M6 9 L12 15 L18 9",
          },
        ].map(({ dir, onClick, path }) => (
          <button
            key={dir}
            onClick={onClick}
            className="group flex h-8 w-8 items-center justify-center transition-all duration-300"
            style={{ background: "transparent" }}
            aria-label={dir === "up" ? "Anterior" : "Siguiente"}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              strokeWidth="1.2"
              className="transition-all duration-300"
              style={{ stroke: "#4a4540" }}
              onMouseEnter={(e) => {
                (e.currentTarget as SVGElement).style.stroke = ACCENT;
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as SVGElement).style.stroke = "#4a4540";
              }}
            >
              <path d={path} />
            </svg>
          </button>
        ))}
      </div>

      {/* Slide counter */}
      <div
        className="absolute bottom-5 left-6 z-50 text-[0.6rem] tracking-[0.2em] md:bottom-12 md:left-12"
        style={{ color: "#4a4540" }}
      >
        <span style={{ color: ACCENT, fontWeight: 400 }}>
          {String(currentIndex + 1).padStart(2, "0")}
        </span>{" "}
        / {String(slideCount).padStart(2, "0")}
      </div>

      {/* CSS rotate keyframe */}
      <style>{`@keyframes rotate { to { transform: rotate(360deg); } }`}</style>
    </section>
  );
}

/**
 * Slide image at its rendered size: next/image emits 1x/2x candidates instead
 * of the 1024px source. Only the first slide is a priority (preloaded) image;
 * the rest load lazily.
 */
function CarouselImage({
  src,
  alt,
  watch,
  priority,
}: {
  src: string | null;
  alt: string;
  watch: boolean;
  priority: boolean;
}) {
  const [failed, setFailed] = useState(false);

  return (
    <Image
      src={failed || !src ? IMAGE_FALLBACK : src}
      alt={alt}
      width={SLIDE_IMAGE_SIZE}
      height={SLIDE_IMAGE_SIZE}
      priority={priority}
      style={{
        display: "block",
        width: "100%",
        height: "100%",
        borderRadius: "50%",
        objectFit: watch ? "contain" : "cover",
        objectPosition: "center",
        filter: "brightness(0.94) contrast(1.05)",
        transform: watch ? "scale(0.86)" : "scale(1.08)",
        transformOrigin: "center",
      }}
      onError={() => setFailed(true)}
    />
  );
}
