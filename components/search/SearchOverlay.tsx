"use client";

import {
  type KeyboardEvent,
  type RefObject,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import Image from "next/image";
import { formatPrice } from "@/lib/format";
import type { ProductSummary } from "@/lib/product-summary";
import {
  catalogSearchHref,
  clampHighlight,
  enterAction,
  moveHighlight,
  optionCountFor,
  resultCountLabel,
  searchPanel,
  seeAllResultsLabel,
} from "@/lib/search-overlay.mjs";
import { toSearchRow, type SearchRow } from "@/lib/search-row";
import { extraSearchText, useSearchIndex, useSearchProducts } from "./search-data";

const ACCENT = "#c9a96e";

/** Why the overlay closes: the provider restores focus or history accordingly. */
export type CloseReason = "dismiss" | "back" | "navigate";

const REDUCED_MOTION = "(prefers-reduced-motion: reduce)";

/**
 * Above the homepage carousel's grain layer (z-[9000], components/brand/BrandCarousel.tsx),
 * which would otherwise tint part of the sheet, and below the session offer
 * modal (z-[10000]).
 */
const OVERLAY_Z_INDEX = "z-[9500]";

/** Product photo of a row, styled like the cards' round media (components/product/ProductMedia.tsx). */
function RowThumb({ row }: { row: SearchRow }) {
  const [failed, setFailed] = useState(false);

  return (
    <span className="relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full border border-[#c9a96e]/20 bg-[#e9e6df]">
      {row.image && !failed && (
        // Decorative: the row is named by its text.
        <Image
          src={row.image}
          alt=""
          width={56}
          height={56}
          className={`h-full w-full ${row.watch ? "object-contain p-1.5 mix-blend-multiply" : "object-cover"}`}
          onError={() => setFailed(true)}
        />
      )}
    </span>
  );
}

/**
 * Full-screen site search (WAI-ARIA 1.2 combobox with a listbox popup, in a
 * modal dialog). Before two characters are typed it lists the featured
 * products; then the best matches of lib/product-search.mjs, the matcher the
 * catalog grids use, and a last row that opens the catalog filtered by the
 * query. A product row opens its page. `inputRef` lets the provider focus the
 * field inside the tap that opens it, so phones show the keyboard.
 */
export default function SearchOverlay({
  open,
  featured,
  inputRef,
  onClose,
  onNavigate,
}: {
  open: boolean;
  /** Shipped with the page, so they show the moment the overlay opens. */
  featured: SearchRow[];
  inputRef: RefObject<HTMLInputElement>;
  onClose: (reason: CloseReason) => void;
  onNavigate: (href: string) => void;
}) {
  // Requested on the first open (or earlier, by the search button) and kept.
  const products = useSearchProducts(open);
  const searchIndex = useSearchIndex(open);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  // Mounted from the render that opens it (so the provider can focus the field
  // within the tap) until its slide-up ends. CSS animations (app/globals.css)
  // keep framer-motion out of pages that do not otherwise load it.
  const [rendered, setRendered] = useState(open);
  if (open && !rendered) setRendered(true);
  const closing = rendered && !open;

  // Back closes the overlay: opening it adds a history entry, which a dismiss
  // removes again and a navigation replaces.
  useEffect(() => {
    if (!open) return;
    if (window.history.state?.siteSearch !== true) {
      window.history.pushState({ siteSearch: true }, "");
    }
    const onPopState = () => onCloseRef.current("back");
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, [open]);

  // The page behind does not scroll while the overlay covers it.
  useEffect(() => {
    if (!open) return;
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = overflow;
    };
  }, [open]);

  // Without motion there is no animation end to wait for.
  useEffect(() => {
    if (closing && window.matchMedia(REDUCED_MOTION).matches) setRendered(false);
  }, [closing]);

  if (!rendered) return null;

  return (
    <div
      // Inert while sliding away, so a second tap reaches the page instead.
      aria-hidden={closing || undefined}
      onAnimationEnd={(event) => {
        if (closing && event.target === event.currentTarget) setRendered(false);
      }}
      className={`fixed inset-0 ${OVERLAY_Z_INDEX} flex flex-col bg-[#0a0a0a] text-[#f0ece4] shadow-[0_24px_80px_rgba(0,0,0,0.6)] ${
        closing ? "pointer-events-none animate-searchSheetOut" : "animate-searchSheetIn"
      }`}
    >
      <SearchDialog
        featured={featured}
        products={products}
        searchIndex={searchIndex}
        inputRef={inputRef}
        onClose={onClose}
        onNavigate={onNavigate}
      />
    </div>
  );
}

/** The dialog's content; mounted while open, so every opening starts empty. */
function SearchDialog({
  featured,
  products,
  searchIndex,
  inputRef,
  onClose,
  onNavigate,
}: {
  featured: SearchRow[];
  products: ProductSummary[] | null;
  searchIndex: Record<string, string> | null;
  inputRef: RefObject<HTMLInputElement>;
  onClose: (reason: CloseReason) => void;
  onNavigate: (href: string) => void;
}) {
  const listId = useId();
  const headingId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(-1);

  const panel = useMemo(
    () =>
      searchPanel(query, {
        featured,
        products,
        extraText: (product: ProductSummary) => extraSearchText(product, searchIndex),
      }),
    [query, featured, products, searchIndex],
  );
  const rows = useMemo(
    () => (panel.kind === "results" ? panel.items.map(toSearchRow) : panel.items),
    [panel],
  );
  const optionCount = optionCountFor(panel);
  const highlighted = clampHighlight(active, optionCount);
  const optionId = (index: number) => `${listId}-${index}`;
  const trimmed = query.trim();

  // Focus fallback for openings the provider could not focus synchronously.
  useEffect(() => {
    if (document.activeElement !== inputRef.current) inputRef.current?.focus({ preventScroll: true });
  }, [inputRef]);

  // Arrow keys can move the highlight past the visible part of the list.
  useEffect(() => {
    if (highlighted < 0) return;
    const option = listRef.current?.querySelector<HTMLElement>(`[id="${optionId(highlighted)}"]`);
    option?.scrollIntoView({ block: "nearest" });
    // optionId only depends on listId, which never changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [highlighted]);

  const showResults = () => onNavigate(catalogSearchHref(query));

  const handleInputKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    // Keys that belong to an IME composition; Safari sends the confirming Enter with isComposing false.
    if (event.nativeEvent.isComposing || event.keyCode === 229) return;
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      if (optionCount === 0) return;
      event.preventDefault();
      setActive(moveHighlight(highlighted, event.key === "ArrowDown" ? 1 : -1, optionCount));
    } else if (event.key === "Enter") {
      const next = enterAction(query, highlighted, panel);
      if (next.action === "none") return;
      event.preventDefault();
      if (next.action === "product") onNavigate(rows[next.index].href);
      else showResults();
    }
  };

  // Escape closes from anywhere in the dialog; Tab cycles inside it.
  const handleDialogKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Escape") {
      event.preventDefault();
      onClose("dismiss");
      return;
    }
    if (event.key !== "Tab") return;
    const focusable = Array.from(
      dialogRef.current?.querySelectorAll<HTMLElement>("input, button, a[href]") ?? [],
    );
    if (focusable.length === 0) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  const status =
    panel.kind === "loading"
      ? "Buscando…"
      : panel.kind === "empty"
        ? `No encontramos productos para “${trimmed}”.`
        : panel.kind === "results"
          ? resultCountLabel(panel.resultCount)
          : "";

  return (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-label="Buscar productos"
      onKeyDown={handleDialogKeyDown}
      className="flex min-h-0 flex-1 flex-col"
    >
      <div className="border-b border-white/8 pt-[env(safe-area-inset-top)]">
        <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-4 md:px-6 md:py-6">
          <div className="relative min-w-0 flex-1">
            <svg
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#8b8580]"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              aria-hidden="true"
            >
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.5-3.5" />
            </svg>
            <input
              ref={inputRef}
              type="search"
              role="combobox"
              aria-expanded={rows.length > 0}
              aria-controls={listId}
              aria-autocomplete="list"
              aria-activedescendant={highlighted >= 0 ? optionId(highlighted) : undefined}
              aria-label="Buscar productos"
              autoComplete="off"
              enterKeyHint="search"
              placeholder="Buscar producto o marca"
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setActive(-1);
                if (listRef.current) listRef.current.scrollTop = 0;
              }}
              onKeyDown={handleInputKeyDown}
              // The close button sits next to the field: no second, browser-drawn "×" inside it.
              className="h-12 w-full rounded-full border border-[#2a2520] bg-[#0d0c0b] pl-12 pr-4 text-base [&::-webkit-search-cancel-button]:appearance-none text-[#f0ece4] outline-none transition placeholder:text-[#6a6560] focus:border-[#c9a96e] md:h-14 md:text-lg"
            />
          </div>
          <button
            type="button"
            onClick={() => onClose("dismiss")}
            aria-label="Cerrar búsqueda"
            className="inline-flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-full border border-[#2a2520] text-[#b8b0a4] transition hover:border-[#c9a96e] hover:text-[#c9a96e]"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto max-w-3xl px-4 pb-[calc(2.5rem+env(safe-area-inset-bottom))] pt-6 md:px-6">
          {rows.length > 0 && (
            <p id={headingId} className="mb-3 px-3 text-[10px] uppercase tracking-[0.42em] text-[#8b8580]">
              {panel.kind === "results" ? "Resultados" : "Destacados"}
            </p>
          )}

          {/* preventDefault on mousedown keeps the focus in the field. */}
          <ul
            ref={listRef}
            id={listId}
            role="listbox"
            aria-labelledby={headingId}
            hidden={rows.length === 0}
            onMouseDown={(event) => event.preventDefault()}
            onMouseLeave={() => setActive(-1)}
          >
            {rows.map((row, index) => (
              <li
                key={row.slug}
                id={optionId(index)}
                role="option"
                aria-selected={highlighted === index}
                onClick={() => onNavigate(row.href)}
                onMouseMove={() => setActive(index)}
                className={`flex min-h-[4.5rem] cursor-pointer items-center gap-4 rounded-2xl px-3 py-2 transition-colors ${
                  highlighted === index ? "bg-[#c9a96e]/10" : ""
                }`}
              >
                <RowThumb row={row} />
                <span className="min-w-0 flex-1">
                  <span className="line-clamp-2 text-sm font-medium leading-snug text-[#f0ece4]">
                    {row.name}
                  </span>
                  <span className="mt-1 block truncate text-[10px] uppercase tracking-[0.2em] text-[#8b8580]">
                    {row.brand} · {row.kind}
                  </span>
                </span>
                <span className="shrink-0 whitespace-nowrap text-[13px]" style={{ color: ACCENT }}>
                  {formatPrice(row.price)}
                </span>
              </li>
            ))}
            {panel.kind === "results" && (
              <li
                id={optionId(rows.length)}
                role="option"
                aria-selected={highlighted === rows.length}
                onClick={showResults}
                onMouseMove={() => setActive(rows.length)}
                className={`relative mt-4 flex min-h-12 cursor-pointer items-center justify-between gap-3 rounded-2xl px-3 text-[11px] before:absolute before:inset-x-3 before:-top-2 before:border-t before:border-[#2a2520] uppercase tracking-[0.2em] text-[#c9a96e] transition-colors ${
                  highlighted === rows.length ? "bg-[#c9a96e]/10" : ""
                }`}
              >
                {seeAllResultsLabel(panel.resultCount)}
                <span aria-hidden="true">→</span>
              </li>
            )}
          </ul>

          {(panel.kind === "empty" || panel.kind === "loading") && (
            <p aria-hidden="true" className="px-3 py-6 text-sm text-[#8b8580]">
              {status}
            </p>
          )}
          {/* Always rendered, so screen readers announce each change. */}
          <p role="status" className="sr-only">
            {status}
          </p>
        </div>
      </div>
    </div>
  );
}
