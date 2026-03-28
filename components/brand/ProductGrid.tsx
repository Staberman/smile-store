"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import type { Product } from "@/lib/products";
import { formatPrice } from "@/lib/products";
import { useCart } from "@/context/CartContext";

interface Props {
  products: Product[];
  brandLabel: string;
  filterBy?: "collection" | "brand";
}

const ACCENT = "#c9a96e";

const BRAND_NAMES: Record<string, string> = {
  "prada": "Prada",
  "christian-dior": "Christian Dior",
  "versace": "Versace",
  "gucci": "Gucci",
  "balenciaga": "Balenciaga",
  "louis-vuitton": "Louis Vuitton",
  "saint-laurent": "Saint Laurent",
  "fendi": "Fendi",
  "cartier": "Cartier",
  "dolce-gabbana": "Dolce & Gabbana",
  "celine": "Céline",
};

export default function ProductGrid({ products, brandLabel, filterBy = "collection" }: Props) {
  const getKey = (p: Product) => filterBy === "brand" ? p.brand : p.collection;
  const getLabel = (key: string) => filterBy === "brand" ? (BRAND_NAMES[key] ?? key) : key;

  const filterKeys = ["Todos", ...Array.from(new Set(products.map(getKey)))];
  const [active, setActive] = useState("Todos");
  const [sort, setSort] = useState<"default" | "asc" | "desc">("default");

  let filtered = active === "Todos" ? products : products.filter((p) => getKey(p) === active);
  if (sort === "asc") filtered = [...filtered].sort((a, b) => a.price - b.price);
  if (sort === "desc") filtered = [...filtered].sort((a, b) => b.price - a.price);

  return (
    <section className="bg-[#0a0a0a] px-6 py-20 text-[#f0ece4] md:px-12 md:py-28">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-10 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-[0.42em] text-[#4a4540]">Catálogo</p>
            <h2 className="font-display mt-2 text-[2rem] font-light italic">{brandLabel}</h2>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Sort */}
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as typeof sort)}
              className="rounded-full border border-[#2a2520] bg-transparent px-4 py-1.5 text-[10px] uppercase tracking-[0.18em] text-[#4a4540] outline-none transition hover:border-[#4a4540]"
            >
              <option value="default">Ordenar</option>
              <option value="asc">Precio: menor a mayor</option>
              <option value="desc">Precio: mayor a menor</option>
            </select>

            {/* Filter pills */}
            <div className="flex flex-wrap gap-2">
              {filterKeys.map((key) => (
                <button
                  key={key}
                  onClick={() => setActive(key)}
                  className="cursor-pointer rounded-full border px-4 py-1.5 text-[10px] uppercase tracking-[0.2em] transition-all duration-200"
                  style={{
                    borderColor: active === key ? ACCENT : "#2a2520",
                    color: active === key ? ACCENT : "#4a4540",
                    background: active === key ? `${ACCENT}14` : "transparent",
                  }}
                >
                  {getLabel(key)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Grid */}
        <motion.div
          layout
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
        >
          <AnimatePresence>
            {filtered.map((product) => (
              <motion.div
                key={product.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
              >
                <ProductCard product={product} collectionLabel={getLabel(getKey(product))} />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>

        {filtered.length === 0 && (
          <p className="py-20 text-center text-sm text-[#4a4540]">
            No hay productos en esta colección.
          </p>
        )}
      </div>
    </section>
  );
}

function ProductCard({ product, collectionLabel }: { product: Product; collectionLabel: string }) {
  const { addItem } = useCart();
  const [hovered, setHovered] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState(
    product.variants?.find((v) => v.inStock)?.label ?? product.variants?.[0]?.label ?? ""
  );
  const [added, setAdded] = useState(false);

  function handleAddToCart(e: React.MouseEvent) {
    e.preventDefault();
    addItem(product, selectedVariant);
    setAdded(true);
    setTimeout(() => setAdded(false), 1800);
  }

  return (
    <div
      className="group relative overflow-hidden rounded-[1.4rem] border border-white/8 bg-white/[0.025] transition-all duration-500"
      style={{ transform: hovered ? "translateY(-4px)" : "translateY(0)" }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Image — links to product page */}
      <Link href={`/tienda/productos/${product.slug}`} className="block">
        <div className="relative h-56 overflow-hidden bg-[#121010]">
          <img
            src={product.images[0]}
            alt={product.name}
            className="h-full w-full object-cover transition-transform duration-[1100ms]"
            style={{
              transform: hovered ? "scale(1.07)" : "scale(1)",
              filter: "brightness(0.9) contrast(1.02)",
            }}
            onError={(e) => {
              (e.target as HTMLImageElement).src =
                "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300'%3E%3Crect width='400' height='300' fill='%23181410'/%3E%3C/svg%3E";
            }}
          />

          {product.badge && (
            <div
              className="absolute left-3 top-3 rounded-full px-3 py-1 text-[9px] uppercase tracking-[0.2em]"
              style={{ background: `${ACCENT}22`, color: ACCENT, border: `1px solid ${ACCENT}40` }}
            >
              {product.badge}
            </div>
          )}

          {/* View detail hint */}
          <div
            className="absolute inset-0 flex items-center justify-center transition-all duration-300"
            style={{ background: hovered ? "rgba(0,0,0,0.35)" : "rgba(0,0,0,0)", opacity: hovered ? 1 : 0 }}
          >
            <span className="rounded-full bg-[#f0ece4] px-4 py-1.5 text-[10px] uppercase tracking-[0.2em] text-[#0a0a0a]">
              Ver detalle
            </span>
          </div>
        </div>
      </Link>

      {/* Info */}
      <div className="p-5">
        <p className="text-[9px] uppercase tracking-[0.32em] text-[#4a4540]">{collectionLabel}</p>
        <h3 className="mt-1.5 text-sm font-medium text-[#f0ece4]">{product.name}</h3>
        <p className="mt-0.5 text-xs text-[#4a4540]">{product.subtitle}</p>

        {/* Variant selector */}
        {product.variants && product.variants.length > 1 && (
          <select
            value={selectedVariant}
            onChange={(e) => setSelectedVariant(e.target.value)}
            className="mt-3 w-full rounded-lg border border-white/8 bg-transparent px-3 py-1.5 text-[10px] text-[#6a6560] outline-none"
          >
            {product.variants.map((v) => (
              <option key={v.label} value={v.label} disabled={!v.inStock} className="bg-[#0a0a0a]">
                {v.label}{!v.inStock ? " — sin stock" : ""}
              </option>
            ))}
          </select>
        )}

        <div className="mt-3 flex items-center justify-between">
          <p className="text-[12px]" style={{ color: ACCENT }}>
            {formatPrice(product.price)}
          </p>

          <button
            onClick={handleAddToCart}
            className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[10px] uppercase tracking-[0.18em] transition-all duration-200"
            style={{
              background: added ? `${ACCENT}` : `${ACCENT}18`,
              color: added ? "#0a0a0a" : ACCENT,
              border: `1px solid ${ACCENT}40`,
            }}
          >
            {added ? (
              <>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                Agregado
              </>
            ) : (
              <>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                Agregar
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
