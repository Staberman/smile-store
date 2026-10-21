"use client";

import { useState } from "react";
import type { CatalogProduct, CatalogVariant } from "@/lib/catalog";

type Props = {
  product: Pick<CatalogProduct, "tiendanubeProductId">;
  variant: Pick<CatalogVariant, "id" | "available" | "stock"> | null;
  disabled?: boolean;
  label?: string;
  className?: string;
};

const BASE_BUTTON_CLASSES =
  "flex w-full items-center justify-center gap-2 rounded-full py-4 text-[11px] font-medium uppercase tracking-[0.26em] transition-all duration-300 disabled:cursor-not-allowed disabled:opacity-35";

export default function TiendanubeCheckoutForm({
  product,
  variant,
  disabled = false,
  label = "Comprar ahora",
  className = "",
}: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canBuy =
    !disabled &&
    product.tiendanubeProductId !== null &&
    variant !== null &&
    variant.available &&
    variant.stock > 0;

  const handleClick = async () => {
    if (!canBuy || loading || !variant?.id) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/checkout/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ variantId: variant.id }),
      });

      if (!res.ok) {
        throw new Error("checkout_failed");
      }

      const data = await res.json();

      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
        throw new Error("no_checkout_url");
      }
    } catch {
      setError("No pudimos iniciar la compra. Probá de nuevo.");
      setLoading(false);
    }
  };

  return (
    <div className={className}>
      <button
        type="button"
        disabled={!canBuy || loading}
        onClick={handleClick}
        className={BASE_BUTTON_CLASSES}
        style={{
          background: canBuy ? "#c9a96e" : "#c9a96e18",
          color: canBuy ? "#0a0a0a" : "#c9a96e",
          border: "1px solid #c9a96e40",
        }}
      >
        {loading ? "Redirigiendo..." : canBuy ? label : "Sin stock"}
      </button>

      {error && (
        <p className="mt-3 text-xs text-[#e07a6a]" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
