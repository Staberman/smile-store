import Link from "next/link";

const ACCENT = "#c9a96e";

const COLLECTIONS = [
  {
    slug: "anteojos-de-sol",
    label: "Anteojos de sol",
    sub: "Todas las marcas",
    href: "/tienda/anteojos-de-sol",
  },
  {
    slug: "ray-ban",
    label: "Ray-Ban",
    sub: "Lentes de sol",
    href: "/tienda/marcas/ray-ban",
  },
  {
    slug: "premium",
    label: "Marcas Premium",
    sub: "Lentes de sol · 11 maisons",
    href: "/tienda/marcas/premium",
  },
  {
    slug: "ferrari",
    label: "Ferrari Collection",
    sub: "Ray-Ban × Scuderia Ferrari",
    href: "/tienda/marcas/ray-ban/ferrari",
  },
  {
    slug: "invicta",
    label: "Invicta",
    sub: "Relojes",
    href: "/tienda/marcas/invicta",
  },
  {
    slug: "omega-swatch",
    label: "Omega × Swatch",
    sub: "Relojes · MoonSwatch",
    href: "/tienda/relojes/omega-swatch",
  },
  {
    slug: "tommy-hilfiger",
    label: "Tommy Hilfiger",
    sub: "Relojes",
    href: "/tienda/marcas/tommy-hilfiger",
  },
];

interface Props {
  current?: string; // slug of the current brand/sub-page to exclude
}

export default function CollectionLinks({ current }: Props) {
  const visible = COLLECTIONS.filter((c) => c.slug !== current);

  return (
    <section className="border-t border-white/6 bg-[#0a0a0a] px-6 py-16 text-[#f0ece4] md:px-12">
      <div className="mx-auto max-w-7xl">
        <p className="mb-10 text-[10px] uppercase tracking-[0.44em] text-[#4a4540]">
          Explorar colecciones
        </p>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((col) => (
            <Link
              key={col.slug}
              href={col.href}
              className="group flex cursor-pointer items-center justify-between rounded-2xl border border-white/8 bg-white/[0.02] px-6 py-5 transition-all duration-300 hover:border-white/20 hover:bg-white/[0.05]"
            >
              <div>
                <p className="text-[9px] uppercase tracking-[0.3em] text-[#4a4540]">
                  {col.sub}
                </p>
                <h3
                  className="font-display mt-1 text-lg font-light italic"
                  style={{ color: "#f0ece4" }}
                >
                  {col.label}
                </h3>
              </div>
              <span
                className="ml-4 shrink-0 text-lg transition-transform duration-300 group-hover:translate-x-1"
                style={{ color: ACCENT }}
              >
                →
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
