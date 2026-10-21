import Image from "next/image";
import Link from "next/link";
import { getAvailableBrandEntries } from "@/lib/brand-directory";
import type { ProductSummary } from "@/lib/product-summary";

export default function BrandLogoStrip({ products }: { products: ProductSummary[] }) {
  const groups = [
    { id: "lentes" as const, label: "Marcas de lentes" },
    { id: "relojes" as const, label: "Marcas de relojes" },
  ];

  return (
    <section className="border-y border-white/6 bg-[#0c0b0a] px-6 py-12 text-[#f0ece4] md:px-12 md:py-16">
      <div className="mx-auto max-w-7xl space-y-10">
        {groups.map((group) => {
          const entries = getAvailableBrandEntries(products, group.id);
          if (entries.length === 0) return null;

          return (
            <div key={group.id}>
              <div className="mb-5 flex items-center gap-4">
                <h2 className="shrink-0 text-[10px] uppercase tracking-[0.34em] text-[#c9a96e]">
                  {group.label}
                </h2>
                <span className="h-px flex-1 bg-white/8" />
              </div>

              <div className="scrollbar-none flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2 md:grid md:grid-cols-5 md:overflow-visible lg:grid-cols-6">
                {entries.map((entry) => (
                  <Link
                    key={`${group.id}-${entry.name}`}
                    href={entry.href}
                    className="group flex h-24 min-w-[10rem] snap-start items-center justify-center border border-white/8 bg-white/[0.025] px-5 transition-colors duration-200 hover:border-[#c9a96e]/45 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#c9a96e] md:min-w-0"
                    aria-label={`Ver productos ${entry.name}`}
                  >
                    {entry.image ? (
                      <Image
                        src={entry.image}
                        alt={entry.name}
                        width={150}
                        height={54}
                        className="max-h-12 w-auto max-w-[8rem] object-contain opacity-65 brightness-0 invert transition group-hover:opacity-100"
                      />
                    ) : (
                      <span className="text-center font-display text-lg tracking-[0.08em] text-[#b8b0a4] transition-colors group-hover:text-[#f0ece4]">
                        {entry.name}
                      </span>
                    )}
                  </Link>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
