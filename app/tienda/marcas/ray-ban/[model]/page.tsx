import { notFound } from "next/navigation";
import CollectionLinks from "@/components/brand/CollectionLinks";
import FaqSection from "@/components/brand/FaqSection";
import HubAlternatives from "@/components/brand/HubAlternatives";
import HubHeader from "@/components/brand/HubHeader";
import HubLinks from "@/components/brand/HubLinks";
import HubPriceBlock from "@/components/brand/HubPriceBlock";
import OutOfStockProducts from "@/components/brand/OutOfStockProducts";
import ProductGrid from "@/components/brand/ProductGrid";
import Breadcrumbs from "@/components/layout/Breadcrumbs";
import JsonLd from "@/components/seo/JsonLd";
import { GUIDE_LINKS } from "@/lib/guides/guides.mjs";
import {
  findHubBySlug,
  getHubPage,
  hubMetadata,
  hubSchema,
  hubsOf,
  indexableHubs,
} from "@/lib/hub-pages";
import { toProductSummaries } from "@/lib/product-summary";

// One static page per Ray-Ban model hub defined in lib/collection-hubs.mjs
// (aviador, wayfarer, round…); any other slug is a 404. The Ferrari
// collection has its own route next to this one.
export const dynamicParams = false;

type Props = { params: { model: string } };

export function generateStaticParams() {
  return hubsOf("model", "ray-ban").map((hub) => ({ model: hub.slug }));
}

function modelPage(slug: string) {
  const hub = findHubBySlug("model", slug, "ray-ban");
  if (!hub) notFound();
  return getHubPage(hub);
}

export function generateMetadata({ params }: Props) {
  return hubMetadata(modelPage(params.model));
}

export default function RayBanModelPage({ params }: Props) {
  const page = modelPage(params.model);
  const { hub } = page;
  const otherModels = indexableHubs(hubsOf("model", "ray-ban"))
    .filter((other) => other.key !== hub.key)
    .map((other) => ({ label: other.linkLabel, href: other.path }));

  return (
    <main className="bg-[#0a0a0a]">
      {page.catalogCount > 0 && <JsonLd data={hubSchema(page)} />}
      <Breadcrumbs trail={page.trail} />
      <HubHeader eyebrow={hub.eyebrow} title={hub.h1} intro={page.intro} />
      {page.priceBlock && <HubPriceBlock block={page.priceBlock} />}
      {page.inStock.length > 0 && (
        <ProductGrid products={toProductSummaries(page.inStock)} brandLabel={hub.gridLabel} />
      )}
      <OutOfStockProducts products={page.outOfStock} />
      <HubAlternatives
        title={hub.alternativesTitle}
        products={page.alternatives}
        moreHref="/tienda/marcas/ray-ban"
        moreLabel="Ver todos los Ray-Ban"
      />
      <FaqSection faqs={page.faqs} title={`Preguntas frecuentes sobre Ray-Ban ${hub.name}`} />
      <HubLinks
        eyebrow="Ray-Ban"
        title="Otros modelos Ray-Ban"
        links={[
          ...otherModels,
          { label: "Scuderia Ferrari", href: "/tienda/marcas/ray-ban/ferrari" },
        ]}
      />
      <HubLinks
        eyebrow="Guías de compra"
        title="Antes de elegir tus Ray-Ban"
        links={[GUIDE_LINKS.rayBanModels, GUIDE_LINKS.rayBanOriginals]}
      />
      <CollectionLinks />
    </main>
  );
}
