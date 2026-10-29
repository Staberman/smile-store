"use client";

import { useCallback, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ProductCard from "@/components/brand/ProductCard";
import { extraSearchText, useSearchIndex } from "@/components/search/search-data";
import { formatPrice } from "@/lib/format";
import { matchesSearch, normalizeSearchText } from "@/lib/product-search.mjs";
import type { ProductSummary } from "@/lib/product-summary";
import { CATALOG_QUERY_PARAM, searchFromAddress } from "@/lib/search-overlay.mjs";
import { isWatch, sortByCardPrice } from "@/lib/storefront.mjs";
import { canonicalBrand } from "@/lib/brand-directory";

interface Props {
  products: ProductSummary[];
  brandLabel: string;
  filterBy?: "collection" | "brand";
  searchProducts?: ProductSummary[];
  /** Opt-in faceted filters (Tipo/Marca/Género/Precio). Off by default so
   *  single-brand pages keep their lean toolbar untouched. */
  enableFacets?: boolean;
  /** Fade cards in as they mount and animate layout changes. Disable it when
   *  the grid replaces server-rendered markup, so visible cards do not blink
   *  out and back in, or when cards arrive without a user action (the rest
   *  of a preview): cards mounted while it is off appear in place. */
  animateEntrance?: boolean;
  /** Search from the address (`?q=`), which fills the field whenever it
   *  changes; typing drops it from the address so the same link applies
   *  again. Only the homepage catalog, which reads the address, passes it. */
  initialSearch?: string;
}

const ACCENT = "#c9a96e";

const GENERO_ORDER = ["hombre", "mujer", "unisex"] as const;
const GENERO_LABELS: Record<string, string> = {
  hombre: "Hombre",
  mujer: "Mujer",
  unisex: "Unisex",
};
const TIPO_LABELS: Record<string, string> = {
  lentes: "Lentes",
  relojes: "Relojes",
};

type FacetSelections = {
  tipo: Set<string>;
  marca: Set<string>;
  genero: Set<string>;
  precio: Set<string>;
};

type PriceBucket = { id: string; label: string; min: number; max: number };

function getFacetPrice(product: ProductSummary): number | null {
  return product.promotionalPrice ?? product.price ?? null;
}

function getTipo(product: ProductSummary): "lentes" | "relojes" {
  return isWatch(product) ? "relojes" : "lentes";
}

function getProductGeneros(product: ProductSummary): string[] {
  return GENERO_ORDER.filter((genero) => product.genders.includes(genero));
}

// Buckets derived from the ACTUAL price spread of the given set — never
// hardcoded — split into ~4 nice ARS ranges, keeping only ranges with products.
function buildPriceBuckets(products: ProductSummary[]): PriceBucket[] {
  const prices = products
    .map(getFacetPrice)
    .filter((value): value is number => value !== null && Number.isFinite(value));
  if (prices.length === 0) return [];

  const min = Math.min(...prices);
  const max = Math.max(...prices);
  if (min === max) return [];

  const step = 50000;
  const lo = Math.floor(min / step) * step;
  const hi = Math.ceil(max / step) * step;
  const bucketSize = Math.max(step, Math.ceil((hi - lo) / 4 / step) * step);

  const buckets: PriceBucket[] = [];
  for (let start = lo; start < hi; start += bucketSize) {
    const rawEnd = start + bucketSize;
    const isLast = rawEnd >= hi;
    const end = isLast ? Number.POSITIVE_INFINITY : rawEnd;
    const hasProducts = prices.some(
      (price) => price >= start && (end === Number.POSITIVE_INFINITY || price < end),
    );
    if (!hasProducts) continue;
    buckets.push({
      id: `${start}-${isLast ? "max" : rawEnd}`,
      min: start,
      max: end,
      label: isLast
        ? `Más de ${formatPrice(start)}`
        : `${formatPrice(start)} – ${formatPrice(rawEnd)}`,
    });
  }
  return buckets;
}

function priceInBucket(price: number, bucket: PriceBucket): boolean {
  return price >= bucket.min && (bucket.max === Number.POSITIVE_INFINITY || price < bucket.max);
}

type FilterOption = {
  key: string;
  label: string;
  count: number;
};

function getCollectionKey(product: ProductSummary): string {
  return product.categories[product.categories.length - 1] ?? "Sin categoría";
}

// Filter keys are shown as they are (category and brand names).
const getLabel = (key: string) => key;

/** The address without `?q=`, keeping the view and the #catalogo anchor. */
function dropSearchParam(): void {
  const url = new URL(window.location.href);
  if (!url.searchParams.has(CATALOG_QUERY_PARAM)) return;
  url.searchParams.delete(CATALOG_QUERY_PARAM);
  // Not window.history.state: Next.js only syncs useSearchParams for states
  // it has not written itself.
  window.history.replaceState(null, "", url);
}

type SortOrder = "default" | "asc" | "desc";

/** What the sort control shows for each order; its options keep the full wording. */
const SORT_LABELS: Record<SortOrder, string> = {
  default: "Ordenar",
  asc: "Menor precio",
  desc: "Mayor precio",
};

/**
 * A native select drawn as a chip: `display` is shown at 10px with a chevron,
 * and the transparent select laid over it keeps 16px text, so iOS does not
 * zoom the page when it opens. Tapping anywhere on the chip opens the select.
 */
function ChipSelect({
  display,
  ariaLabel,
  value,
  onChange,
  className = "",
  style,
  children,
}: {
  display: string;
  ariaLabel: string;
  value: string;
  onChange: (value: string) => void;
  className?: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`relative inline-flex min-w-0 items-center justify-center gap-2 rounded-full border px-4 text-[10px] uppercase tracking-[0.2em] transition has-[select:focus-visible]:ring-1 has-[select:focus-visible]:ring-[#c9a96e] ${className}`}
      style={style}
    >
      <span aria-hidden="true" className="truncate">
        {display}
      </span>
      <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="shrink-0">
        <path d="m6 9 6 6 6-6" />
      </svg>
      <select
        aria-label={ariaLabel}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="absolute inset-0 h-full w-full cursor-pointer appearance-none rounded-full text-base opacity-0"
      >
        {children}
      </select>
    </div>
  );
}

