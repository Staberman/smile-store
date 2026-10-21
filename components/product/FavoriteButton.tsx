"use client";

import { useFavorites, type ProductSnapshot } from "@/lib/browser-lists";

type Props = {
  item: ProductSnapshot;
  /** Extra classes for positioning / sizing the button box. */
  className?: string;
  /** Heart glyph size in px. */
  size?: number;
};

/**
 * Heart toggle. Stops click propagation so it never triggers a surrounding
 * card link. Renders the outline (not-favorited) state on the server and first
 * client render, then upgrades to filled after mount — no hydration mismatch.
 */
export default function FavoriteButton({ item, className = "", size = 18 }: Props) {
  const { isFavorite, toggle } = useFavorites();
  const active = isFavorite(item.slug);
  const label = active ? "Quitar de favoritos" : "Agregar a favoritos";

  return (
    <button
      type="button"
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        toggle(item);
      }}
      aria-label={label}
      aria-pressed={active}
      title={label}
      className={`inline-flex items-center justify-center rounded-full border backdrop-blur transition-all duration-200 hover:scale-105 active:scale-95 ${className}`}
      style={{
        borderColor: active ? "#c9a96e" : "rgba(255,255,255,0.16)",
        background: active ? "rgba(201,169,110,0.16)" : "rgba(10,10,10,0.55)",
        color: active ? "#e2c989" : "#f0ece4",
      }}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill={active ? "#c9a96e" : "none"}
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 1 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78Z" />
      </svg>
    </button>
  );
}
