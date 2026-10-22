import { notFound } from "next/navigation";
import CollectionLinks from "@/components/brand/CollectionLinks";
import FaqSection from "@/components/brand/FaqSection";
import HubAlternatives from "@/components/brand/HubAlternatives";
import HubHeader from "@/components/brand/HubHeader";
import HubLinks from "@/components/brand/HubLinks";
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

// /tienda/relojes/hombre and /mujer (lib/collection-hubs.mjs); any other
// segment is a 404. OMEGA x Swatch has its own route next to this one.
export const dynamicParams = false;

type Props = { params: { audience: string } };

export function generateStaticParams() {
  return hubsOf("audience", "relojes").map((hub) => ({ audience: hub.slug }));
}

function audiencePage(slug: string) {
  const hub = findHubBySlug("audience", slug, "relojes");
  if (!hub) notFound();
  return getHubPage(hub);
}

export function generateMetadata({ params }: Props) {
  return hubMetadata(audiencePage(params.audience));
}

export default function WatchesAudiencePage({ params }: Props) {
  const page = audiencePage(params.audience);
  const { hub } = page;
  const otherAudiences = indexableHubs(hubsOf("audience", "relojes"))
    .filter((other) => other.key !== hub.key)
    .map((other) => ({ label: other.linkLabel, href: other.path }));

  return (
    <main className="bg-[#0a0a0a]">
      {page.catalogCount > 0 && <JsonLd data={hubSchema(page)} />}
      <Breadcrumbs trail={page.trail} />
      <HubHeader eyebrow={hub.eyebrow} title={hub.h1} intro={page.intro} />
      {page.inStock.length > 0 && (
        <ProductGrid
          products={toProductSummaries(page.inStock)}
          brandLabel={hub.gridLabel}
          filterBy="brand"
        />
      )}
      <OutOfStockProducts products={page.outOfStock} />
      <HubAlternatives
        title={hub.alternativesTitle}
        products={page.alternatives}
        moreHref="/tienda/relojes"
        moreLabel="Ver todos los relojes"
      />
      <FaqSection faqs={page.faqs} title={`Preguntas frecuentes sobre ${hub.subject}`} />
      <HubLinks
        eyebrow="Relojes"
        title="Seguí explorando"
        links={[
          ...otherAudiences,
          { label: "Todos los relojes", href: "/tienda/relojes" },
          { label: "Tommy Hilfiger", href: "/tienda/marcas/tommy-hilfiger" },
          { label: "Invicta", href: "/tienda/marcas/invicta" },
          { label: "OMEGA x Swatch", href: "/tienda/relojes/omega-swatch" },
        ]}
      />
      <HubLinks
        eyebrow="Guías de compra"
        title="Antes de elegir tu reloj"
        links={[GUIDE_LINKS.watchGift, GUIDE_LINKS.waterResistance]}
      />
      <CollectionLinks />
    </main>
  );
}
