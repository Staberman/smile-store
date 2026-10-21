import ProductGrid from "@/components/brand/ProductGrid";
import CollectionLinks from "@/components/brand/CollectionLinks";
import OutOfStockProducts from "@/components/brand/OutOfStockProducts";
import Breadcrumbs from "@/components/layout/Breadcrumbs";
import JsonLd from "@/components/seo/JsonLd";
import { allProducts, outOfStockProducts, type CatalogProduct } from "@/lib/catalog";
import { COLLECTION_TRAILS } from "@/lib/collections";
import { hubDescription, hubIntro, nameLineHighlight } from "@/lib/hubs";
import { toProductSummaries } from "@/lib/product-summary";
import { collectionSchema, pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Anteojos Ray-Ban Scuderia Ferrari en Argentina",
  description: hubDescription([
    "Anteojos de sol Ray-Ban Scuderia Ferrari Collection originales en Argentina, con diseño inspirado en la Fórmula 1.",
    "Anteojos de sol Ray-Ban Scuderia Ferrari Collection originales en Argentina.",
  ]),
  path: "/tienda/marcas/ray-ban/ferrari",
});

const ACCENT = "#c9a96e";
const ferrariRed = "#dc0000";

const isFerrariProduct = (product: CatalogProduct) => {
  const values = [product.brand, ...product.categories, ...product.tags];
  return values.some((value) => value.toLowerCase().includes("ferrari"));
};
const ferrariProducts = allProducts.filter(isFerrariProduct);
const ferrariOutOfStock = outOfStockProducts.filter(isFerrariProduct);
const ferrariSchema = collectionSchema(
  "/tienda/marcas/ray-ban/ferrari",
  "Anteojos de sol Ray-Ban Scuderia Ferrari",
  ferrariProducts,
  COLLECTION_TRAILS.ferrari,
);

const ferrariSummaries = toProductSummaries(ferrariProducts);
const intro = hubIntro({
  subject: "anteojos de sol Ray-Ban Scuderia Ferrari",
  products: ferrariProducts,
  outOfStock: ferrariOutOfStock,
  highlight: nameLineHighlight(ferrariProducts, /scuderia\s+ferrari(\s+coll?ett?ion)?/i),
});

export default function FerrariPage() {
  return (
    <main className="bg-[#0a0a0a]">
      <JsonLd data={ferrariSchema} />
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

        <div className="mx-auto max-w-7xl">
          <Breadcrumbs
            trail={COLLECTION_TRAILS.ferrari}
            className="mb-10"
            currentColor={ferrariRed}
          />

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
                Anteojos de sol Ray-Ban{" "}
                <span style={{ color: ACCENT }}>Scuderia Ferrari</span>
              </h1>
              <p className="mt-4 max-w-xl text-sm leading-[1.9] text-[#8b8580]">
                {intro}
              </p>
              <p className="mt-3 max-w-lg text-sm leading-[1.9] text-[#4a4540]">
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
        products={ferrariSummaries}
        brandLabel="Ferrari Collection"
      />
      <OutOfStockProducts products={ferrariOutOfStock} />

      {/* Collection links */}
      <CollectionLinks current="ferrari" />
    </main>
  );
}
