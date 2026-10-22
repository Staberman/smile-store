// Text for language models (https://llmstxt.org): the store summary shared by
// /llms.txt and /llms-full.txt, and the full version itself, with the store
// facts, the hubs, the whole catalog and the FAQ. Plain JavaScript so
// node:test can check it; app/llms-full.txt/route.ts wires it to the catalog,
// display names, hubs and contact channels. Server-only.
import { modelHubOf, RAY_BAN_MODEL_HUBS } from "./collection-hubs.mjs";
import { defaultVariant } from "./merchant-feed.mjs";
import { formatPrice } from "./price-format.mjs";
import { descriptionLines, productKind, splitDescription } from "./product-copy.mjs";
import {
  CHECKOUT_PHRASE,
  FREE_SHIPPING_PHRASE,
  INSTALLMENTS_PHRASE,
  STORE_LOCATION,
  STORE_PICKUP_PHRASE,
  TRANSFER_DISCOUNT_PHRASE,
} from "./store-copy.mjs";
import { STORE_FAQS } from "./store-faqs.mjs";
import { getDisplayPrice } from "./storefront.mjs";

/** The opening summary of both files, under the "# Smile" title. */
export function llmsSummary({ name, alternateName }) {
  return `${name} (${alternateName}) es una tienda online de ${STORE_LOCATION.label}, que vende anteojos de sol y relojes originales: Ray-Ban (incluida la Scuderia Ferrari Collection), marcas premium como Prada, Christian Dior, Versace, Gucci y Louis Vuitton, y relojes Invicta, Tommy Hilfiger y OMEGA x Swatch. Las compras se confirman en el ${CHECKOUT_PHRASE}; se puede pagar en ${INSTALLMENTS_PHRASE} o con ${TRANSFER_DISCOUNT_PHRASE}. Envíos a todo el país y ${STORE_PICKUP_PHRASE}, ${STORE_LOCATION.locality}. ${FREE_SHIPPING_PHRASE}.`;
}

const compare = (a, b) => a.localeCompare(b, "es");

// Markdown link text: brackets would end it early.
function linkText(value) {
  return String(value).replace(/[[\]]/g, "\\$&");
}

function storeFacts({ siteUrl, contact }) {
  const instagram = contact.instagramUrl.split("/").filter(Boolean).pop();
  return [
    `- Ubicación: tienda online de ${STORE_LOCATION.label}.`,
    `- Pago: en el ${CHECKOUT_PHRASE}, en ${INSTALLMENTS_PHRASE} o con ${TRANSFER_DISCOUNT_PHRASE}.`,
    `- Envíos: a todo el país. ${FREE_SHIPPING_PHRASE}.`,
    `- Retiro: ${STORE_PICKUP_PHRASE}, ${STORE_LOCATION.locality}.`,
    `- Contacto: WhatsApp ${contact.phone} (${contact.whatsappUrl}), email ${contact.email}, Instagram @${instagram} (${contact.instagramUrl}), página de contacto ${siteUrl}/contacto.`,
    '- Precios y stock: precios en pesos argentinos (ARS), los que muestra cada página de producto. Stock y precios se sincronizan con Tiendanube cada hora; los modelos agotados siguen publicados con la etiqueta "Sin stock".',
  ];
}

/**
 * One catalog entry as the product page shows it on load: display name, URL,
 * brand, the price of the variant the page selects, stock and the spec lines
 * of its description.
 */
export function llmsProduct({ product, facts }, siteUrl) {
  const variant = defaultVariant(product);
  return {
    slug: product.slug,
    name: facts.name,
    url: `${siteUrl}/tienda/productos/${product.slug}`,
    brand: facts.brand,
    kind: productKind(product),
    // Same rules as the page: the selected variant's price, and its
    // "Sin stock" badge when nothing can be bought.
    price: formatPrice(getDisplayPrice(product, variant)),
    inStock: Boolean(facts.purchasable && variant),
    specs: splitDescription(descriptionLines(product.descriptionHtml)).specs,
    model: modelHubOf(product),
  };
}

