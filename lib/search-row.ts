import { canonicalBrand } from "@/lib/brand-directory";
import type { ProductSummary } from "@/lib/product-summary";
import {
  defaultVariant,
  getDisplayPrice,
  getPromotion,
  isWatch,
  type Promotion,
} from "@/lib/storefront.mjs";

// Keep this module free of catalog imports: the site search overlay builds its
// result rows with it in the browser.

/**
 * A product as the site search lists it. The featured rows are built on the
 * server and ship with every page, so they stay this small.
 */
export type SearchRow = {
  slug: string;
  name: string;
  /** Canonical brand, as cards show it ("Ray-Ban"). */
  brand: string;
  /** What the product is: "Lentes de sol" or "Reloj". */
  kind: string;
  image: string | null;
  /** The price its card shows first; null when it has none. */
  price: number | null;
  /** Its regular price and discount while `price` is a promotional one; absent otherwise. */
  promotion?: Promotion;
  /** Watch photos are shown whole (object-contain), like on the cards. */
  watch: boolean;
  href: string;
};

/**
 * A product summary as a search row. Image and price are those of the variant
 * its card selects first (the first one in stock), like components/brand/ProductCard.tsx.
 */
export function toSearchRow(product: ProductSummary): SearchRow {
  const variant = defaultVariant(product);
  const watch = isWatch(product);
  const promotion = getPromotion(product, variant);
  return {
    slug: product.slug,
    name: product.name,
    brand: canonicalBrand(product.brand),
    kind: watch ? "Reloj" : "Lentes de sol",
    image: variant?.image ?? product.image,
    price: getDisplayPrice(product, variant),
    // Left out without a promotion: featured rows ship with every page.
    ...(promotion ? { promotion } : {}),
    watch,
    href: `/tienda/productos/${product.slug}`,
  };
}
