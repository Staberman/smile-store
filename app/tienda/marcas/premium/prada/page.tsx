import type { Metadata } from "next";
import BrandCarousel from "@/components/brand/BrandCarousel";
import ProductGrid from "@/components/brand/ProductGrid";
import CollectionLinks from "@/components/brand/CollectionLinks";
import OutOfStockProducts from "@/components/brand/OutOfStockProducts";
import Breadcrumbs from "@/components/layout/Breadcrumbs";
import JsonLd from "@/components/seo/JsonLd";
import { allProducts, outOfStockProducts, type CatalogProduct } from "@/lib/catalog";
import { premiumBrandTrail } from "@/lib/collections";
import { toProductSummaries } from "@/lib/product-summary";
import { collectionSchema } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Prada | Marcas Premium",
  description: "Lentes de sol Prada — Symbole y más. Importados, con cristal mineral UV400.",
  alternates: { canonical: "/tienda/marcas/premium/prada" },
};

const isPradaProduct = (product: CatalogProduct) => product.brand === "Prada";
const pradaProducts = allProducts.filter(isPradaProduct);
const pradaOutOfStock = outOfStockProducts.filter(isPradaProduct);
const breadcrumbs = premiumBrandTrail("prada");
const pradaSchema = collectionSchema("/tienda/marcas/premium/prada", "Colección Prada", pradaProducts, breadcrumbs);

const pradaSummaries = toProductSummaries(pradaProducts);

export default function PradaPage() {
  return (
    <main className="bg-[#0a0a0a]">
      <JsonLd data={pradaSchema} />
      <Breadcrumbs trail={breadcrumbs} />
      <BrandCarousel products={pradaSummaries} brand="Prada" showNav={false} />
      <ProductGrid products={pradaSummaries} brandLabel="Colección Prada" />
      <OutOfStockProducts products={pradaOutOfStock} />
      <CollectionLinks current="premium" />
    </main>
  );
}
