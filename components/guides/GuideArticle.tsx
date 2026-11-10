import { Fragment } from "react";
import Link from "next/link";
import FaqSection from "@/components/brand/FaqSection";
import HubLinks from "@/components/brand/HubLinks";
import Breadcrumbs from "@/components/layout/Breadcrumbs";
import { formatGuideDate, guideFaqs, guideTrail, GUIDES } from "@/lib/guide-pages";
import { inlineSegments, type Guide, type GuideBlock } from "@/lib/guides/guides.mjs";

const LINK_CLASS =
  "text-[#c9a96e] underline decoration-[#c9a96e]/40 underline-offset-4 transition hover:text-[#e2c989] hover:decoration-[#e2c989]";

/** Guide copy with its `[label](/path)` links rendered as links. */
export function Inline({ text }: { text: string }) {
  return (
    <>
      {inlineSegments(text).map((segment, index) =>
        segment.href ? (
          <Link key={index} href={segment.href} prefetch={false} className={LINK_CLASS}>
            {segment.text}
          </Link>
        ) : (
          <Fragment key={index}>{segment.text}</Fragment>
        ),
      )}
    </>
  );
}

const TEXT_CLASS = "text-[15px] leading-[1.85] text-[#c8c1b6]";

/** One body block of a guide; the landing pages (lib/landings) use the same format. */
export function Block({ block }: { block: GuideBlock }) {
  switch (block.type) {
    case "paragraph":
      return (
        <p className={`mt-5 ${TEXT_CLASS}`}>
          <Inline text={block.text} />
        </p>
      );
    case "list": {
      const ListTag = block.ordered ? "ol" : "ul";
      return (
        <ListTag
          className={`mt-5 space-y-2 pl-5 ${TEXT_CLASS} ${block.ordered ? "list-decimal" : "list-disc"} marker:text-[#c9a96e]`}
        >
          {block.items.map((item) => (
            <li key={item}>
              <Inline text={item} />
            </li>
          ))}
        </ListTag>
      );
    }
    case "steps":
      return (
        <ol className={`mt-5 list-decimal space-y-3 pl-5 ${TEXT_CLASS} marker:text-[#c9a96e]`}>
          {block.items.map((item) => (
            <li key={item.title}>
              <strong className="font-semibold text-[#f0ece4]">{item.title}:</strong>{" "}
              <Inline text={item.text} />
            </li>
          ))}
        </ol>
      );
    case "table":
      return (
        <div className="mt-6 overflow-x-auto">
          <table className="w-full min-w-[640px] border-collapse text-left text-[13px] leading-[1.7]">
            <caption className="mb-3 text-left text-[12px] text-[#8b8580]">{block.caption}</caption>
            <thead>
              <tr className="border-b border-white/12">
                {block.head.map((cell) => (
                  <th
                    key={cell}
                    scope="col"
                    className="px-3 py-2 text-[10px] font-medium uppercase tracking-[0.2em] text-[#c9a96e]"
                  >
                    {cell}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {block.rows.map((row) => (
                <tr key={row[0]} className="border-b border-white/6 align-top">
                  {row.map((cell, index) =>
                    index === 0 ? (
                      <th key={index} scope="row" className="px-3 py-3 font-semibold text-[#f0ece4]">
                        <Inline text={cell} />
                      </th>
                    ) : (
                      <td key={index} className="px-3 py-3 text-[#c8c1b6]">
                        <Inline text={cell} />
                      </td>
                    ),
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    case "links":
      return (
        <ul className="mt-5 flex flex-wrap gap-3">
          {block.items.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                prefetch={false}
                className="inline-flex min-h-11 items-center rounded-full border border-white/12 px-5 text-[11px] uppercase tracking-[0.18em] text-[#b8b0a4] transition hover:border-[#c9a96e] hover:text-[#f0ece4]"
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      );
    default:
      return null;
  }
}

/**
 * A buying guide: header with the direct answer, sections, FAQ, sources and
 * the other guides, those on the same topic first.
 */
export default function GuideArticle({ guide }: { guide: Guide }) {
  const otherGuides = GUIDES.filter((other) => other.slug !== guide.slug)
    .sort((a, b) => Number(b.topic === guide.topic) - Number(a.topic === guide.topic))
    .map((other) => ({ label: other.h1, href: other.path }));
  const faqs = guideFaqs(guide);

  return (
    <article className="bg-[#0a0a0a] text-[#f0ece4]">
      <Breadcrumbs trail={guideTrail(guide)} />

      <header className="px-6 pb-10 pt-12 md:px-12 md:pt-16">
        <div className="mx-auto max-w-3xl">
          <p className="text-[10px] uppercase tracking-[0.42em] text-[#c9a96e]">Guía de compra</p>
          <h1 className="font-display mt-4 text-[2.4rem] font-light italic leading-[1.06] md:text-[3.6rem]">
            {guide.h1}
          </h1>
          <p className="mt-6 text-base leading-[1.85] text-[#d8d2c8] md:text-[17px]">
            <Inline text={guide.lead} />
          </p>
          <p className="mt-6 text-[11px] uppercase tracking-[0.24em] text-[#8b8580]">
            Actualizado: <time dateTime={guide.dateModified}>{formatGuideDate(guide.dateModified)}</time>
            {" · "}Por Smile
          </p>
        </div>
      </header>

      <nav aria-label="En esta guía" className="px-6 pb-4 md:px-12">
        <div className="mx-auto max-w-3xl border-y border-white/8 py-5">
          <p className="text-[10px] uppercase tracking-[0.32em] text-[#8b8580]">En esta guía</p>
          <ol className="mt-3 space-y-1.5 text-[13px] text-[#b8b0a4]">
            {guide.sections.map((section) => (
              <li key={section.id}>
                <a href={`#${section.id}`} className="transition hover:text-[#f0ece4]">
                  {section.heading}
                </a>
              </li>
            ))}
            <li>
              <a href="#fuentes" className="transition hover:text-[#f0ece4]">
                Fuentes
              </a>
            </li>
          </ol>
        </div>
      </nav>

      <div className="px-6 pb-16 md:px-12">
        <div className="mx-auto max-w-3xl">
          {guide.sections.map((section) => (
            <section key={section.id} id={section.id} className="scroll-mt-32 pt-12">
              <h2 className="font-display text-[1.7rem] font-light italic leading-[1.15] md:text-[2.2rem]">
                {section.heading}
              </h2>
              <p className="mt-4 text-[15px] leading-[1.85] text-[#f0ece4]">
                <Inline text={section.answer} />
              </p>
              {section.blocks.map((block, index) => (
                <Block key={index} block={block} />
              ))}
            </section>
          ))}
        </div>
      </div>

      {faqs.length > 0 && <FaqSection faqs={faqs} title="Preguntas frecuentes" />}

      <section
        id="fuentes"
        aria-labelledby="fuentes-titulo"
        className="scroll-mt-32 border-t border-white/6 px-6 py-12 md:px-12"
      >
        <div className="mx-auto max-w-3xl">
          <h2 id="fuentes-titulo" className="font-display text-xl font-light italic md:text-2xl">
            Fuentes
          </h2>
          <ol className="mt-5 list-decimal space-y-2 pl-5 text-[13px] leading-[1.7] text-[#8b8580] marker:text-[#4a4540]">
            {guide.sources.map((source) => (
              <li key={source.url}>
                {source.publisher}:{" "}
                <a href={source.url} target="_blank" rel="noopener noreferrer" className={LINK_CLASS}>
                  {source.title}
                </a>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <HubLinks eyebrow="Guías" title="Otras guías de compra" links={otherGuides} />
    </article>
  );
}
