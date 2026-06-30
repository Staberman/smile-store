"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import type { CatalogProduct } from "@/lib/catalog";
import { formatPrice } from "@/lib/catalog";
import ProductMedia from "@/components/product/ProductMedia";
import {
  getAvailableVariants,
  getDisplayPrice,
  getInstallmentPrice,
  getTransferPrice,
} from "@/lib/storefront.mjs";

interface Props {
  products: CatalogProduct[];
  brandLabel: string;
  filterBy?: "collection" | "brand";
  searchProducts?: CatalogProduct[];
}

const ACCENT = "#c9a96e";

const BRAND_NAMES: Record<string, string> = {
  prada: "Prada",
  "christian-dior": "Christian Dior",
  versace: "Versace",
  gucci: "Gucci",
  balenciaga: "Balenciaga",
  "louis-vuitton": "Louis Vuitton",
  "saint-laurent": "Saint Laurent",
  fendi: "Fendi",
  cartier: "Cartier",
  "dolce-gabbana": "Dolce & Gabbana",
  celine: "Celine",
};

type FilterOption = {
  key: string;
  label: string;
  count: number;
};

function getCollectionKey(product: CatalogProduct): string {
  return product.categories[product.categories.length - 1] ?? "Sin categoría";
}

function getSortPrice(product: CatalogProduct): number {
  return product.promotionalPrice ?? product.price ?? Number.POSITIVE_INFINITY;
}

function getVariantLabel(product: CatalogProduct, variantId: number | null): string {
  const variant = product.variants.find((item) => item.id === variantId);
  if (!variant) return "Única opción";
  const optionLabel = variant.options.filter(Boolean).join(" / ");
  return optionLabel || `Variante ${variant.id ?? ""}`.trim();
}

function getVariantValue(variantId: number | null): string {
  return variantId === null ? "null" : String(variantId);
}

function normalizeSearch(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function getSearchText(product: CatalogProduct, label: string): string {
  return normalizeSearch(
    [
      product.name,
      product.brand,
      label,
      ...product.categories,
      ...product.tags,
      product.descriptionText,
      product.seoTitle,
      product.seoDescription,
    ].join(" ")
  );
}

function getPriorityFilters(options: FilterOption[]): FilterOption[] {
  return [...options]
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label))
    .slice(0, 6);
}

