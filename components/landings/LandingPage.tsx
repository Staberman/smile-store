import FaqSection from "@/components/brand/FaqSection";
import HubHeader from "@/components/brand/HubHeader";
import HubLinks from "@/components/brand/HubLinks";
import HubPriceBlock from "@/components/brand/HubPriceBlock";
import ProductCard from "@/components/brand/ProductCard";
import { Block, Inline } from "@/components/guides/GuideArticle";
import Breadcrumbs from "@/components/layout/Breadcrumbs";
import JsonLd from "@/components/seo/JsonLd";
import { landingSchema, landingTrail, type LandingPage as LandingData } from "@/lib/landing-pages";
import { toProductSummary } from "@/lib/product-summary";

type Section = LandingData["sections"][number];

/** A text section (lib/landings block format) with its product cards under it. */
function LandingSection({ section }: { section: Section }) {
  return (
    <section
      id={section.id}
      aria-labelledby={`${section.id}-titulo`}
      className="scroll-mt-32 border-b border-white/6 bg-[#0a0a0a] px-6 py-12 text-[#f0ece4] md:px-12 md:py-16"
    >
      <div className="mx-auto max-w-7xl">
        <div className="max-w-3xl">
          <h2
            id={`${section.id}-titulo`}
            className="font-display text-[1.7rem] font-light italic leading-[1.15] md:text-[2.2rem]"
          >
            {section.heading}
          </h2>
          <p className="mt-4 text-[15px] leading-[1.85] text-[#f0ece4]">
            <Inline text={section.answer} />
          </p>
          {section.blocks.map((block, index) => (
            <Block key={index} block={block} />
          ))}
        </div>
        {section.items.length > 0 && (
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {section.items.map(({ product, label }) => (
              <ProductCard key={product.slug} product={toProductSummary(product)} collectionLabel={label} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

/**
 * A landing page (lib/landings): breadcrumbs, H1 and intro, the in-stock
 * price block, the sections, the FAQ and related links. Everything comes
 * from lib/landing-pages, built at build time from the catalog.
 */
export default function LandingPage({ landing }: { landing: LandingData }) {
  return (
    <main className="bg-[#0a0a0a]">
      <JsonLd data={landingSchema(landing)} />
      <Breadcrumbs trail={landingTrail(landing)} />
      <HubHeader eyebrow={landing.eyebrow} title={landing.h1} intro={landing.lead} />
      {landing.priceBlock && <HubPriceBlock block={landing.priceBlock} />}
      {landing.sections.map((section) => (
        <LandingSection key={section.id} section={section} />
      ))}
      <FaqSection faqs={landing.faqs} title={landing.faqTitle} />
      <HubLinks eyebrow="Anteojos de sol" title="Seguí explorando" links={landing.links} />
    </main>
  );
}
