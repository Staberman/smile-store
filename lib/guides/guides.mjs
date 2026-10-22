// Buying guides (/guias): one module per guide holds its copy as structured
// data, resolved here against the catalog (frame materials of each Ray-Ban
// model, polarized models in stock). Plain JavaScript so node:test can check
// every guide; lib/guide-pages.ts wires them to the catalog, metadata and
// structured data.
import { polarizedGuide } from "./anteojos-polarizados.mjs";
import { rayBanModelsGuide } from "./ray-ban-modelos.mjs";
import { rayBanOriginalsGuide } from "./ray-ban-originales.mjs";
import { GUIDES_PATH, guidePath, inlineHrefs, stripLinks } from "./shared.mjs";

export { isPolarizedProduct } from "./anteojos-polarizados.mjs";
export {
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
  title: "Guías de compra de anteojos de sol",
  h1: "Guías de compra",
  description:
    "Guías de Smile para comprar anteojos de sol: cómo saber si unos Ray-Ban son originales, qué modelo elegir y cuándo convienen los lentes polarizados.",
  intro:
    "Respuestas concretas a las dudas más comunes antes de comprar anteojos de sol: cómo reconocer unos Ray-Ban originales, qué modelo elegir y qué hacen los lentes polarizados. Cada guía indica sus fuentes y la fecha de su última revisión.",
  crumb: "Guías",
};

/** Every guide, resolved against the catalog, in display order. */
export function buildGuides(context) {
  const guides = [rayBanOriginalsGuide, rayBanModelsGuide, polarizedGuide].map((build) => {
    const guide = build(context);
    return { ...guide, path: guidePath(guide.slug) };
  });
  return guides;
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

/** Visible body text without link markup: lead, sections and FAQ. */
export function guideText(guide) {
  return [
    guide.h1,
    guide.lead,
    ...guide.sections.flatMap((section) => [section.heading, section.answer, ...section.blocks.flatMap(blockText)]),
    ...guide.faqs.flatMap((faq) => [faq.question, faq.answer]),
  ]
    .map(stripLinks)
    .join("\n");
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
