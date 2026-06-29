import type { Metadata } from "next";
import BrandCarousel from "@/components/brand/BrandCarousel";
import ProductGrid from "@/components/brand/ProductGrid";
import CollectionLinks from "@/components/brand/CollectionLinks";
import { allProducts } from "@/lib/catalog";

export const metadata: Metadata = {
  title: "Omega × Swatch MoonSwatch",
  description:
    "La colaboración histórica entre Omega y Swatch. MoonSwatch Bioceramic — Mission to the Moon, Mars, Earth y más. Disponible en Smile.",
  alternates: { canonical: "/tienda/relojes/omega-swatch" },
};

const ACCENT = "#c9a96e";

const omegaSwatchProducts = allProducts.filter(
  (product) => product.brand === "OMEGA x Swatch"
);

export default function OmegaSwatchPage() {
  return (
    <main className="bg-[#0a0a0a]">
      <BrandCarousel products={omegaSwatchProducts} brand="Omega × Swatch" showNav={false} />

      {/* Collab callout */}
      <section className="border-b border-white/6 bg-[#0a0a0a] px-6 py-16 text-[#f0ece4] md:px-12">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-10 md:grid-cols-3">
            <div>
              <p className="text-[9px] uppercase tracking-[0.44em]" style={{ color: ACCENT }}>
                Tecnología
              </p>
              <h3 className="font-display mt-3 text-lg font-light italic">Bioceramic</h3>
              <p className="mt-2 text-sm leading-[1.8] text-[#4a4540]">
                Material desarrollado por Swatch con 2/3 de cerámica y 1/3 de biopolímero.
                Ultra resistente, hipoalergénico y de tacto premium.
              </p>
            </div>
            <div>
              <p className="text-[9px] uppercase tracking-[0.44em]" style={{ color: ACCENT }}>
                Herencia
              </p>
              <h3 className="font-display mt-3 text-lg font-light italic">Speedmaster DNA</h3>
              <p className="mt-2 text-sm leading-[1.8] text-[#4a4540]">
                Inspirado en el Omega Speedmaster Moonwatch, el reloj que acompañó
                a los astronautas en la Luna. Super-LumiNova y cronógrafo integrado.
              </p>
            </div>
            <div>
              <p className="text-[9px] uppercase tracking-[0.44em]" style={{ color: ACCENT }}>
                Colección
              </p>
              <h3 className="font-display mt-3 text-lg font-light italic">11 Planetas</h3>
              <p className="mt-2 text-sm leading-[1.8] text-[#4a4540]">
                Cada modelo del sistema solar tiene su propio color y personalidad.
                Correa VELCRO intercambiable y esfera inspirada en la astronomía.
              </p>
            </div>
          </div>
        </div>
      </section>

      <ProductGrid products={omegaSwatchProducts} brandLabel="Omega × Swatch MoonSwatch" />
      <CollectionLinks current="omega-swatch" />
    </main>
  );
}
