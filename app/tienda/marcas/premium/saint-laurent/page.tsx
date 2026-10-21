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
  title: "Saint Laurent | Marcas Premium",
  description: "Lentes de sol Saint Laurent — rock & élégance parisina. Importados con cristal mineral UV400.",
  alternates: { canonical: "/tienda/marcas/premium/saint-laurent" },
};

const isSaintLaurentProduct = (product: CatalogProduct) => product.brand === "Saint Laurent";
const saintLaurentProducts = allProducts.filter(isSaintLaurentProduct);
const saintLaurentOutOfStock = outOfStockProducts.filter(isSaintLaurentProduct);
const breadcrumbs = premiumBrandTrail("saint-laurent");
const saintLaurentSchema = collectionSchema("/tienda/marcas/premium/saint-laurent", "Colección Saint Laurent", saintLaurentProducts, breadcrumbs);

const saintLaurentSummaries = toProductSummaries(saintLaurentProducts);

export default function SaintLaurentPage() {
  return (
    <main className="bg-[#0a0a0a]">
      <JsonLd data={saintLaurentSchema} />
      <Breadcrumbs trail={breadcrumbs} />
      <BrandCarousel products={saintLaurentSummaries} brand="Saint Laurent" showNav={false} />
      <ProductGrid products={saintLaurentSummaries} brandLabel="Colección Saint Laurent" />
      <OutOfStockProducts products={saintLaurentOutOfStock} />
      <CollectionLinks current="premium" />
    </main>
  );
}
