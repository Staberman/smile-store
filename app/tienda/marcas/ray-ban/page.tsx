import type { Metadata } from "next";
import BrandCarousel from "@/components/brand/BrandCarousel";
import ProductGrid from "@/components/brand/ProductGrid";
import CollectionLinks from "@/components/brand/CollectionLinks";
import { raybanProducts } from "@/lib/products";

export const metadata: Metadata = {
  title: "Ray-Ban | Smile",
  description:
    "Descubre la colección completa de lentes Ray-Ban en Smile. Aviador, Wayfarer, Clubmaster, Round y la exclusiva Scuderia Ferrari Collection.",
};

export default function RayBanPage() {
  return (
    <main className="bg-[#0a0a0a]">
      <BrandCarousel
        products={raybanProducts}
        brand="Ray-Ban"
      />

      {/* Ferrari sub-collection callout */}
      <section className="border-b border-white/6 bg-[#0a0a0a] px-6 py-16 text-[#f0ece4] md:px-12">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-[9px] uppercase tracking-[0.44em] text-[#c9a96e]">
              Sub-colección especial
            </p>
            <h3 className="font-display mt-3 text-[1.8rem] font-light italic md:text-[2.4rem]">
              Scuderia Ferrari Collection
            </h3>
            <p className="mt-3 max-w-lg text-sm leading-[1.8] text-[#4a4540]">
              La línea de colaboración entre Ray-Ban y Scuderia Ferrari combina el diseño
              óptico de Ray-Ban con la estética de la escudería de Fórmula 1 más icónica
              del mundo. Piezas únicas con identidad propia.
            </p>
          </div>
          <a
            href="/tienda/marcas/ray-ban/ferrari"
            className="inline-flex shrink-0 cursor-pointer items-center gap-3 rounded-full border px-6 py-3 text-[10px] uppercase tracking-[0.24em] text-[#f0ece4] transition hover:border-[#c9a96e] hover:bg-[#c9a96e] hover:text-[#0a0a0a]"
            style={{ borderColor: "#2a2520" }}
          >
            Ver Ferrari Collection →
          </a>
        </div>
      </section>

      <ProductGrid products={raybanProducts} brandLabel="Colección Ray-Ban" />
      <CollectionLinks current="ray-ban" />
    </main>
  );
}
