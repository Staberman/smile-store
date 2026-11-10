"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { FREE_SHIPPING_PHRASE } from "@/lib/store-facts";
import { INTEREST_FREE_INSTALLMENTS, TRANSFER_DISCOUNT_PERCENT } from "@/lib/storefront.mjs";

const STORAGE_KEY = "smile-session-offer-seen";
// Shown once per session, only after the visitor engages with the page: never
// on first paint, so it cannot delay or become the page's LCP element.
const SCROLL_DEPTH_TRIGGER = 0.4;
const TIME_ON_PAGE_TRIGGER_MS = 25_000;
const DESKTOP_QUERY = "(min-width: 768px)";

type Variant = "banner" | "modal";

// sessionStorage can be unavailable (privacy modes); the offer then shows at
// most once per page load.
function wasSeen(): boolean {
  try {
    return window.sessionStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

function markSeen() {
  try {
    window.sessionStorage.setItem(STORAGE_KEY, "1");
  } catch {
    // Ignore: see wasSeen().
  }
}

function scrollDepth(): number {
  const scrollable = document.documentElement.scrollHeight - window.innerHeight;
  return scrollable > 0 ? window.scrollY / scrollable : 0;
}

export default function SessionOfferPopup() {
  const [variant, setVariant] = useState<Variant | null>(null);
  // Drives the enter transition; motion-reduce users get no transition.
  const [entered, setEntered] = useState(false);

  useEffect(() => {
    if (wasSeen()) return;

    let shown = false;
    const show = () => {
      if (shown) return;
      shown = true;
      stop();
      if (wasSeen()) return;
      markSeen();
      setVariant(window.matchMedia(DESKTOP_QUERY).matches ? "modal" : "banner");
    };
    const onScroll = () => {
      if (scrollDepth() >= SCROLL_DEPTH_TRIGGER) show();
    };
    const timer = window.setTimeout(show, TIME_ON_PAGE_TRIGGER_MS);
    window.addEventListener("scroll", onScroll, { passive: true });

    function stop() {
      window.clearTimeout(timer);
      window.removeEventListener("scroll", onScroll);
    }
    return stop;
  }, []);

  useEffect(() => {
    if (!variant) return;
    const frame = window.requestAnimationFrame(() => setEntered(true));
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setVariant(null);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [variant]);

  if (!variant) return null;

  const close = () => setVariant(null);
  return variant === "modal" ? (
    <OfferModal entered={entered} onClose={close} />
  ) : (
    <OfferBanner entered={entered} onClose={close} />
  );
}

/** Mobile: small bottom card, no overlay and no scroll lock. */
function OfferBanner({ entered, onClose }: { entered: boolean; onClose: () => void }) {
  const pathname = usePathname();
  // Product pages keep a sticky buy button at the bottom; sit above it, next
  // to the WhatsApp button (same offsets as WhatsAppFloatingButton).
  const bottomClass = pathname.includes("/tienda/productos/") ? "bottom-24" : "bottom-5";

  return (
    <aside
      aria-labelledby="session-offer-banner-title"
      className={`fixed left-3 right-[4.5rem] z-[90] max-h-[25vh] overflow-y-auto rounded-2xl border border-white/10 bg-[#080706]/95 p-4 text-[#f0ece4] shadow-[0_18px_60px_rgba(0,0,0,0.5)] backdrop-blur-md transition duration-300 motion-reduce:transition-none ${bottomClass} ${
        entered ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"
      }`}
    >
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-[9px] uppercase tracking-[0.3em] text-[#c9a96e]">
            Beneficio activo
          </p>
          <p id="session-offer-banner-title" className="mt-1 font-display text-lg italic leading-tight">
            Lentes originales y premium
          </p>
          <p className="mt-1 text-[11px] leading-snug text-[#b8b0a4]">
            {TRANSFER_DISCOUNT_PERCENT}% OFF por transferencia · Hasta {INTEREST_FREE_INSTALLMENTS}{" "}
            cuotas sin interés · {FREE_SHIPPING_PHRASE}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/10 text-xs text-white/60 transition hover:border-white/25 hover:text-white"
          aria-label="Cerrar promoción"
        >
          X
        </button>
      </div>
      <div className="mt-3 flex items-center justify-between gap-3">
        <Link
          href="/"
          onClick={onClose}
          className="inline-flex min-h-9 shrink-0 items-center justify-center whitespace-nowrap rounded-full bg-[#c9a96e] px-4 text-[10px] font-medium uppercase tracking-[0.2em] text-[#0a0a0a] transition hover:bg-[#e2c989]"
        >
          Ver colección
        </Link>
        <p className="text-[9px] leading-snug text-[#6a6560]">
          Beneficios sujetos a condiciones vigentes al momento de compra.
        </p>
      </div>
    </aside>
  );
}

/** Desktop: the original centered modal, shown only after engagement. */
function OfferModal({ entered, onClose }: { entered: boolean; onClose: () => void }) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    closeButtonRef.current?.focus();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  return (
    <div
      className={`fixed inset-0 z-[10000] flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm transition-opacity duration-300 motion-reduce:transition-none ${
        entered ? "opacity-100" : "opacity-0"
      }`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="session-offer-title"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-[58rem] overflow-hidden rounded-2xl border border-white/10 bg-[#080706] text-[#f0ece4] shadow-[0_30px_90px_rgba(0,0,0,0.75)]"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          ref={closeButtonRef}
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-black/40 text-sm text-white/55 transition hover:border-white/25 hover:text-white"
          aria-label="Cerrar promoción"
        >
          X
        </button>

        <div className="border-b border-white/8 bg-white/[0.03] px-6 py-3 text-[10px] uppercase tracking-[0.3em] text-[#c9a96e]">
          Smile · Tienda online
        </div>

        <div className="grid grid-cols-[1.35fr_0.65fr] gap-0">
          <div className="px-10 py-7">
            <p className="text-[10px] uppercase tracking-[0.36em] text-[#6a6560]">
              Beneficio activo
            </p>
            <h2
              id="session-offer-title"
              className="font-display mt-3 text-[2.8rem] font-light italic leading-[1.02]"
            >
              Lentes originales
              <br />
              y premium
            </h2>
            <p className="mt-4 max-w-[24rem] text-sm leading-[1.8] text-[#8b8580]">
              Encontrá el modelo ideal con beneficios claros y asesoramiento
              personalizado antes y después de tu compra.
            </p>

            <div className="mt-5 grid grid-cols-3 gap-2 text-[11px] uppercase tracking-[0.2em] text-[#c9a96e]">
              <span>Hasta {INTEREST_FREE_INSTALLMENTS} cuotas sin interés</span>
              <span>{FREE_SHIPPING_PHRASE}</span>
              <span>Asesoramiento personalizado</span>
            </div>

            <div className="mt-6 flex gap-3">
              <Link
                href="/"
                onClick={onClose}
                className="flex min-h-12 items-center justify-center rounded-full bg-[#c9a96e] px-6 text-[11px] font-medium uppercase tracking-[0.24em] text-[#0a0a0a] transition hover:bg-[#e2c989]"
              >
                Ver colección
              </Link>
              <button
                type="button"
                onClick={onClose}
                className="flex min-h-12 items-center justify-center rounded-full border border-white/10 px-6 text-[11px] uppercase tracking-[0.24em] text-[#6a6560] transition hover:border-white/25 hover:text-[#f0ece4]"
              >
                Seguir mirando
              </button>
            </div>
          </div>

          <div className="relative min-h-full border-l border-white/8 bg-[#0e0d0b]">
            <div className="absolute inset-6 rounded-full border border-[#c9a96e]/25" />
            <div className="flex h-full min-h-[21rem] flex-col items-center justify-center px-6 text-center">
              <p className="font-display text-[4.8rem] font-light leading-none text-[#c9a96e]">
                {TRANSFER_DISCOUNT_PERCENT}%
              </p>
              <p className="mt-2 text-[1.25rem] font-semibold uppercase tracking-[0.14em] text-[#f0ece4]">
                OFF
              </p>
              <p className="mt-3 text-[10px] uppercase tracking-[0.22em] text-[#8b8580]">
                por transferencia
              </p>
              <div className="mt-6 h-px w-20 bg-[#c9a96e]/35" />
              <p className="mt-6 max-w-[10rem] text-[11px] uppercase leading-[1.8] tracking-[0.2em] text-[#f0ece4]">
                {INTEREST_FREE_INSTALLMENTS} cuotas sin interés
              </p>
            </div>
          </div>
        </div>

        <p className="border-t border-white/8 px-8 py-3 text-[10px] leading-[1.6] text-[#4a4540]">
          Beneficios sujetos a condiciones vigentes al momento de compra.
        </p>
      </div>
    </div>
  );
}
