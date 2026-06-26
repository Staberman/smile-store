"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

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
        </nav>
      </div>
    </header>
  );
}
