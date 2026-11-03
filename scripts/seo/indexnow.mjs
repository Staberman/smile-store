// Tells IndexNow search engines (Bing, Copilot, Yandex, Seznam, Naver) that
// pages changed, so they recrawl them within hours. Google does not use
// IndexNow. The key is public by design: engines verify it by fetching the
// key file served from public/.
//
//   node scripts/seo/indexnow.mjs                 every URL in the sitemap, plus
//                                                 the .md copy of each product
//   node scripts/seo/indexnow.mjs <url> [<url>…]  only those URLs
import process from "node:process";
import { pathToFileURL } from "node:url";

export const SITE_URL = "https://smiletiendaimp.com.ar";
const INDEXNOW_KEY = "9ada441fddd4d2d1a6dbc325c889aa0a";
const KEY_LOCATION = `${SITE_URL}/${INDEXNOW_KEY}.txt`;
const ENDPOINT = "https://api.indexnow.org/indexnow";
// IndexNow accepts up to 10,000 URLs per request.
const BATCH_SIZE = 10_000;

const PRODUCT_URL = new RegExp(`^${SITE_URL}/tienda/productos/([^/?#]+)$`);

/**
 * The sitemap URLs plus the Markdown copy of every product page
 * (/tienda/productos/<slug> -> /tienda/productos/<slug>.md). The .md URLs are
 * not in the sitemap, so this is the only place they are announced.
 */
export function withMarkdownUrls(urls) {
  const markdown = urls
    .map((url) => PRODUCT_URL.exec(url))
    .filter((match) => match && !match[1].endsWith(".md"))
    .map((match) => `${match[0]}.md`);
  return [...new Set([...urls, ...markdown])];
}

async function sitemapUrls() {
  const response = await fetch(`${SITE_URL}/sitemap.xml`);
  if (!response.ok) throw new Error(`No se pudo leer el sitemap: HTTP ${response.status}.`);
  const xml = await response.text();
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1].trim());
}

async function assertKeyIsServed() {
  const response = await fetch(KEY_LOCATION);
  const body = response.ok ? (await response.text()).trim() : "";
  if (body !== INDEXNOW_KEY) {
    throw new Error(`El archivo de clave no está publicado en ${KEY_LOCATION} (HTTP ${response.status}).`);
  }
}

async function submit(urlList) {
  const response = await fetch(ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify({
      host: new URL(SITE_URL).host,
      key: INDEXNOW_KEY,
      keyLocation: KEY_LOCATION,
      urlList,
    }),
  });
  // 200 and 202 both mean the URLs were accepted.
  if (response.status !== 200 && response.status !== 202) {
    throw new Error(`IndexNow rechazó el envío: HTTP ${response.status} ${await response.text()}`);
  }
  return response.status;
}

export async function main(requested = process.argv.slice(2)) {
  const urls = requested.length > 0 ? requested : withMarkdownUrls(await sitemapUrls());
  const foreign = urls.filter((url) => !url.startsWith(`${SITE_URL}/`) && url !== SITE_URL);
  if (foreign.length > 0) throw new Error(`URLs de otro dominio: ${foreign.join(", ")}`);
  if (urls.length === 0) throw new Error("No hay URLs para enviar.");

  await assertKeyIsServed();
  for (let start = 0; start < urls.length; start += BATCH_SIZE) {
    const batch = urls.slice(start, start + BATCH_SIZE);
    const status = await submit(batch);
    console.log(`IndexNow: ${batch.length} URLs enviadas (HTTP ${status}).`);
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
