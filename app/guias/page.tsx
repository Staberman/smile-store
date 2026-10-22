import Link from "next/link";
import Breadcrumbs from "@/components/layout/Breadcrumbs";
import JsonLd from "@/components/seo/JsonLd";
import {
  formatGuideDate,
  GUIDES,
  GUIDES_INDEX_TRAIL,
  guidesIndexMetadata,
  guidesIndexSchema,
} from "@/lib/guide-pages";
import { GUIDE_TOPICS, GUIDES_INDEX, guidesOfTopic } from "@/lib/guides/guides.mjs";

export const metadata = guidesIndexMetadata;

export default function GuidesIndexPage() {
  return (
    <main className="bg-[#0a0a0a] text-[#f0ece4]">
      <JsonLd data={guidesIndexSchema()} />
      <Breadcrumbs trail={GUIDES_INDEX_TRAIL} />

      <section className="px-6 pb-10 pt-12 md:px-12 md:pt-16">
        <div className="mx-auto max-w-5xl">
          <p className="text-[10px] uppercase tracking-[0.42em] text-[#c9a96e]">Smile · Guías</p>
          <h1 className="font-display mt-4 text-[2.6rem] font-light italic leading-[1.04] md:text-[4.2rem]">
            {GUIDES_INDEX.h1}
          </h1>
          <p className="mt-6 max-w-2xl text-sm leading-[1.9] text-[#b8b0a4] md:text-base">
            {GUIDES_INDEX.intro}
          </p>
        </div>
      </section>

      {GUIDE_TOPICS.map((topic) => {
        const guides = guidesOfTopic(GUIDES, topic.key);
        if (guides.length === 0) return null;
        return (
          <section
            key={topic.key}
            id={topic.key}
            aria-labelledby={`guias-${topic.key}`}
            className="scroll-mt-32 px-6 pb-12 md:px-12"
          >
            <div className="mx-auto max-w-5xl">
              <h2
                id={`guias-${topic.key}`}
                className="font-display text-[1.7rem] font-light italic leading-[1.15] md:text-[2.2rem]"
              >
                {topic.label}
              </h2>
              <ul className="mt-6 grid gap-4 md:grid-cols-3">
                {guides.map((guide) => (
                  <li key={guide.slug} className="flex flex-col border border-white/8 bg-white/[0.025] p-6 md:p-7">
                    <h3 className="font-display text-[1.5rem] font-light italic leading-[1.15]">
                      <Link href={guide.path} className="transition hover:text-[#c9a96e]">
                        {guide.h1}
                      </Link>
                    </h3>
                    <p className="mt-4 flex-1 text-sm leading-[1.8] text-[#8b8580]">{guide.summary}</p>
                    <p className="mt-5 text-[10px] uppercase tracking-[0.24em] text-[#6a6560]">
                      Actualizado: <time dateTime={guide.dateModified}>{formatGuideDate(guide.dateModified)}</time>
                    </p>
                    <Link
                      href={guide.path}
                      className="mt-5 inline-flex min-h-11 items-center self-start rounded-full border border-white/12 px-5 text-[10px] uppercase tracking-[0.22em] text-[#b8b0a4] transition hover:border-[#c9a96e] hover:text-[#f0ece4]"
                      aria-label={`Leer la guía: ${guide.h1}`}
                    >
                      Leer la guía
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        );
      })}

      <section aria-label="Más guías" className="px-6 pb-20 md:px-12">
        <p className="mx-auto max-w-5xl text-sm leading-[1.8] text-[#8b8580]">
          ¿Buscás qué anteojos te favorecen según la forma de tu rostro o qué tamaño de reloj va con tu
          muñeca? Mirá la{" "}
          <Link
            href="/guia-de-estilo"
            className="text-[#c9a96e] underline decoration-[#c9a96e]/40 underline-offset-4 transition hover:text-[#e2c989]"
          >
            guía de estilo
          </Link>
          .
        </p>
      </section>
    </main>
  );
}
