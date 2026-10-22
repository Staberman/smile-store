import { allProducts } from "@/lib/catalog";
import { GUIDES } from "@/lib/guide-pages";
import { llmsHubs } from "@/lib/llms-hubs";
import { llmsSummary } from "@/lib/llms-text.mjs";
import { absoluteUrl, SITE_NAME } from "@/lib/seo";
import {
  INSTAGRAM_URL,
  PHONE_DISPLAY,
  STORE_ALTERNATE_NAME,
  STORE_EMAIL,
  STORE_LOCATION,
  WHATSAPP_URL,
} from "@/lib/store-facts";
import { isWatch } from "@/lib/storefront.mjs";

// llms.txt (https://llmstxt.org): a plain-text map of the site for language
// models. Hubs come from lib/collections, so new collections show up here.
// /llms-full.txt opens with the same summary and adds the whole catalog.
export const dynamic = "force-static";

function link(name: string, path: string, description: string): string {
  return `- [${name}](${absoluteUrl(path)}): ${description}`;
}

function buildLlmsTxt(): string {
  const sunglasses = allProducts.filter((product) => !isWatch(product)).length;
  const watches = allProducts.length - sunglasses;

  return [
    `# ${SITE_NAME}`,
    "",
    `> ${llmsSummary({ name: SITE_NAME, alternateName: STORE_ALTERNATE_NAME })}`,
    "",
    `El catálogo tiene ${sunglasses} modelos de anteojos de sol y ${watches} relojes con stock. Stock y precios se sincronizan con Tiendanube cada hora; los modelos agotados siguen publicados con la etiqueta "Sin stock". Precios en pesos argentinos (ARS).`,
    "",
    `Versión completa: ${absoluteUrl("/llms-full.txt")}`,
    "",
    "## Tienda",
    "",
    link("Inicio", "/", "Catálogo completo de anteojos de sol y relojes con stock."),
    ...llmsHubs().map((hub) => link(hub.name, hub.path, hub.description)),
    "",
    "## Guías",
    "",
    ...GUIDES.map((guide) => link(guide.h1, guide.path, guide.description)),
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