function getSearchSuggestions(
  products: CatalogProduct[],
  query: string,
  getLabel: (key: string) => string,
  getKey: (product: CatalogProduct) => string
): string[] {
  const normalizedQuery = normalizeSearch(query);
  if (normalizedQuery.length < 2) return [];

  return products
    .map((product) => {
      const label = getLabel(getKey(product));
      const haystack = getSearchText(product, label);
      const normalizedName = normalizeSearch(product.name);
      const normalizedBrand = normalizeSearch(product.brand);
      const score = normalizedName.startsWith(normalizedQuery)
        ? 4
        : normalizedBrand.startsWith(normalizedQuery)
          ? 3
          : haystack.includes(normalizedQuery)
            ? 2
            : 0;

      return { product, score };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score || a.product.name.localeCompare(b.product.name))
    .slice(0, 5)
    .map((item) => item.product.name);
}

export default function ProductGrid({
  products,
  brandLabel,
  filterBy = "collection",
  searchProducts,
}: Props) {
  const searchableProducts = searchProducts ?? products;
  const getKey = (product: CatalogProduct) =>
    filterBy === "brand" ? product.brand : getCollectionKey(product);
  const getLabel = (key: string) => filterBy === "brand" ? (BRAND_NAMES[key] ?? key) : key;

  const filterOptions = useMemo<FilterOption[]>(() => {
    const counts = new Map<string, number>();
    for (const product of products) {
      const key = getKey(product);
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }

    return Array.from(counts.entries())
      .map(([key, count]) => ({ key, label: getLabel(key), count }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [products, filterBy]);

  const priorityFilters = useMemo(() => getPriorityFilters(filterOptions), [filterOptions]);
  const priorityKeys = useMemo(() => new Set(priorityFilters.map((item) => item.key)), [priorityFilters]);
  const secondaryFilters = filterOptions.filter((item) => !priorityKeys.has(item.key));
  const [active, setActive] = useState("Todos");
  const [sort, setSort] = useState<"default" | "asc" | "desc">("default");
  const [search, setSearch] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);

  const normalizedSearch = normalizeSearch(search);
  const suggestions = getSearchSuggestions(searchableProducts, search, getLabel, getKey);
  const baseProducts = normalizedSearch.length > 0 ? searchableProducts : products;

  let filtered = baseProducts.filter((product) => {
    const productKey = getKey(product);
    const matchesFilter =
      normalizedSearch.length > 0 || active === "Todos" || productKey === active;
    const matchesSearch =
      normalizedSearch.length === 0 ||
      getSearchText(product, getLabel(productKey)).includes(normalizedSearch);

    return matchesFilter && matchesSearch;
  });
  if (sort === "asc") filtered = [...filtered].sort((a, b) => getSortPrice(a) - getSortPrice(b));
  if (sort === "desc") filtered = [...filtered].sort((a, b) => getSortPrice(b) - getSortPrice(a));

  return (
    <section className="bg-[#0a0a0a] px-6 py-20 text-[#f0ece4] md:px-12 md:py-28">
      <div className="mx-auto max-w-7xl">
        <div className="mb-10 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-[0.42em] text-[#4a4540]">Catálogo</p>
            <h2 className="font-display mt-2 text-[2rem] font-light italic">{brandLabel}</h2>
          </div>

          <div className="flex flex-col gap-3 md:items-end">
            <div className="relative w-full md:w-80">
              <input
                type="search"
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setShowSuggestions(true);
                }}
                onFocus={() => setShowSuggestions(true)}
                onBlur={() => window.setTimeout(() => setShowSuggestions(false), 120)}
                placeholder="Buscar producto, marca o estilo"
                className="w-full rounded-full border border-[#2a2520] bg-[#0d0c0b] px-4 py-2 text-sm text-[#f0ece4] outline-none transition placeholder:text-[#4a4540] focus:border-[#c9a96e]"
              />

              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-20 overflow-hidden rounded-2xl border border-[#2a2520] bg-[#0d0c0b] shadow-2xl shadow-black/40">
                  {suggestions.map((suggestion) => (
                    <button
                      key={suggestion}
                      type="button"
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => {
                        setSearch(suggestion);
                        setShowSuggestions(false);
                      }}
                      className="block w-full px-4 py-2.5 text-left text-xs text-[#b8b0a4] transition hover:bg-[#c9a96e]/10 hover:text-[#c9a96e]"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center justify-end gap-3">
              <select
                value={sort}
                onChange={(event) => setSort(event.target.value as typeof sort)}
                className="rounded-full border border-[#2a2520] bg-[#0d0c0b] px-4 py-1.5 text-[10px] uppercase tracking-[0.18em] text-[#4a4540] outline-none transition hover:border-[#4a4540]"
              >
                <option value="default" className="bg-[#0a0a0a]">Ordenar</option>
                <option value="asc" className="bg-[#0a0a0a]">Precio: menor a mayor</option>
                <option value="desc" className="bg-[#0a0a0a]">Precio: mayor a menor</option>
              </select>

              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setActive("Todos")}
                  className="cursor-pointer rounded-full border px-4 py-1.5 text-[10px] uppercase tracking-[0.2em] transition-all duration-200"
                  style={{
                    borderColor: active === "Todos" ? ACCENT : "#2a2520",
                    color: active === "Todos" ? ACCENT : "#4a4540",
                    background: active === "Todos" ? `${ACCENT}14` : "transparent",
                  }}
                >
                  Todos
                </button>

                {priorityFilters.map((option) => (
                  <button
                    key={option.key}
                    onClick={() => setActive(option.key)}
                    className="cursor-pointer rounded-full border px-4 py-1.5 text-[10px] uppercase tracking-[0.2em] transition-all duration-200"
                    style={{
                      borderColor: active === option.key ? ACCENT : "#2a2520",
                      color: active === option.key ? ACCENT : "#4a4540",
                      background: active === option.key ? `${ACCENT}14` : "transparent",
                    }}
                  >
                    {option.label}
                  </button>
                ))}

                {secondaryFilters.length > 0 && (
                  <select
                    value={priorityKeys.has(active) || active === "Todos" ? "" : active}
                    onChange={(event) => {
                      if (event.target.value) setActive(event.target.value);
                    }}
                    className="rounded-full border border-[#2a2520] bg-[#0d0c0b] px-4 py-1.5 text-[10px] uppercase tracking-[0.18em] text-[#4a4540] outline-none transition hover:border-[#4a4540]"
                  >
                    <option value="" className="bg-[#0a0a0a]">Mas categorias / marcas</option>
                    {secondaryFilters.map((option) => (
                      <option key={option.key} value={option.key} className="bg-[#0a0a0a]">
                        {option.label} ({option.count})
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>
          </div>
        </div>

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

function ProductCard({ product, collectionLabel }: { product: CatalogProduct; collectionLabel: string }) {
  const availableVariants = getAvailableVariants(product);
  const [hovered, setHovered] = useState(false);
  const [selectedVariantId, setSelectedVariantId] = useState<number | null>(
    availableVariants[0]?.id ?? product.variants[0]?.id ?? null
  );

  const selectedVariant =
    product.variants.find((variant) => variant.id === selectedVariantId) ??
    availableVariants[0] ??
    product.variants[0] ??
    null;

  const image = selectedVariant?.image ?? product.images[0];
  const price = getDisplayPrice(product, selectedVariant);
  const transferPrice = getTransferPrice(price);
  const installmentPrice = getInstallmentPrice(price);

  return (
    <div
      className="group relative overflow-hidden rounded-[1.4rem] border border-white/8 bg-white/[0.025] transition-all duration-500"
      style={{ transform: hovered ? "translateY(-4px)" : "translateY(0)" }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <Link href={`/tienda/productos/${product.slug}`} className="block">
        <div className="relative flex h-60 items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_center,rgba(201,169,110,0.12),rgba(18,16,16,0)_62%)] sm:h-56">
          <ProductMedia product={product} src={image} hovered={hovered} />

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

      <div className="p-5">
        <p className="text-[9px] uppercase tracking-[0.32em] text-[#4a4540]">{collectionLabel}</p>
        <h3 className="mt-1.5 text-sm font-medium text-[#f0ece4]">{product.name}</h3>
        <p className="mt-0.5 text-xs text-[#4a4540]">{product.brand}</p>

        {availableVariants.length > 1 && (
          <select
            value={getVariantValue(selectedVariantId)}
            onChange={(event) =>
              setSelectedVariantId(event.target.value === "null" ? null : Number(event.target.value))
            }
            className="mt-3 w-full rounded-lg border border-white/8 bg-transparent px-3 py-1.5 text-[10px] text-[#6a6560] outline-none"
          >
            {availableVariants.map((variant, index) => (
              <option
                key={`${variant.id ?? "null"}-${index}`}
                value={getVariantValue(variant.id)}
                className="bg-[#0a0a0a]"
              >
                {getVariantLabel(product, variant.id)}
              </option>
            ))}
          </select>
        )}

        <div className="mt-4 flex items-end justify-between gap-3">
          <div>
            <p className="text-[13px]" style={{ color: ACCENT }}>
              {formatPrice(price)}
            </p>
            <p className="mt-1 text-[10px] text-[#b8b0a4]">
              {formatPrice(transferPrice)} por transferencia
            </p>
            <p className="mt-0.5 text-[9px] text-[#6a6560]">
              6 cuotas de {formatPrice(installmentPrice)}
            </p>
          </div>

          <Link
            href={`/tienda/productos/${product.slug}`}
            className="inline-flex min-h-10 items-center justify-center rounded-full border px-4 text-[10px] uppercase tracking-[0.18em] transition hover:border-[#c9a96e] hover:text-[#c9a96e]"
            style={{ borderColor: "#2a2520", color: "#6a6560" }}
          >
            Ver detalle
          </Link>
        </div>
      </div>
    </div>
  );
}
