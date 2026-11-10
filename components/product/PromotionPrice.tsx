import { formatPrice } from "@/lib/format";
import type { Promotion } from "@/lib/storefront.mjs";

const SIZES = {
  sm: { price: "text-[11px]", badge: "text-[9px]" },
  md: { price: "text-sm", badge: "text-[10px]" },
} as const;

/**
 * What a promotion adds next to the price it explains: the regular price,
 * struck through and read out as "Precio anterior", and the percent off,
 * rounded down (lib/storefront.mjs getPromotion). Render it only on
 * promotion; `className` sets its display and spacing ("flex", "inline-flex").
 */
export default function PromotionPrice({
  promotion,
  size = "sm",
  className = "inline-flex",
}: {
  promotion: Promotion;
  size?: keyof typeof SIZES;
  className?: string;
}) {
  const sizes = SIZES[size];
  return (
    <span className={`items-center gap-2 tracking-normal ${className}`}>
      <s className={`${sizes.price} text-[#8b8580]`}>
        <span className="sr-only">Precio anterior: </span>
        {formatPrice(promotion.regularPrice)}
      </s>
      {promotion.discountPercent > 0 && (
        <span
          className={`${sizes.badge} rounded-full bg-[#c9a96e] px-1.5 py-px font-semibold leading-tight text-[#0a0a0a]`}
        >
          <span aria-hidden="true">-{promotion.discountPercent}%</span>
          <span className="sr-only">{promotion.discountPercent}% de descuento</span>
        </span>
      )}
    </span>
  );
}
