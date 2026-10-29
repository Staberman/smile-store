"use client";

import { useState } from "react";
import { pageview } from "@vercel/analytics";
import type { CatalogVariant } from "@/lib/catalog";
import type { ProductDetail } from "@/lib/product-summary";
import { buyEvent } from "@/lib/visitor-events.mjs";

type Props = {
  product: Pick<ProductDetail, "slug" | "tiendanubeProductId" | "storefrontUrl">;
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

    // Recorded before the checkout request. The analytics script posts it with
    // a keepalive fetch, which can outlive the redirect below.
    try {
      pageview(buyEvent(product.slug));
    } catch {
      // Analytics is best effort: it must never stop the purchase.
    }

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
      // Direct checkout depends on the Tiendanube API; the storefront product
      // page still lets the customer buy when that call fails.
      if (product.storefrontUrl) {
        window.location.href = product.storefrontUrl;
        return;
      }
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
