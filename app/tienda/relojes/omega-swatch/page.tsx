import BrandCarousel from "@/components/brand/BrandCarousel";
import ProductGrid from "@/components/brand/ProductGrid";
import CollectionLinks from "@/components/brand/CollectionLinks";
import HubHeader from "@/components/brand/HubHeader";
import OutOfStockProducts from "@/components/brand/OutOfStockProducts";
import Breadcrumbs from "@/components/layout/Breadcrumbs";
import JsonLd from "@/components/seo/JsonLd";
import { allProducts, outOfStockProducts, type CatalogProduct } from "@/lib/catalog";
import { COLLECTION_TRAILS } from "@/lib/collections";
import { hubDescription, hubIntro, modelHighlight } from "@/lib/hubs";
import { toProductSummaries } from "@/lib/product-summary";
import { collectionSchema, pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Relojes OMEGA x Swatch MoonSwatch en Argentina",
  description: hubDescription([
    "Relojes OMEGA x Swatch MoonSwatch originales en Argentina, con caja de Bioceramic: Mission to the Moon, Mission to Mars y más.",
    "Relojes OMEGA x Swatch MoonSwatch originales en Argentina, con caja de Bioceramic.",
    "Relojes OMEGA x Swatch MoonSwatch originales en Argentina.",
  ]),
  path: "/tienda/relojes/omega-swatch",
});

const ACCENT = "#c9a96e";

const isOmegaSwatchProduct = (product: CatalogProduct) => product.brand === "OMEGA x Swatch";
const omegaSwatchProducts = allProducts.filter(isOmegaSwatchProduct);
const omegaSwatchOutOfStock = outOfStockProducts.filter(isOmegaSwatchProduct);
const omegaSwatchSchema = collectionSchema(
  "/tienda/relojes/omega-swatch",
  "Omega × Swatch MoonSwatch",
  omegaSwatchProducts,
  COLLECTION_TRAILS["omega-swatch"],
);

const omegaSwatchSummaries = toProductSummaries(omegaSwatchProducts);
const intro = hubIntro({
  subject: "relojes OMEGA x Swatch",
  products: omegaSwatchProducts,
  outOfStock: omegaSwatchOutOfStock,
  highlight: modelHighlight(omegaSwatchProducts),
});

export default function OmegaSwatchPage() {
  return (
    <main className="bg-[#0a0a0a]">
      <JsonLd data={omegaSwatchSchema} />
      <Breadcrumbs trail={COLLECTION_TRAILS["omega-swatch"]} />
      <HubHeader
        eyebrow="Relojes"
        title="Relojes OMEGA x Swatch MoonSwatch"
        intro={intro}
      />
      <BrandCarousel products={omegaSwatchSummaries} brand="Omega × Swatch" showNav={false} />

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

      <ProductGrid products={omegaSwatchSummaries} brandLabel="Omega × Swatch MoonSwatch" />
      <OutOfStockProducts products={omegaSwatchOutOfStock} />
      <CollectionLinks current="omega-swatch" />
    </main>
  );
}
