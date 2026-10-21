"use client";

import Image from "next/image";
import Link from "next/link";
import { canonicalBrand } from "@/lib/brand-directory";
import {
  formatArs,
  snapshotPrice,
  useRecentlyViewed,
  type ProductSnapshot,
} from "@/lib/browser-lists";

const IMAGE_FALLBACK =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='600' height='600'%3E%3Crect width='600' height='600' fill='%23181410'/%3E%3Ctext x='300' y='300' text-anchor='middle' fill='%23c9a96e' font-family='Arial' font-size='44'%3ESMILE%3C/text%3E%3C/svg%3E";

type Props = {
  /** Hide this slug (e.g. the current product on its own PDP). */
  excludeSlug?: string;
  heading?: string;
  className?: string;
};

/**
 * Horizontal snap-scroll strip of recently-viewed products, rendered straight
 * from localStorage snapshots. Returns null until mounted and whenever there is
 * nothing to show, so it never causes a hydration mismatch or an empty section.
 */
export default function RecentlyViewed({
  excludeSlug,
  heading = "Vistos recientemente",
  className = "",
}: Props) {
  const { items, mounted } = useRecentlyViewed();
  const visible = items.filter((item) => item.slug !== excludeSlug);

  if (!mounted || visible.length === 0) return null;

  return (
    <section
      className={`bg-[#0a0a0a] px-6 py-14 text-[#f0ece4] md:px-12 md:py-16 ${className}`}
    >
      <div className="mx-auto max-w-7xl">
        <div className="mb-6">
          <p className="text-[9px] uppercase tracking-[0.44em] text-[#4a4540]">
            Tu recorrido
          </p>
          <h2 className="font-display mt-2 text-[1.8rem] font-light italic">
            {heading}
          </h2>
        </div>

        <div
          className="smile-rv-scroll -mx-1 flex snap-x snap-mandatory gap-4 overflow-x-auto px-1 pb-2"
          style={{ scrollbarWidth: "none" }}
        >
          {visible.map((item) => (
            <RecentCard key={item.slug} item={item} />
          ))}
        </div>
        <style>{`.smile-rv-scroll::-webkit-scrollbar{display:none}`}</style>
      </div>
    </section>
  );
}

function RecentCard({ item }: { item: ProductSnapshot }) {
  const price = snapshotPrice(item);

  return (
    <Link
      href={item.href}
      className="group relative w-40 shrink-0 snap-start overflow-hidden rounded-[1.2rem] border border-white/8 bg-white/[0.025] transition-all duration-300 hover:-translate-y-1 hover:border-[#c9a96e]/45 sm:w-44"
    >
      <div className="relative flex h-40 items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_center,rgba(201,169,110,0.12),rgba(18,16,16,0)_62%)]">
        <div className="relative h-28 w-28 overflow-hidden rounded-full border border-[#c9a96e]/20 bg-[#e9e6df]">
          <Image
            src={item.image || IMAGE_FALLBACK}
            alt={item.name}
            fill
            sizes="112px"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            style={{ filter: "brightness(0.96) contrast(1.03)" }}
          />
        </div>
      </div>
      <div className="p-4">
        <p className="text-[9px] uppercase tracking-[0.28em] text-[#8b8580]">
          {canonicalBrand(item.brand)}
        </p>
        <h3 className="mt-1 line-clamp-2 min-h-[2.2rem] text-xs font-medium leading-tight text-[#f0ece4]">
          {item.name}
        </h3>
        <p className="mt-2 text-[13px]" style={{ color: "#c9a96e" }}>
          {formatArs(price)}
        </p>
      </div>
    </Link>
  );
}
