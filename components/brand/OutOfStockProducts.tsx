import ProductCard from "@/components/brand/ProductCard";
import type { CatalogProduct } from "@/lib/catalog";
import { toProductSummary } from "@/lib/product-summary";

/**
 * Out-of-stock products of a collection, listed after its in-stock grid.
 * Renders nothing when the collection has none.
 */
export default function OutOfStockProducts({ products }: { products: CatalogProduct[] }) {
  if (products.length === 0) return null;

  return (
    <section className="border-t border-white/6 bg-[#0a0a0a] px-6 py-16 text-[#f0ece4] md:px-12 md:py-20">
      <div className="mx-auto max-w-7xl">
        <div className="mb-10">
          <p className="text-[10px] uppercase tracking-[0.42em] text-[#4a4540]">Agotados</p>
          <h2 className="font-display mt-2 text-[2rem] font-light italic">
            Sin stock por ahora
          </h2>
          <p className="mt-3 max-w-xl text-sm leading-[1.8] text-[#8b8580]">
            Estos modelos se agotaron por el momento. Podés ver el detalle de cada
            uno y consultarnos por su reposición.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {products.map((product) => (
            <ProductCard
              key={product.slug}
              product={toProductSummary(product)}
              collectionLabel={product.categories[product.categories.length - 1] ?? product.brand}
              outOfStock
            />
          ))}
        </div>
      </div>
    </section>
  );
}
