"use client";

import { useState } from "react";
import type { CatalogProduct } from "@/lib/catalog";
import { isWatch } from "@/lib/storefront.mjs";

const FALLBACK =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='600' height='600'%3E%3Crect width='600' height='600' fill='%23181410'/%3E%3Ctext x='300' y='300' text-anchor='middle' fill='%23c9a96e' font-family='Arial' font-size='44'%3ESMILE%3C/text%3E%3C/svg%3E";

type Props = {
  product: CatalogProduct;
  src: string | null | undefined;
  hovered?: boolean;
};

export default function ProductMedia({ product, src, hovered = false }: Props) {
  const [failed, setFailed] = useState(false);
  const watch = isWatch(product);

  return (
    <div className="relative h-44 w-44 overflow-hidden rounded-full border border-[#c9a96e]/20 bg-[#e9e6df] shadow-[0_0_0_10px_rgba(201,169,110,0.04),0_26px_70px_rgba(0,0,0,0.45)] sm:h-48 sm:w-48">
      <img
        src={failed || !src ? FALLBACK : src}
        alt={product.name}
        loading="lazy"
        className={`h-full w-full rounded-full transition-transform duration-300 ${
          watch ? "object-contain p-4" : "object-cover"
        }`}
        style={{
          transform: watch
            ? hovered
              ? "scale(1.02)"
              : "scale(0.96)"
            : hovered
              ? "scale(1.08)"
              : "scale(1.02)",
          objectPosition: "center",
          filter: "brightness(0.96) contrast(1.03)",
        }}
        onError={() => setFailed(true)}
      />
    </div>
  );
}

