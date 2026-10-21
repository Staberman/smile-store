"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useFavorites } from "@/lib/browser-lists";

export default function Header() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 48);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed left-0 top-0 z-30 w-full transition-all duration-500 ${
        scrolled ? "border-b border-white/8 bg-black/88 backdrop-blur-md" : ""
      }`}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5 md:py-6">
        <a href="/" className="flex items-center" aria-label="Smile inicio">
          <Image
            src="/images/smile-logo.svg"
            alt="Smile"
            width={160}
            height={60}
            priority
            className="h-auto w-[100px] opacity-95 transition hover:opacity-100 md:w-[128px]"
          />
        </a>

        <nav className="flex items-center gap-3">
          <a
            href="/#colecciones"
            className="cursor-pointer rounded-full border border-white/25 bg-white/8 px-5 py-2.5 text-[11px] uppercase tracking-[0.24em] text-white backdrop-blur transition hover:border-white hover:bg-white hover:text-black"
          >
            Explorar
          </a>

          <a
            href="/tienda"
            className="cursor-pointer rounded-full border border-white/12 px-5 py-2.5 text-[11px] uppercase tracking-[0.24em] text-white/80 transition hover:border-white/40 hover:text-white"
          >
            Tienda
          </a>

          <FavoritesLink />
        </nav>
      </div>
    </header>
  );
}

/**
 * Client-only favorites shortcut. The count badge reads localStorage via
 * useFavorites and renders nothing until mounted, so the server HTML and the
 * first client render match (no hydration mismatch).
 */
function FavoritesLink() {
  const { count, mounted } = useFavorites();

  return (
    <a
      href="/favoritos"
      aria-label={`Favoritos${mounted && count > 0 ? ` (${count})` : ""}`}
      className="relative flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-white/12 text-white/80 transition hover:border-white/40 hover:text-white"
    >
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 1 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78Z" />
      </svg>
      {mounted && count > 0 && (
        <span className="absolute -right-1 -top-1 inline-flex min-w-[18px] items-center justify-center rounded-full bg-[#c9a96e] px-1 text-[9px] font-semibold text-[#0a0a0a]">
          {count}
        </span>
      )}
    </a>
  );
}
