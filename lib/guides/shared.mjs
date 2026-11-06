// Helpers shared by the buying guides (lib/guides/*.mjs): inline link markup,
// plain text for word counts and JSON-LD, and the store sentences built from
// the synced payment, shipping and pickup phrases. Plain JavaScript so
// node:test can check the guides' copy against the real catalog.
import {
  CHECKOUT_PHRASE,
  FREE_SHIPPING_PHRASE,
  INSTALLMENTS_PHRASE,
  STORE_LOCATION,
  STORE_PICKUP_PHRASE,
  TRANSFER_DISCOUNT_PHRASE,
} from "../store-copy.mjs";

export const GUIDES_PATH = "/guias";

/** URL segment of each guide, for links between guides and from the hubs. */
export const GUIDE_SLUGS = {
  rayBanOriginals: "como-saber-si-unos-ray-ban-son-originales",
  rayBanModels: "ray-ban-aviador-wayfarer-round-cual-elegir",
  polarized: "anteojos-polarizados-que-son-y-cuando-conviene",
  rayBanRosario: "donde-comprar-ray-ban-originales-en-rosario",
  invictaOriginals: "como-saber-si-un-reloj-invicta-es-original",
  waterResistance: "resistencia-al-agua-en-relojes-que-significa",
  watchGift: "como-elegir-un-reloj-para-regalar",
};

/** Path of a guide from its slug. */
export function guidePath(slug) {
  return `${GUIDES_PATH}/${slug}`;
}

/** Guide links for the hubs, labelled by what the reader gets. */
export const GUIDE_LINKS = {
  rayBanOriginals: {
    label: "Guía: cómo saber si unos Ray-Ban son originales",
    href: guidePath(GUIDE_SLUGS.rayBanOriginals),
  },
  rayBanModels: {
    label: "Guía: cómo elegir tu Ray-Ban",
    href: guidePath(GUIDE_SLUGS.rayBanModels),
  },
  polarized: {
    label: "Guía: anteojos polarizados",
    href: guidePath(GUIDE_SLUGS.polarized),
  },
  rayBanRosario: {
    label: "Guía: dónde comprar Ray-Ban originales en Rosario",
    href: guidePath(GUIDE_SLUGS.rayBanRosario),
  },
  invictaOriginals: {
    label: "Guía: cómo saber si un Invicta es original",
    href: guidePath(GUIDE_SLUGS.invictaOriginals),
  },
  waterResistance: {
    label: "Guía: resistencia al agua en relojes",
    href: guidePath(GUIDE_SLUGS.waterResistance),
  },
  watchGift: {
    label: "Guía: cómo elegir un reloj para regalar",
    href: guidePath(GUIDE_SLUGS.watchGift),
  },
};

/**
 * Most products a catalog block (a table or list built from stock) shows;
 * the rest are summed up in a "y N más" link to the hub. Stock can grow
 * with any hourly sync: the cap keeps a guide's length bounded.
 */
export const CATALOG_LIST_LIMIT = 8;

/** The first CATALOG_LIST_LIMIT items to show and how many are left out. */
export function capList(items, limit = CATALOG_LIST_LIMIT) {
  return { shown: items.slice(0, limit), more: Math.max(0, items.length - limit) };
}

/** "Y 3 modelos más en la [colección Invicta](/tienda/marcas/invicta).", or "" with none left out. */
export function moreSentence(more, where) {
  if (more === 0) return "";
  return `Y ${more} ${more === 1 ? "modelo" : "modelos"} más en ${where}.`;
}

// Guide copy marks internal links as [label](/path), like Markdown. The page
// renders them as links; plain text keeps the label only.
const INLINE_LINK = /\[([^\]]+)\]\(([^)\s]+)\)/g;

/** "[Ray-Ban Aviador](/tienda/marcas/ray-ban/aviador)". */
export function link(label, href) {
  return `[${label}](${href})`;
}

/** Text split into plain runs and links, in order. */
export function inlineSegments(text) {
  const segments = [];
  let last = 0;
  for (const match of String(text).matchAll(INLINE_LINK)) {
    if (match.index > last) segments.push({ text: text.slice(last, match.index) });
    segments.push({ text: match[1], href: match[2] });
    last = match.index + match[0].length;
  }
  if (last < text.length) segments.push({ text: text.slice(last) });
  return segments;
}

/** The text without link markup: "[a](/b) c" -> "a c". */
export function stripLinks(text) {
  return String(text).replace(INLINE_LINK, "$1");
}

/** Hrefs of the inline links in a text, in order. */
export function inlineHrefs(text) {
  return [...String(text).matchAll(INLINE_LINK)].map((match) => match[2]);
}

// The store's terms, from the shared phrases synced from Tiendanube. Guides
// never write payment, shipping or pickup terms by hand.
export const STORE_LOCATION_SENTENCE = `Smile es una tienda online de ${STORE_LOCATION.locality}, ${STORE_LOCATION.region}, con envíos a todo el país y ${STORE_PICKUP_PHRASE}.`;
export const STORE_PAYMENT_SENTENCE = `Podés pagar en ${INSTALLMENTS_PHRASE} o con ${TRANSFER_DISCOUNT_PHRASE}, con ${CHECKOUT_PHRASE}. ${FREE_SHIPPING_PHRASE}.`;

/** Lowercase, without accents or punctuation. */
export function normalize(value) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}
