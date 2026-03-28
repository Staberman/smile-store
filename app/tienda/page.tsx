"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import ProductGrid from "@/components/brand/ProductGrid";
import BrandCarousel from "@/components/brand/BrandCarousel";
import {
  raybanProducts,
  invictaProducts,
  tommyProducts,
  premiumSunglassesProducts,
  omegaSwatchProducts,
} from "@/lib/products";

const ferrariProducts = raybanProducts.filter((p) => p.subcollection === "ferrari");
const raybanOnlyProducts = raybanProducts.filter((p) => p.subcollection !== "ferrari");

const ACCENT = "#c9a96e";

const categories = [
  {
    id: "lentes",
    label: "Lentes de Sol",
    subcategories: [
      { id: "ray-ban", label: "Ray-Ban", products: raybanOnlyProducts, brandLabel: "Ray-Ban" },
      { id: "premium", label: "Marcas Premium", products: premiumSunglassesProducts, brandLabel: "Marcas Premium", filterBy: "brand" as const },
      {
        id: "ferrari",
        label: "Ray-Ban Scuderia Ferrari",
        products: ferrariProducts,
        brandLabel: "Ray-Ban × Scuderia Ferrari Collection",
      },
    ],
  },
  {
    id: "relojes",
    label: "Relojes",
    subcategories: [
      { id: "invicta", label: "Invicta", products: invictaProducts, brandLabel: "Invicta" },
      { id: "tommy", label: "Tommy Hilfiger", products: tommyProducts, brandLabel: "Tommy Hilfiger" },
      { id: "omega", label: "Omega × Swatch", products: omegaSwatchProducts, brandLabel: "Omega × Swatch" },
    ],
  },
];

function TiendaContent() {
  const searchParams = useSearchParams();
  const initialCat = searchParams.get("cat") === "relojes" ? "relojes" : "lentes";

  const [activeCat, setActiveCat] = useState(initialCat);
  const [activeSub, setActiveSub] = useState(
    initialCat === "relojes" ? "invicta" : "ray-ban"
  );

  const currentCategory = categories.find((c) => c.id === activeCat)!;
  const currentSub =
    currentCategory.subcategories.find((s) => s.id === activeSub) ??
    currentCategory.subcategories[0];

  function handleCatChange(catId: string) {
    setActiveCat(catId);
    const cat = categories.find((c) => c.id === catId)!;
    setActiveSub(cat.subcategories[0].id);
  }

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-[#f0ece4]">
      {/* Inspiracional — featured products carousel */}
      <BrandCarousel
        key={`carousel-${currentSub.id}`}
        products={currentSub.products}
        brand={currentSub.brandLabel}
        showNav={false}
      />

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

      {/* Product grid — key forces remount on subcategory change (resets filters) */}
      <ProductGrid
        key={`grid-${currentSub.id}`}
        products={currentSub.products}
        brandLabel={currentSub.brandLabel}
        filterBy={currentSub.filterBy}
      />
    </main>
  );
}

export default function TiendaPage() {
  return (
    <Suspense>
      <TiendaContent />
    </Suspense>
  );
}
