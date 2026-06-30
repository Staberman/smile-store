import type { CatalogProduct, CatalogVariant } from "@/lib/catalog";

type Props = {
  product: CatalogProduct;
  variant: CatalogVariant | null;
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
  const canBuy =
    !disabled &&
    product.tiendanubeProductId !== null &&
    variant !== null &&
    variant.available &&
    variant.stock > 0;

  return (
    <form
      method="post"
      action="/api/checkout/tiendanube"
      className={className}
    >
      <input type="hidden" name="slug" value={product.slug} />
      <input type="hidden" name="variantId" value={variant?.id ?? ""} />
      <button
        type="submit"
        disabled={!canBuy}
        className={BASE_BUTTON_CLASSES}
        style={{
          background: canBuy ? "#c9a96e" : "#c9a96e18",
          color: canBuy ? "#0a0a0a" : "#c9a96e",
          border: "1px solid #c9a96e40",
        }}
      >
        {canBuy ? label : "Sin stock"}
      </button>
    </form>
  );
}
