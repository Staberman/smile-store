"use client";

import { useSiteSearch } from "./SiteSearchProvider";

/**
 * Header button that opens the site search overlay. Pointing at it, focusing
 * it or touching it starts loading the search data, so results are ready
 * sooner after the first letters.
 */
export default function SearchButton({ className = "" }: { className?: string }) {
  const search = useSiteSearch();

  return (
    <button
      type="button"
      aria-label="Buscar"
      aria-haspopup="dialog"
      aria-expanded={search?.isOpen ?? false}
      onClick={(event) => search?.open(event.currentTarget)}
      onPointerEnter={search?.warm}
      onFocus={search?.warm}
      onTouchStart={search?.warm}
      className={`flex cursor-pointer items-center justify-center rounded-full border transition ${className}`}
    >
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        aria-hidden="true"
      >
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-3.5-3.5" />
      </svg>
    </button>
  );
}
