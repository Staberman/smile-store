// Buying guides (/guias): one module per guide holds its copy as structured
// data, resolved here against the catalog (frame materials of each Ray-Ban
// model, polarized models in stock, the watches' specs, stock and prices).
// Plain JavaScript so node:test can check every guide; lib/guide-pages.ts
// wires them to the catalog, metadata and structured data.
import { polarizedGuide } from "./anteojos-polarizados.mjs";
import { invictaOriginalsGuide } from "./invicta-originales.mjs";
import { rayBanModelsGuide } from "./ray-ban-modelos.mjs";
import { rayBanOriginalsGuide } from "./ray-ban-originales.mjs";
import { watchGiftGuide } from "./reloj-para-regalar.mjs";
import { waterResistanceGuide } from "./resistencia-al-agua.mjs";
import { GUIDES_PATH, guidePath, inlineHrefs, stripLinks } from "./shared.mjs";

export { isPolarizedProduct } from "./anteojos-polarizados.mjs";
export { isInvictaProduct } from "./invicta-originales.mjs";
export {
  CATALOG_LIST_LIMIT,
  GUIDE_LINKS,
  GUIDE_SLUGS,
  GUIDES_PATH,
  guidePath,
  inlineHrefs,
  inlineSegments,
  stripLinks,
} from "./shared.mjs";

export const GUIDES_INDEX = {
  path: GUIDES_PATH,
  title: "Guías de compra de anteojos de sol y relojes",
  h1: "Guías de compra",
  description:
    "Guías de Smile para comprar anteojos de sol y relojes: Ray-Ban e Invicta originales, lentes polarizados, resistencia al agua y relojes para regalar.",
  intro:
    "Respuestas concretas a las dudas más comunes antes de comprar anteojos de sol o un reloj: cómo reconocer unos Ray-Ban o un Invicta originales, qué modelo elegir, qué hacen los lentes polarizados, qué significa la resistencia al agua y cómo elegir un reloj para regalar. Cada guía indica sus fuentes y la fecha de su última revisión.",
  crumb: "Guías",
};

/** Index sections, in display order: every guide belongs to one. */
export const GUIDE_TOPICS = [
  { key: "anteojos", label: "Anteojos de sol" },
  { key: "relojes", label: "Relojes" },
];

// Display order: grouped by topic, as the index lists them.
const GUIDE_BUILDERS = [
  { topic: "anteojos", build: rayBanOriginalsGuide },
  { topic: "anteojos", build: rayBanModelsGuide },
  { topic: "anteojos", build: polarizedGuide },
  { topic: "relojes", build: invictaOriginalsGuide },
  { topic: "relojes", build: waterResistanceGuide },
  { topic: "relojes", build: watchGiftGuide },
];

/** Every guide, resolved against the catalog, in display order. */
export function buildGuides(context) {
  return GUIDE_BUILDERS.map(({ topic, build }) => {
    const guide = build(context);
    return { ...guide, topic, path: guidePath(guide.slug) };
  });
}

/** Guides of one topic, in display order. */
export function guidesOfTopic(guides, topic) {
  return guides.filter((guide) => guide.topic === topic);
}

function blockText(block) {
  switch (block.type) {
    case "paragraph":
      return [block.text];
    case "list":
      return block.items;
    case "steps":
      return block.items.flatMap((item) => [item.title, item.text]);
    case "table":
      return [block.caption, ...block.head, ...block.rows.flat()];
    case "links":
      return block.items.map((item) => item.label);
    default:
      return [];
  }
}

function textOf(guide, keepBlock) {
  return [
    guide.h1,
    guide.lead,
    ...guide.sections.flatMap((section) => [
      section.heading,
      section.answer,
      ...section.blocks.filter(keepBlock).flatMap(blockText),
    ]),
    ...guide.faqs.flatMap((faq) => [faq.question, faq.answer]),
  ]
    .map(stripLinks)
    .join("\n");
}

/** Visible body text without link markup: lead, sections and FAQ. */
export function guideText(guide) {
  return textOf(guide, () => true);
}

/**
 * The text written for the guide: guideText() without the catalog blocks
 * (product tables and lists built from stock, marked `catalog: true`),
 * whose length follows the stock. The 700-1200 word rule applies to this.
 */
export function guideAuthoredText(guide) {
  return textOf(guide, (block) => !block.catalog);
}

/** The blocks built from the catalog's stock, in order. */
export function catalogBlocks(guide) {
  return guide.sections.flatMap((section) => section.blocks.filter((block) => block.catalog));
}

/** Internal hrefs the guide body links to (inline links and link lists). */
export function guideLinks(guide) {
  const texts = [
    guide.lead,
    ...guide.sections.flatMap((section) => [section.answer, ...section.blocks.flatMap((block) => {
      if (block.type === "links") return [];
      if (block.type === "steps") return block.items.map((item) => item.text);
      if (block.type === "table") return block.rows.flat();
      if (block.type === "paragraph") return [block.text];
      return block.items;
    })]),
  ];
  const linkLists = guide.sections.flatMap((section) =>
    section.blocks.flatMap((block) => (block.type === "links" ? block.items.map((item) => item.href) : [])),
  );
  return [...texts.flatMap(inlineHrefs), ...linkLists];
}

/** Latest dateModified among the guides. */
export function latestGuideDate(guides) {
  return guides.map((guide) => guide.dateModified).sort().at(-1);
}
