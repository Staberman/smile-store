import { allProducts } from "@/lib/catalog";
import {
  COLLECTION_SUMMARIES,
  COLLECTION_TRAILS,
  PREMIUM_BRANDS,
  type CollectionKey,
} from "@/lib/collections";
import { indexableHubs } from "@/lib/hub-pages";
import { absoluteUrl, SITE_NAME } from "@/lib/seo";
import {
  CHECKOUT_PHRASE,
  INSTAGRAM_URL,
  INSTALLMENTS_PHRASE,
  PHONE_DISPLAY,
  STORE_ALTERNATE_NAME,
  STORE_EMAIL,
  STORE_LOCATION,
  TRANSFER_DISCOUNT_PHRASE,
  WHATSAPP_URL,
} from "@/lib/store-facts";
import { isWatch } from "@/lib/storefront.mjs";

// llms.txt (https://llmstxt.org): a plain-text map of the site for language
// models. Hubs come from lib/collections, so new collections show up here.
export const dynamic = "force-static";

const HUB_ORDER: CollectionKey[] = [
  "ray-ban",
  "ferrari",
  "premium",
  "relojes",
  "invicta",
  "tommy-hilfiger",
  "omega-swatch",
];

function link(name: string, path: string, description: string): string {
  return `- [${name}](${absoluteUrl(path)}): ${description}`;
}

function buildLlmsTxt(): string {
  const sunglasses = allProducts.filter((product) => !isWatch(product)).length;
  const watches = allProducts.length - sunglasses;

  const hubs = HUB_ORDER.map((key) => {
    const crumb = COLLECTION_TRAILS[key][COLLECTION_TRAILS[key].length - 1];
    return link(crumb.name, crumb.href, COLLECTION_SUMMARIES[key]);
  });
  // Ray-Ban model hubs, same rule as the sitemap: only those with enough
  // products in the catalog.
  const collectionHubs = indexableHubs().map((hub) => link(hub.linkLabel, hub.path, hub.summary));
  // Same rule as the sitemap: premium brands without stock are not indexed.
  const premiumBrands = PREMIUM_BRANDS.filter((brand) =>
    allProducts.some((product) => product.brand === brand.catalogBrand),
  ).map((brand) =>
    link(brand.name, `/tienda/marcas/premium/${brand.slug}`, `Anteojos de sol ${brand.name}.`),
  );

  return [
    `# ${SITE_NAME}`,
    "",
    `> ${SITE_NAME} (${STORE_ALTERNATE_NAME}) es una tienda online de ${STORE_LOCATION.label}, que vende anteojos de sol y relojes originales: Ray-Ban (incluida la Scuderia Ferrari Collection), marcas premium como Prada, Christian Dior, Versace, Gucci y Louis Vuitton, y relojes Invicta, Tommy Hilfiger y OMEGA x Swatch. Las compras se confirman en el ${CHECKOUT_PHRASE}; se puede pagar en ${INSTALLMENTS_PHRASE} o con ${TRANSFER_DISCOUNT_PHRASE}. Envíos a todo el país.`,
    "",
    `El catálogo tiene ${sunglasses} modelos de anteojos de sol y ${watches} relojes con stock. Stock y precios se sincronizan con Tiendanube cada hora; los modelos agotados siguen publicados con la etiqueta "Sin stock". Precios en pesos argentinos (ARS).`,
    "",
    "## Tienda",
    "",
    link("Inicio", "/", "Catálogo completo de anteojos de sol y relojes con stock."),
    ...hubs,
    ...collectionHubs,
    ...premiumBrands,
    "",
    "## Guías",
    "",
    link(
      "Cómo elegir tus lentes según la forma de tu rostro",
      "/guia-de-estilo",
      "Qué anteojos de sol favorecen a cada forma de rostro y cómo elegir el tamaño de un reloj.",
    ),
    "",
    "## Contacto",
    "",
    `- [WhatsApp](${WHATSAPP_URL}): ${PHONE_DISPLAY}`,
    `- [Email](mailto:${STORE_EMAIL}): ${STORE_EMAIL}`,
    `- [Instagram](${INSTAGRAM_URL}): @${INSTAGRAM_URL.split("/").filter(Boolean).pop()}`,
    link("Página de contacto", "/contacto", `Canales de atención de ${SITE_NAME} en ${STORE_LOCATION.label}.`),
    "",
    "## Optional",
    "",
    link("Sitemap", "/sitemap.xml", "Todas las páginas indexables, incluidas las fichas de producto."),
    "",
  ].join("\n");
}

export function GET() {
  return new Response(buildLlmsTxt(), {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
