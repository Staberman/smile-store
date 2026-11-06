import CollectionLinks from "@/components/brand/CollectionLinks";
import FaqSection from "@/components/brand/FaqSection";
import HubHeader from "@/components/brand/HubHeader";
import HubLinks from "@/components/brand/HubLinks";
import OutOfStockProducts from "@/components/brand/OutOfStockProducts";
import ProductGrid from "@/components/brand/ProductGrid";
import Breadcrumbs from "@/components/layout/Breadcrumbs";
import JsonLd from "@/components/seo/JsonLd";
import { SUNGLASSES_HUB } from "@/lib/collection-hubs.mjs";
import { GUIDE_LINKS } from "@/lib/guides/guides.mjs";
import { getHubPage, hubMetadata, hubSchema, hubsOf, indexableHubs } from "@/lib/hub-pages";
import { toProductSummaries } from "@/lib/product-summary";

// Every pair of sunglasses in the catalog: the parent of the hombre / mujer
// hubs, and where /lentes-de-sol (the old Tiendanube URL) redirects.
const page = getHubPage(SUNGLASSES_HUB);

export const metadata = hubMetadata(page);

const sectionLinks = [
  ...indexableHubs(hubsOf("audience", "anteojos-de-sol")),
  ...indexableHubs(hubsOf("model", "ray-ban")),
].map((hub) => ({ label: hub.linkLabel, href: hub.path }));

export default function SunglassesPage() {
  return (
    <main className="bg-[#0a0a0a]">
      <JsonLd data={hubSchema(page)} />
      <Breadcrumbs trail={page.trail} />
      <HubHeader eyebrow={SUNGLASSES_HUB.eyebrow} title={SUNGLASSES_HUB.h1} intro={page.intro} />
      <HubLinks
        eyebrow="Explorar"
        title="Anteojos de sol por sección"
        links={[
          ...sectionLinks,
          { label: "Scuderia Ferrari", href: "/tienda/marcas/ray-ban/ferrari" },
          { label: "Marcas premium", href: "/tienda/marcas/premium" },
        ]}
      />
      {page.inStock.length > 0 && (
        <ProductGrid
          products={toProductSummaries(page.inStock)}
          brandLabel={SUNGLASSES_HUB.gridLabel}
          filterBy="brand"
        />
      )}
      <OutOfStockProducts products={page.outOfStock} />
      <FaqSection faqs={page.faqs} title="Preguntas frecuentes sobre anteojos de sol" />
      <HubLinks
        eyebrow="Guías de compra"
        title="Antes de elegir tus anteojos de sol"
        links={[GUIDE_LINKS.polarized, GUIDE_LINKS.rayBanModels, GUIDE_LINKS.rayBanOriginals, GUIDE_LINKS.rayBanRosario]}
      />
      <CollectionLinks current="anteojos-de-sol" />
    </main>
  );
}
