import type { Metadata } from "next";
import Link from "next/link";
import CollectionLinks from "@/components/brand/CollectionLinks";

export const metadata: Metadata = {
  title: "Marcas Premium",
  description:
    "Prada, Dior, Versace, Gucci, Balenciaga, Louis Vuitton, Saint Laurent, Fendi, Cartier, Dolce&Gabbana y Celine — lentes de sol premium en Smile.",
};

const ACCENT = "#c9a96e";

const BRANDS = [
  {
    slug: "prada",
    name: "Prada",
    tagline: "Symbole de la maison.",
    origin: "Milano",
    color: "#1a1a1a",
  },
  {
    slug: "christian-dior",
    name: "Christian Dior",
    tagline: "Élégance parisienne.",
    origin: "Paris",
    color: "#1a1610",
  },
  {
    slug: "versace",
    name: "Versace",
    tagline: "Audacia sin límites.",
    origin: "Milano",
    color: "#0f1a10",
  },
  {
    slug: "gucci",
    name: "Gucci",
    tagline: "La casa florentina.",
    origin: "Firenze",
    color: "#100e18",
  },
  {
    slug: "balenciaga",
    name: "Balenciaga",
    tagline: "Editorial. Futuro. Ahora.",
    origin: "Paris",
    color: "#0a0a14",
  },
  {
    slug: "louis-vuitton",
    name: "Louis Vuitton",
    tagline: "El arte de viajar con estilo.",
    origin: "Paris",
    color: "#14100a",
  },
  {
    slug: "saint-laurent",
    name: "Saint Laurent",
    tagline: "Rock & élégance.",
    origin: "Paris",
    color: "#100a0a",
  },
  {
    slug: "fendi",
    name: "Fendi",
    tagline: "La doble F romana.",
    origin: "Roma",
    color: "#0a100e",
  },
  {
    slug: "cartier",
    name: "Cartier",
    tagline: "La joyería del eyewear.",
    origin: "Paris",
    color: "#14080a",
  },
  {
    slug: "dolce-gabbana",
    name: "Dolce&Gabbana",
    tagline: "El mediterráneo hecho moda.",
    origin: "Milano",
    color: "#100a14",
  },
  {
    slug: "celine",
    name: "Celine",
    tagline: "Minimalismo parisino.",
    origin: "Paris",
    color: "#0e0e0e",
  },
];

export default function MarcasPremiumPage() {
  return (
    <main className="min-h-screen bg-[#0a0a0a] text-[#f0ece4]">
      {/* Hero */}
      <section className="relative border-b border-white/6 px-6 pb-20 pt-16 md:px-12">
        <div className="mx-auto max-w-7xl">
          <p className="text-[9px] uppercase tracking-[0.5em]" style={{ color: ACCENT }}>
            Sub-colección premium
          </p>
          <h1 className="font-display mt-4 text-[2.8rem] font-light italic leading-[1.05] md:text-[4rem]">
            Marcas Premium
          </h1>
          <p className="mt-4 max-w-xl text-sm leading-[1.9] text-[#4a4540]">
            Las grandes maisons del eyewear de lujo, reunidas en una sola experiencia.
            Piezas importadas con cristal mineral UV400, acetato premium y el sello de cada casa.
          </p>
        </div>
      </section>

      {/* Brand grid */}
      <section className="px-6 py-16 md:px-12">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {BRANDS.map((brand) => (
              <Link
                key={brand.slug}
                href={`/tienda/marcas/premium/${brand.slug}`}
                className="group relative overflow-hidden rounded-2xl border border-white/8 transition-all duration-500 hover:border-white/20"
                style={{ background: brand.color }}
              >
                <div className="p-8 pb-10">
                  <p
                    className="text-[8px] uppercase tracking-[0.4em] transition-colors duration-300"
                    style={{ color: "#4a4540" }}
                  >
                    {brand.origin}
                  </p>
                  <h2
                    className="font-display mt-3 text-[1.4rem] font-light italic leading-tight"
                    style={{ color: "#f0ece4" }}
                  >
                    {brand.name}
                  </h2>
                  <p className="mt-2 text-[11px] leading-[1.7] text-[#4a4540]">
                    {brand.tagline}
                  </p>

                  <div
                    className="mt-6 inline-flex items-center gap-2 text-[9px] uppercase tracking-[0.3em] transition-all duration-300 group-hover:gap-3"
                    style={{ color: ACCENT }}
                  >
                    Ver colección
                    <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
                  </div>
                </div>

                {/* Shimmer on hover */}
                <div className="pointer-events-none absolute inset-y-0 -left-1/2 w-1/2 rotate-12 bg-white/5 opacity-0 blur-xl transition-all duration-700 group-hover:left-[120%] group-hover:opacity-100" />
              </Link>
            ))}
          </div>
        </div>
      </section>

      <CollectionLinks current="premium" />
    </main>
  );
}
