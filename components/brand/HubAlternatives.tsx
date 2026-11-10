import Link from "next/link";
import PromotionPrice from "@/components/product/PromotionPrice";
import type { CatalogProduct } from "@/lib/catalog";
import { formatPrice } from "@/lib/format";
import { displayProductName } from "@/lib/product-name";
import { getPromotion } from "@/lib/storefront.mjs";

/**
 * In-stock products of the parent section, shown while a hub has few of its
 * own in stock (lib/collection-hubs.mjs, hubAlternatives). Small text links,
 * not product cards, so the page stays light. Renders nothing without products.
 */
export default function HubAlternatives({
  title,
  products,
  moreHref,
  moreLabel,
}: {
  title: string;
  products: CatalogProduct[];
  moreHref: string;
  moreLabel: string;
}) {
  if (products.length === 0) return null;

  return (
    <section className="border-t border-white/6 bg-[#0a0a0a] px-6 py-12 text-[#f0ece4] md:px-12 md:py-16">
      <div className="mx-auto max-w-7xl">
        <p className="text-[10px] uppercase tracking-[0.42em] text-[#4a4540]">Con stock</p>
        <h2 className="font-display mt-2 text-xl font-light italic md:text-2xl">{title}</h2>
        <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {products.map((product) => {
            const promotion = getPromotion(product);
            return (
              <li key={product.slug}>
                <Link
                  href={`/tienda/productos/${product.slug}`}
                  prefetch={false}
                  className="flex h-full flex-col justify-between rounded-2xl border border-white/8 bg-white/[0.02] px-5 py-4 transition hover:border-white/20 hover:bg-white/[0.05]"
                >
                  <span className="text-sm text-[#f0ece4]">
                    {displayProductName(product.name, product.brand)}
                  </span>
                  <span className="mt-2 text-[12px] text-[#8b8580]">
                    {formatPrice(product.promotionalPrice ?? product.price)}
                    {promotion && <PromotionPrice promotion={promotion} className="ml-2 inline-flex" />}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
        <Link
          href={moreHref}
          className="mt-6 inline-flex min-h-11 items-center text-[10px] uppercase tracking-[0.24em] text-[#c9a96e] transition hover:text-[#e2c989]"
        >
          {moreLabel} →
        </Link>
      </div>
    </section>
  );
}
