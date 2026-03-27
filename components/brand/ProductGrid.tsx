"use client";

import { useState } from "react";
import type { Product } from "@/lib/products";
import { formatPrice } from "@/lib/products";

interface Props {
  products: Product[];
  brandLabel: string;
}

const ACCENT = "#c9a96e";

export default function ProductGrid({ products, brandLabel }: Props) {
  const collections = ["Todos", ...Array.from(new Set(products.map((p) => p.collection)))];
  const [active, setActive] = useState("Todos");

  const filtered =
    active === "Todos" ? products : products.filter((p) => p.collection === active);

  return (
    <section className="bg-[#0a0a0a] px-6 py-20 text-[#f0ece4] md:px-12 md:py-28">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-12 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-[0.42em] text-[#4a4540]">
              Catálogo completo
            </p>
            <h2 className="font-display mt-3 text-[2.2rem] font-light italic leading-[1.0]">
              {brandLabel}
            </h2>
          </div>

          {/* Filter pills */}
          <div className="flex flex-wrap gap-2">
            {collections.map((col) => (
              <button
                key={col}
                onClick={() => setActive(col)}
                className="rounded-full border px-4 py-1.5 text-[10px] uppercase tracking-[0.22em] transition-all duration-200"
                style={{
                  borderColor: active === col ? ACCENT : "#2a2520",
                  color: active === col ? ACCENT : "#4a4540",
                  background: active === col ? `${ACCENT}14` : "transparent",
                  cursor: "pointer",
                }}
              >
                {col}
              </button>
            ))}
          </div>
        </div>

        {/* Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>

        {filtered.length === 0 && (
          <p className="py-20 text-center text-sm text-[#4a4540]">
            No hay productos en esta colección aún.
          </p>
        )}
      </div>
    </section>
  );
}

function ProductCard({ product }: { product: Product }) {
  const [hovered, setHovered] = useState(false);

  return (
    <a
      href={product.storeUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="group relative block overflow-hidden rounded-[1.4rem] border border-white/8 bg-white/[0.025] transition-all duration-500"
      style={{ transform: hovered ? "translateY(-4px)" : "translateY(0)", cursor: "pointer" }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Image */}
      <div className="relative h-56 overflow-hidden bg-[#121010]">
        <img
          src={product.image}
          alt={product.name}
          className="h-full w-full object-cover transition-transform duration-[1100ms]"
          style={{
            transform: hovered ? "scale(1.07)" : "scale(1)",
            filter: "brightness(0.9) contrast(1.02)",
          }}
          onError={(e) => {
            // grey fallback on image error
            (e.target as HTMLImageElement).src =
              "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300' viewBox='0 0 400 300'%3E%3Crect width='400' height='300' fill='%23181410'/%3E%3C/svg%3E";
          }}
        />

        {/* Badge */}
        {product.badge && (
          <div
            className="absolute left-3 top-3 rounded-full px-3 py-1 text-[9px] uppercase tracking-[0.2em]"
            style={{ background: `${ACCENT}22`, color: ACCENT, border: `1px solid ${ACCENT}40` }}
          >
            {product.badge}
          </div>
        )}

        {/* Hover overlay with CTA */}
        <div
          className="absolute inset-0 flex items-center justify-center transition-all duration-300"
          style={{
            background: hovered ? "rgba(0,0,0,0.45)" : "rgba(0,0,0,0)",
            opacity: hovered ? 1 : 0,
          }}
        >
          <span
            className="rounded-full px-5 py-2 text-[10px] uppercase tracking-[0.22em] text-[#0a0a0a]"
            style={{ background: "#f0ece4" }}
          >
            Ver producto
          </span>
        </div>
      </div>

      {/* Info */}
      <div className="p-5">
        <p className="text-[9px] uppercase tracking-[0.32em] text-[#4a4540]">
          {product.collection}
        </p>
        <h3 className="mt-1.5 text-sm font-medium text-[#f0ece4]">{product.name}</h3>
        <p className="mt-0.5 text-xs text-[#4a4540]">{product.subtitle}</p>
        <p
          className="mt-3 text-[0.72rem] tracking-[0.1em]"
          style={{ color: ACCENT }}
        >
          {formatPrice(product.price)}
        </p>
      </div>
    </a>
  );
}