/** Filter chip colors: accent while selected. */
function chipStyle(selected: boolean): React.CSSProperties {
  return {
    borderColor: selected ? ACCENT : "#2a2520",
    color: selected ? ACCENT : "#4a4540",
    background: selected ? `${ACCENT}14` : "transparent",
  };
}

// Same height for every chip, the "more" select included; desktop keeps the compact chips.
const CHIP_CLASS =
  "inline-flex min-h-9 cursor-pointer items-center rounded-full border px-4 text-[10px] uppercase tracking-[0.2em] transition-all duration-200 md:min-h-0 md:py-1.5";

function getPriorityFilters(options: FilterOption[]): FilterOption[] {
  return [...options]
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label))
    .slice(0, 6);
}

export default function ProductGrid({
  products,
  brandLabel,
  filterBy = "collection",
  searchProducts,
  enableFacets = false,
  animateEntrance = true,
  initialSearch = "",
}: Props) {
  const searchableProducts = searchProducts ?? products;
  const getKey = useCallback(
    (product: ProductSummary) =>
      filterBy === "brand" ? canonicalBrand(product.brand) : getCollectionKey(product),
    [filterBy],
  );

  const filterOptions = useMemo<FilterOption[]>(() => {
    const counts = new Map<string, number>();
    for (const product of products) {
      const key = getKey(product);
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }

    return Array.from(counts.entries())
      .map(([key, count]) => ({ key, label: getLabel(key), count }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [products, getKey]);

  const priorityFilters = useMemo(() => getPriorityFilters(filterOptions), [filterOptions]);
  const priorityKeys = useMemo(() => new Set(priorityFilters.map((item) => item.key)), [priorityFilters]);
  const secondaryFilters = filterOptions.filter((item) => !priorityKeys.has(item.key));
  const [active, setActive] = useState("Todos");
  const [sort, setSort] = useState<SortOrder>("default");
  const [search, setSearch] = useState(initialSearch);
  // The `?q=` the field last took its text from (see searchFromAddress).
  const [addressSearch, setAddressSearch] = useState(initialSearch);
  if (initialSearch !== addressSearch) {
    setAddressSearch(initialSearch);
    setSearch(searchFromAddress(addressSearch, initialSearch, search));
  }
  // Set on the first focus: the search index loads from then on.
  const [searchUsed, setSearchUsed] = useState(false);
  const [facets, setFacets] = useState<FacetSelections>(() => ({
    tipo: new Set(),
    marca: new Set(),
    genero: new Set(),
    precio: new Set(),
  }));
  const [filtersOpen, setFiltersOpen] = useState(false);

  const searchIndex = useSearchIndex(searchUsed || search.length > 0);
  const searching = normalizeSearchText(search).length > 0;
  const baseProducts = searching ? searchableProducts : products;

  // Products after the existing ?view= / search / category-chip narrowing. A
  // search spans every searchable product, whatever chip is selected. It uses
  // the matcher of the site search overlay (lib/product-search.mjs), so both
  // find the same products. Facets are derived from and applied ON TOP of
  // this set, so they complement (never replace) the current view and search.
  const searched = useMemo(() => {
    const extraText = (product: ProductSummary) =>
      extraSearchText(product, searchIndex, getLabel(getKey(product)));
    return baseProducts.filter(
      (product) =>
        (searching || active === "Todos" || getKey(product) === active) &&
        matchesSearch(product, search, { extraText }),
    );
  }, [baseProducts, searching, search, active, getKey, searchIndex]);

  const priceBuckets = useMemo(
    () => (enableFacets ? buildPriceBuckets(searched) : []),
    [enableFacets, searched],
  );
  const bucketsById = useMemo(
    () => new Map(priceBuckets.map((bucket) => [bucket.id, bucket])),
    [priceBuckets],
  );

  const facetGroups = useMemo(() => {
    if (!enableFacets) return [];
    const tipoCounts = new Map<string, number>();
    const marcaCounts = new Map<string, number>();
    const generoCounts = new Map<string, number>();
    for (const product of searched) {
      const tipo = getTipo(product);
      tipoCounts.set(tipo, (tipoCounts.get(tipo) ?? 0) + 1);
      const marca = canonicalBrand(product.brand);
      marcaCounts.set(marca, (marcaCounts.get(marca) ?? 0) + 1);
      for (const genero of getProductGeneros(product)) {
        generoCounts.set(genero, (generoCounts.get(genero) ?? 0) + 1);
      }
    }

    const groups: {
      id: keyof FacetSelections;
      label: string;
      options: { value: string; label: string; count: number }[];
    }[] = [];

    const tipoOptions = Array.from(tipoCounts.entries())
      .map(([value, count]) => ({ value, label: TIPO_LABELS[value] ?? value, count }))
      .sort((a, b) => a.label.localeCompare(b.label));
    if (tipoOptions.length >= 2) groups.push({ id: "tipo", label: "Tipo", options: tipoOptions });

    const marcaOptions = Array.from(marcaCounts.entries())
      .map(([value, count]) => ({ value, label: value, count }))
      .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
    if (marcaOptions.length >= 2) groups.push({ id: "marca", label: "Marca", options: marcaOptions });

    const generoOptions = GENERO_ORDER.filter((genero) => generoCounts.has(genero)).map(
      (genero) => ({
        value: genero,
        label: GENERO_LABELS[genero],
        count: generoCounts.get(genero) ?? 0,
      }),
    );
    if (generoOptions.length >= 2) groups.push({ id: "genero", label: "Género", options: generoOptions });

    if (priceBuckets.length >= 2) {
      groups.push({
        id: "precio",
        label: "Precio",
        options: priceBuckets.map((bucket) => ({
          value: bucket.id,
          label: bucket.label,
          count: searched.filter((product) => {
            const price = getFacetPrice(product);
            return price !== null && priceInBucket(price, bucket);
          }).length,
        })),
      });
    }

    return groups;
  }, [enableFacets, searched, priceBuckets]);

  const facetted = useMemo(() => {
    if (!enableFacets) return searched;
    return searched.filter((product) => {
      const matchesTipo = facets.tipo.size === 0 || facets.tipo.has(getTipo(product));
      const matchesMarca =
        facets.marca.size === 0 || facets.marca.has(canonicalBrand(product.brand));
      const matchesGenero =
        facets.genero.size === 0 ||
        getProductGeneros(product).some((genero) => facets.genero.has(genero));
      const price = getFacetPrice(product);
      const matchesPrecio =
        facets.precio.size === 0 ||
        (price !== null &&
          Array.from(facets.precio).some((id) => {
            const bucket = bucketsById.get(id);
            return bucket ? priceInBucket(price, bucket) : false;
          }));
      return matchesTipo && matchesMarca && matchesGenero && matchesPrecio;
    });
  }, [enableFacets, searched, facets, bucketsById]);

  // By the price each card shows, not the product-level price.
  const filtered = sort === "default" ? facetted : sortByCardPrice(facetted, sort);

  const activeFacetCount =
    facets.tipo.size + facets.marca.size + facets.genero.size + facets.precio.size;
  const showFilterButton = enableFacets && facetGroups.length > 0;
  // The selected filter when it is one of those in the "more" select, else null.
  const activeSecondary = active !== "Todos" && !priorityKeys.has(active) ? active : null;

  const toggleFacet = (group: keyof FacetSelections, value: string) => {
    setFacets((prev) => {
      const next = new Set(prev[group]);
      if (next.has(value)) next.delete(value);
      else next.add(value);
      return { ...prev, [group]: next };
    });
  };

  const clearFacets = () =>
    setFacets({ tipo: new Set(), marca: new Set(), genero: new Set(), precio: new Set() });

  const facetChipLabel = (group: keyof FacetSelections, value: string): string => {
    if (group === "tipo") return TIPO_LABELS[value] ?? value;
    if (group === "genero") return GENERO_LABELS[value] ?? value;
    if (group === "precio") return bucketsById.get(value)?.label ?? value;
    return value;
  };

  const activeChips = enableFacets
    ? (Object.keys(facets) as (keyof FacetSelections)[]).flatMap((group) =>
        Array.from(facets[group]).map((value) => ({ group, value })),
      )
    : [];

  return (
    <section className="bg-[#0a0a0a] px-6 py-20 text-[#f0ece4] md:px-12 md:py-28">
      <div className="mx-auto max-w-7xl">
        <div className="mb-10 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-[0.42em] text-[#4a4540]">Catálogo</p>
            <h2 className="font-display mt-2 text-[2rem] font-light italic">{brandLabel}</h2>
          </div>

          <div className="flex flex-col gap-3 md:items-end">
            <div className="w-full md:w-80">
              <input
                type="search"
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  if (initialSearch) dropSearchParam();
                }}
                onFocus={() => setSearchUsed(true)}
                placeholder="Buscar producto, marca o estilo"
                aria-label="Buscar en el catálogo"
                className="w-full rounded-full border border-[#2a2520] bg-[#0d0c0b] px-4 py-2 text-base md:text-sm text-[#f0ece4] outline-none transition placeholder:text-[#4a4540] focus:border-[#c9a96e]"
              />
            </div>

            {/* Phones: [Filtrar | Ordenar] in two equal cells, then the chips,
                left-aligned. From md: one right-aligned, wrapping row, as before. */}
            <div className="flex flex-col gap-3 md:flex-row md:flex-wrap md:items-center md:justify-end">
              <div
                className={`grid gap-3 md:flex md:items-center ${showFilterButton ? "grid-cols-2" : "grid-cols-1"}`}
              >
                {showFilterButton && (
                  <button
                    type="button"
                    onClick={() => setFiltersOpen((open) => !open)}
                    aria-expanded={filtersOpen}
                    className="inline-flex min-h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-full border px-4 text-[10px] uppercase tracking-[0.2em] transition-all duration-200 md:w-auto"
                    style={{
                      borderColor: filtersOpen || activeFacetCount > 0 ? ACCENT : "#2a2520",
                      color: filtersOpen || activeFacetCount > 0 ? ACCENT : "#8b8580",
                      background: filtersOpen || activeFacetCount > 0 ? `${ACCENT}14` : "transparent",
                    }}
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                      <path d="M3 5h18M6 12h12M10 19h4" />
                    </svg>
                    Filtrar
                    {activeFacetCount > 0 && (
                      <span className="inline-flex min-w-[18px] items-center justify-center rounded-full bg-[#c9a96e] px-1 text-[9px] font-semibold text-[#0a0a0a]">
                        {activeFacetCount}
                      </span>
                    )}
                  </button>
                )}

                <ChipSelect
                  display={SORT_LABELS[sort]}
                  ariaLabel="Ordenar productos"
                  value={sort}
                  onChange={(value) => setSort(value as SortOrder)}
                  className="min-h-11 w-full border-[#2a2520] text-[#8b8580] hover:border-[#4a4540] md:min-h-0 md:w-auto md:bg-[#0d0c0b] md:py-1.5 md:text-[#4a4540]"
                >
                  <option value="default" className="bg-[#0a0a0a]">Ordenar</option>
                  <option value="asc" className="bg-[#0a0a0a]">Precio: menor a mayor</option>
                  <option value="desc" className="bg-[#0a0a0a]">Precio: mayor a menor</option>
                </ChipSelect>
              </div>

              <div className="flex flex-wrap gap-2 md:justify-end">
                <button
                  onClick={() => setActive("Todos")}
                  className={CHIP_CLASS}
                  style={chipStyle(active === "Todos")}
                >
                  Todos
                </button>

                {priorityFilters.map((option) => (
                  <button
                    key={option.key}
                    onClick={() => setActive(option.key)}
                    className={CHIP_CLASS}
                    style={chipStyle(active === option.key)}
                  >
                    {option.label}
                  </button>
                ))}

                {secondaryFilters.length > 0 && (
                  <ChipSelect
                    // Shows the selected secondary filter, styled as a selected chip.
                    display={activeSecondary ? getLabel(activeSecondary) : "Más categorías / marcas"}
                    ariaLabel="Más categorías y marcas"
                    value={activeSecondary ?? ""}
                    onChange={(value) => {
                      if (value) setActive(value);
                    }}
                    className="min-h-9 md:min-h-0 md:py-1.5"
                    style={chipStyle(activeSecondary !== null)}
                  >
                    <option value="" className="bg-[#0a0a0a]">Más categorías / marcas</option>
                    {secondaryFilters.map((option) => (
                      <option key={option.key} value={option.key} className="bg-[#0a0a0a]">
                        {option.label} ({option.count})
                      </option>
                    ))}
                  </ChipSelect>
                )}
              </div>
            </div>
          </div>
        </div>

        {enableFacets && filtersOpen && facetGroups.length > 0 && (
          <>
            {/* Mobile backdrop */}
            <div
              className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm md:hidden"
              onClick={() => setFiltersOpen(false)}
              aria-hidden="true"
            />
            <div
              role="dialog"
              aria-label="Filtros del catálogo"
              className="fixed inset-x-0 bottom-0 z-50 max-h-[85vh] overflow-y-auto rounded-t-3xl border-t border-[#2a2520] bg-[#0d0c0b] p-6 shadow-2xl shadow-black/60 md:static md:z-auto md:mb-10 md:max-h-none md:overflow-visible md:rounded-2xl md:border md:p-7"
            >
              <div className="mb-5 flex items-center justify-between md:hidden">
                <p className="text-sm font-medium text-[#f0ece4]">Filtros</p>
                <button
                  type="button"
                  onClick={() => setFiltersOpen(false)}
                  aria-label="Cerrar filtros"
                  className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[#2a2520] text-[#b8b0a4]"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                    <path d="M6 6l12 12M18 6L6 18" />
                  </svg>
                </button>
              </div>

              <div className="grid gap-7 md:grid-cols-2 lg:grid-cols-4">
                {facetGroups.map((group) => (
                  <div key={group.id}>
                    <p className="mb-3 text-[10px] uppercase tracking-[0.28em] text-[#8b8580]">
                      {group.label}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {group.options.map((option) => {
                        const selected = facets[group.id].has(option.value);
                        return (
                          <button
                            key={option.value}
                            type="button"
                            onClick={() => toggleFacet(group.id, option.value)}
                            aria-pressed={selected}
                            className="inline-flex min-h-11 cursor-pointer items-center gap-1.5 rounded-full border px-4 text-xs tracking-wide transition-all duration-200"
                            style={{
                              borderColor: selected ? ACCENT : "#2a2520",
                              color: selected ? ACCENT : "#b8b0a4",
                              background: selected ? `${ACCENT}14` : "transparent",
                            }}
                          >
                            {option.label}
                            <span className="text-[10px] text-[#6a6560]">{option.count}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-7 flex items-center justify-between gap-4 border-t border-[#2a2520] pt-5">
                <button
                  type="button"
                  onClick={clearFacets}
                  disabled={activeFacetCount === 0}
                  className="min-h-11 text-[11px] uppercase tracking-[0.2em] text-[#8b8580] transition hover:text-[#c9a96e] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Limpiar filtros
                </button>
                <button
                  type="button"
                  onClick={() => setFiltersOpen(false)}
                  className="inline-flex min-h-11 items-center rounded-full bg-[#c9a96e] px-6 text-[11px] uppercase tracking-[0.2em] text-[#0a0a0a] transition hover:bg-[#e2c989]"
                >
                  Ver {filtered.length} {filtered.length === 1 ? "producto" : "productos"}
                </button>
              </div>
            </div>
          </>
        )}

        {enableFacets && (activeChips.length > 0 || facetGroups.length > 0) && (
          <div className="mb-8 flex flex-wrap items-center gap-2">
            <span className="text-xs text-[#8b8580]">
              {filtered.length} {filtered.length === 1 ? "producto" : "productos"}
            </span>
            {activeChips.length > 0 && (
              <span className="mx-1 h-4 w-px bg-[#2a2520]" aria-hidden="true" />
            )}
            {activeChips.map((chip) => (
              <button
                key={`${chip.group}-${chip.value}`}
                type="button"
                onClick={() => toggleFacet(chip.group, chip.value)}
                className="inline-flex min-h-9 items-center gap-1.5 rounded-full border border-[#c9a96e]/50 bg-[#c9a96e]/10 px-3 text-xs text-[#e2c989] transition hover:border-[#c9a96e]"
              >
                {facetChipLabel(chip.group, chip.value)}
                <span aria-hidden="true" className="text-[13px] leading-none">×</span>
              </button>
            ))}
            {activeChips.length > 0 && (
              <button
                type="button"
                onClick={clearFacets}
                className="ml-1 min-h-9 text-[11px] uppercase tracking-[0.18em] text-[#8b8580] transition hover:text-[#c9a96e]"
              >
                Limpiar filtros
              </button>
            )}
          </div>
        )}

        <motion.div
          layout={animateEntrance}
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
        >
          <AnimatePresence initial={animateEntrance}>
            {filtered.map((product) => (
              <motion.div
                key={product.slug}
                layout={animateEntrance}
                initial={animateEntrance ? { opacity: 0, y: 20 } : false}
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
          <div className="py-20 text-center">
            <p className="text-sm text-[#4a4540]">
              {enableFacets && activeFacetCount > 0
                ? "Ningún producto coincide con los filtros seleccionados."
                : searching
                  ? `No encontramos productos para “${search.trim()}”.`
                  : "No hay productos en esta colección."}
            </p>
            {enableFacets && activeFacetCount > 0 && (
              <button
                type="button"
                onClick={clearFacets}
                className="mt-4 min-h-11 text-[11px] uppercase tracking-[0.2em] text-[#c9a96e] transition hover:text-[#e2c989]"
              >
                Limpiar filtros
              </button>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
