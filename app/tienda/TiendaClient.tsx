"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import ProductGrid from "@/components/brand/ProductGrid";
import BrandCarousel from "@/components/brand/BrandCarousel";
import TrustHighlights from "@/components/brand/TrustHighlights";
import { allProducts, getCategoryTree } from "@/lib/catalog";

const ACCENT = "#c9a96e";

type SubcategoryTab = {
  id: string;
  label: string;
  products: typeof allProducts;
  brandLabel: string;
  filterBy?: "collection" | "brand";
};

function normalizeLabel(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function formatLabel(value: string): string {
  const normalized = normalizeLabel(value);
  const specialCases: Record<string, string> = {
    "lentes de sol": "Lentes de Sol",
    relojes: "Relojes",
    "ray ban": "Ray-Ban",
    "marcas premium": "Marcas Premium",
    "ray ban scuderia ferrari collection": "Ray-Ban Scuderia Ferrari",
    "scuderia ferrari": "Scuderia Ferrari",
    "omega x swatch": "Omega x Swatch",
    invicta: "Invicta",
    "tommy hilfiger dama": "Tommy Hilfiger Dama",
    "tommy hilfiger caballero": "Tommy Hilfiger Caballero",
  };

  if (specialCases[normalized]) {
    return specialCases[normalized];
  }

  return value
    .toLowerCase()
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

const categories: Array<{
  id: string;
  label: string;
  subcategories: SubcategoryTab[];
}> = getCategoryTree()
  .filter((category) => category.children.length > 0)
  .map((category) => ({
    id: category.slug,
    label: formatLabel(category.label),
    subcategories: [
      {
        id: "todos",
        label: "Todos",
        products: allProducts.filter((product) => product.categories[0] === category.label),
        brandLabel: formatLabel(category.label),
      },
      ...category.children.map((child) => ({
        id: child.slug,
        label: formatLabel(child.label),
        products: allProducts.filter((product) => product.categories.includes(child.label)),
        brandLabel: `${formatLabel(category.label)} · ${formatLabel(child.label)}`,
        filterBy:
          normalizeLabel(child.label) === "marcas premium"
            ? ("brand" as const)
            : ("collection" as const),
      })),
    ],
  }));

function TiendaContent() {
  const searchParams = useSearchParams();
  const defaultCategoryId =
    categories.find((category) => category.id === "lentes-de-sol")?.id ?? categories[0]?.id ?? "";
  const initialCat =
    searchParams.get("cat") === "relojes"
      ? categories.find((category) => category.id === "relojes")?.id ?? defaultCategoryId
      : defaultCategoryId;

  const [activeCat, setActiveCat] = useState(initialCat);
  const [activeSub, setActiveSub] = useState("todos");

  const currentCategory = categories.find((c) => c.id === activeCat) ?? categories[0];
  const currentSub =
    currentCategory?.subcategories.find((s) => s.id === activeSub) ??
    currentCategory?.subcategories[0];

  function handleCatChange(catId: string) {
    setActiveCat(catId);
    const cat = categories.find((c) => c.id === catId)!;
    setActiveSub(cat.subcategories[0].id);
  }

  if (!currentCategory || !currentSub) {
    return null;
  }

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-[#f0ece4]">
      {/* Inspiracional - featured products carousel */}
      <BrandCarousel
        key={`carousel-${currentSub.id}`}
        products={currentSub.products}
        brand={currentSub.brandLabel}
        showNav={false}
      />

      <TrustHighlights />

      {/* Main category tabs */}
      <div className="sticky top-[72px] z-20 border-b border-white/8 bg-[#0a0a0a]/95 px-6 backdrop-blur-md md:top-[80px] md:px-12">
        <div className="mx-auto max-w-7xl">
          <div className="flex">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => handleCatChange(cat.id)}
                className="relative cursor-pointer px-6 py-5 text-[11px] uppercase tracking-[0.28em] transition-colors"
                style={{ color: activeCat === cat.id ? "#f0ece4" : "#6a6560" }}
              >
                {cat.label}
                {activeCat === cat.id && (
                  <span
                    className="absolute bottom-0 left-0 right-0 h-px"
                    style={{ background: ACCENT }}
                  />
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Subcategory tabs */}
      <div className="border-b border-white/6 bg-[#0a0a0a] px-6 md:px-12">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-wrap">
            {currentCategory.subcategories.map((sub) => (
              <button
                key={sub.id}
                onClick={() => setActiveSub(sub.id)}
                className="cursor-pointer px-5 py-4 text-[10px] uppercase tracking-[0.24em] transition-colors"
                style={{ color: activeSub === sub.id ? ACCENT : "#6a6560" }}
              >
                {sub.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Product grid - key forces remount on subcategory change (resets filters) */}
      <ProductGrid
        key={`grid-${currentSub.id}`}
        products={currentSub.products}
        brandLabel={currentSub.brandLabel}
        filterBy={currentSub.filterBy}
        searchProducts={allProducts}
      />
    </main>
  );
}

export default function TiendaClient() {
  return (
    <Suspense>
      <TiendaContent />
    </Suspense>
  );
}
