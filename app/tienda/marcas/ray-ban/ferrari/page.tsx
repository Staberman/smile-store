import type { Metadata } from "next";
import ProductGrid from "@/components/brand/ProductGrid";
import CollectionLinks from "@/components/brand/CollectionLinks";
import { raybanProducts } from "@/lib/products";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Scuderia Ferrari Collection | Ray-Ban | Smile",
  description:
    "La colaboración entre Ray-Ban y Scuderia Ferrari. Lentes de sol exclusivos con diseño inspirado en la Fórmula 1. Disponibles en Smile Argentina.",
};

const ACCENT = "#c9a96e";
const ferrariRed = "#dc0000";

const ferrariProducts = raybanProducts.filter(
  (p) => p.subcollection === "ferrari"
);

export default function FerrariPage() {
  return (
    <main className="bg-[#0a0a0a]">
      {/* Hero header */}
      <section className="relative overflow-hidden bg-[#0a0a0a] px-6 pb-16 pt-36 text-[#f0ece4] md:px-12 md:pt-44">
        {/* Subtle red glow */}
        <div
          className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2"
          style={{
            width: "600px",
            height: "300px",
            background: `radial-gradient(ellipse at 50% 0%, ${ferrariRed}18 0%, transparent 70%)`,
          }}
        />

        {/* Breadcrumb */}
        <div className="mx-auto max-w-7xl">
          <nav className="mb-10 flex items-center gap-2 text-[9px] uppercase tracking-[0.3em] text-[#4a4540]">
            <Link href="/tienda" className="transition hover:text-[#f0ece4]">
              Tienda
            </Link>
            <span>/</span>
            <Link
              href="/tienda/marcas/ray-ban"
              className="transition hover:text-[#f0ece4]"
            >
              Ray-Ban
            </Link>
            <span>/</span>
            <span style={{ color: ferrariRed }}>Ferrari Collection</span>
          </nav>

          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div>
              {/* Ferrari prancing horse-inspired decorative mark */}
              <div className="mb-4 flex items-center gap-3">
                <div
                  className="h-0.5 w-8"
                  style={{ background: ferrariRed }}
                />
                <p
                  className="text-[9px] uppercase tracking-[0.5em]"
                  style={{ color: ferrariRed }}
                >
                  Scuderia Ferrari Collection
                </p>
              </div>
              <h1 className="font-display text-[2.8rem] font-light italic leading-[1.05] md:text-[3.8rem]">
                Ray-Ban
                <br />
                <span style={{ color: ACCENT }}>Ferrari</span>
              </h1>
              <p className="mt-4 max-w-lg text-sm leading-[1.9] text-[#4a4540]">
                La colaboración entre dos íconos del diseño y la velocidad. Cada
                pieza lleva la identidad visual de la Scuderia Ferrari —
                tecnología de Fórmula 1 fusionada con el estilo inconfundible de
                Ray-Ban.
              </p>
            </div>

            <div className="flex shrink-0 flex-col items-start gap-2 md:items-end">
              <p className="text-[9px] uppercase tracking-[0.3em] text-[#4a4540]">
                Colección disponible
              </p>
              <p
                className="font-display text-3xl font-light"
                style={{ color: ACCENT }}
              >
                {ferrariProducts.length} modelos
              </p>
            </div>
          </div>

          {/* Divider */}
          <div className="mt-12 flex items-center gap-4">
            <div className="h-px flex-1 bg-white/6" />
            <div
              className="h-1 w-1 rounded-full"
              style={{ background: ferrariRed }}
            />
            <div className="h-px flex-1 bg-white/6" />
          </div>
        </div>
      </section>

      {/* Product grid */}
      <ProductGrid
        products={ferrariProducts}
        brandLabel="Ferrari Collection"
      />

      {/* Collection links */}
      <CollectionLinks current="ferrari" />
    </main>
  );
}
