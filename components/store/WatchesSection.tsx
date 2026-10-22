import Link from "next/link";
import ProductCard from "@/components/brand/ProductCard";
import { canonicalBrand } from "@/lib/brand-directory";
import type { ProductSummary } from "@/lib/product-summary";
import { isWatch } from "@/lib/storefront.mjs";

const FEATURED_WATCH_COUNT = 8;

/** Up to `count` watches, taking one per brand in turn so no brand fills the row. */
export function featuredWatches(
  products: ProductSummary[],
  count = FEATURED_WATCH_COUNT,
): ProductSummary[] {
  const queues = new Map<string, ProductSummary[]>();
  for (const product of products.filter(isWatch)) {
    const brand = canonicalBrand(product.brand);
    queues.set(brand, [...(queues.get(brand) ?? []), product]);
  }

  const picked: ProductSummary[] = [];
  for (let round = 0; picked.length < count; round++) {
    const roundPicks = [...queues.values()].flatMap((queue) => queue[round] ?? []);
    if (roundPicks.length === 0) break;
    picked.push(...roundPicks.slice(0, count - picked.length));
  }
  return picked;
}

/**
 * Server-rendered watch showcase for the homepage, below the main catalog.
 * `products` must be the purchasable catalog summaries the page builds the
 * catalog preview from: the preview pins the featured watches, so the RSC
 * payload references the same objects instead of repeating them.
 */
export default function WatchesSection({ products }: { products: ProductSummary[] }) {
  const watches = featuredWatches(products);
  if (watches.length === 0) return null;

  const brands = new Intl.ListFormat("es", { type: "conjunction" }).format(
    Array.from(new Set(products.filter(isWatch).map((product) => canonicalBrand(product.brand)))),
  );

  return (
    <section
      aria-labelledby="relojes-destacados"
      className="border-t border-white/6 bg-[#0a0a0a] px-6 py-20 text-[#f0ece4] md:px-12 md:py-28"
    >
      <div className="mx-auto max-w-7xl">
        <div className="mb-10 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-[0.42em] text-[#4a4540]">Relojes</p>
            <h2
              id="relojes-destacados"
              className="font-display mt-2 text-[2rem] font-light italic"
            >
              Relojes originales
            </h2>
            <p className="mt-3 max-w-xl text-sm leading-[1.8] text-[#8b8580]">
              {brands} con stock disponible.
            </p>
          </div>

          <Link
            href="/tienda/relojes"
            className="inline-flex min-h-11 shrink-0 items-center gap-3 self-start rounded-full border border-[#2a2520] px-6 text-[10px] uppercase tracking-[0.24em] text-[#f0ece4] transition hover:border-[#c9a96e] hover:bg-[#c9a96e] hover:text-[#0a0a0a] md:self-auto"
          >
            Ver todos los relojes <span aria-hidden="true">→</span>
          </Link>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {watches.map((product) => (
            <ProductCard
              key={product.slug}
              product={product}
              collectionLabel={product.categories[product.categories.length - 1] ?? product.brand}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
