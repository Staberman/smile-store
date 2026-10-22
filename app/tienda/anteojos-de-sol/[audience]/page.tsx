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
import {
  findHubBySlug,
  getHubPage,
  hubMetadata,
  hubSchema,
  hubsOf,
  indexableHubs,
} from "@/lib/hub-pages";
import { toProductSummaries } from "@/lib/product-summary";

// /tienda/anteojos-de-sol/hombre and /mujer (lib/collection-hubs.mjs); any
// other segment is a 404.
export const dynamicParams = false;

type Props = { params: { audience: string } };

export function generateStaticParams() {
  return hubsOf("audience", "anteojos-de-sol").map((hub) => ({ audience: hub.slug }));
}

function audiencePage(slug: string) {
  const hub = findHubBySlug("audience", slug, "anteojos-de-sol");
  if (!hub) notFound();
  return getHubPage(hub);
}

export function generateMetadata({ params }: Props) {
  return hubMetadata(audiencePage(params.audience));
}

export default function SunglassesAudiencePage({ params }: Props) {
  const page = audiencePage(params.audience);
  const { hub } = page;
  const links = [
    ...indexableHubs(hubsOf("audience", "anteojos-de-sol")).filter((other) => other.key !== hub.key),
    ...indexableHubs(hubsOf("model", "ray-ban")),
  ].map((other) => ({ label: other.linkLabel, href: other.path }));

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
        moreHref="/tienda/anteojos-de-sol"
        moreLabel="Ver todos los anteojos de sol"
      />
      <FaqSection faqs={page.faqs} title={`Preguntas frecuentes sobre ${hub.subject}`} />
      <HubLinks
        eyebrow="Anteojos de sol"
        title="Seguí explorando"
        links={[
          ...links,
          { label: "Todos los anteojos de sol", href: "/tienda/anteojos-de-sol" },
          { label: "Marcas premium", href: "/tienda/marcas/premium" },
        ]}
      />
      <CollectionLinks />
    </main>
  );
}