function productLines(item) {
  const specs = item.specs.map((spec) => `${spec.name}: ${spec.value}`).join("; ");
  return [
    `- [${linkText(item.name)}](${item.url})`,
    `  - Marca: ${item.brand}`,
    `  - Precio: ${item.price}`,
    `  - Disponibilidad: ${item.inStock ? "en stock" : "sin stock"}`,
    ...(specs ? [`  - Especificaciones: ${specs}`] : []),
  ];
}

// In stock first, then by name: the order is the same whatever the input order.
function byStockThenName(a, b) {
  return Number(b.inStock) - Number(a.inStock) || compare(a.name, b.name) || compare(a.slug, b.slug);
}

function groupLines(heading, items, intro = []) {
  return [heading, "", ...intro, ...items.sort(byStockThenName).flatMap(productLines), ""];
}

/**
 * The catalog grouped by brand (sunglasses first, then watches; larger
 * brands first) and, for Ray-Ban, by model hub, with the products of no
 * model hub last.
 */
function catalogLines(items, { siteUrl, hubs }) {
  const indexedPaths = new Set(hubs.map((hub) => hub.path));
  const brands = new Map();
  for (const item of items) brands.set(item.brand, [...(brands.get(item.brand) ?? []), item]);
  const kindRank = (group) => (group.some((item) => item.kind === "watch") ? 1 : 0);
  const ordered = [...brands.entries()].sort(
    ([nameA, a], [nameB, b]) => kindRank(a) - kindRank(b) || b.length - a.length || compare(nameA, nameB),
  );

  return ordered.flatMap(([brand, group]) => {
    const withModel = group.filter((item) => item.model);
    if (withModel.length === 0) return groupLines(`### ${brand}`, group);

    const models = RAY_BAN_MODEL_HUBS.flatMap((hub) => {
      const inHub = group.filter((item) => item.model === hub);
      if (inHub.length === 0) return [];
      const page = indexedPaths.has(hub.path) ? [`Colección: ${siteUrl}${hub.path}`, ""] : [];
      return groupLines(`#### ${hub.linkLabel}`, inHub, page);
    });
    const others = group.filter((item) => !item.model);
    return [
      `### ${brand}`,
      "",
      ...models,
      ...(others.length > 0 ? groupLines(`#### Otros modelos ${brand}`, others) : []),
    ];
  });
}

/**
 * /llms-full.txt: the llms.txt summary, the store facts, every indexed hub,
 * the full catalog (in stock or not) and the store FAQ, as plain text.
 * `entries` pair each catalog product with what the site derives for it:
 * display name, canonical brand and whether it can be bought.
 */
export function buildLlmsFull({ siteUrl, store, contact, hubs, entries, faqs = STORE_FAQS }) {
  const items = entries.map((entry) => llmsProduct(entry, siteUrl));
  const inStock = items.filter((item) => item.inStock).length;

  return [
    `# ${store.name}`,
    "",
    `> ${llmsSummary(store)}`,
    "",
    `Versión completa de ${siteUrl}/llms.txt: datos de la tienda, colecciones, el catálogo entero con precio, disponibilidad y especificaciones de cada producto, y las preguntas frecuentes.`,
    "",
    "## Datos de la tienda",
    "",
    ...storeFacts({ siteUrl, contact }),
    "",
    "## Colecciones",
    "",
    ...hubs.map((hub) => `- [${linkText(hub.name)}](${siteUrl}${hub.path}): ${hub.description}`),
    "",
    "## Catálogo",
    "",
    `${items.length} productos: ${inStock} con stock y ${items.length - inStock} sin stock. Cada producto tiene su página con fotos, variantes y compra.`,
    "",
    ...catalogLines(items, { siteUrl, hubs }),
    "## Preguntas frecuentes",
    "",
    ...faqs.flatMap((faq) => [`### ${faq.question}`, "", faq.answer, ""]),
  ].join("\n");
}
