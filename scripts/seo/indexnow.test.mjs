import assert from "node:assert/strict";
import test from "node:test";
import { main, SITE_URL, withMarkdownUrls } from "./indexnow.mjs";

const KEY = "9ada441fddd4d2d1a6dbc325c889aa0a";
const PRODUCT = `${SITE_URL}/tienda/productos/ray-ban-aviador-3025-abc12`;
const SITEMAP = `<urlset>${[SITE_URL, `${SITE_URL}/tienda/marcas/ray-ban/aviador`, PRODUCT]
  .map((url) => `<url><loc>${url}</loc></url>`)
  .join("")}</urlset>`;

/** Runs main() with fetch mocked; returns the URL lists submitted to IndexNow. */
async function runMocked(args) {
  const submitted = [];
  const realFetch = globalThis.fetch;
  const realLog = console.log;
  globalThis.fetch = async (url, init) => {
    if (String(url) === `${SITE_URL}/sitemap.xml`) return new Response(SITEMAP);
    if (String(url) === `${SITE_URL}/${KEY}.txt`) return new Response(KEY);
    if (String(url) === "https://api.indexnow.org/indexnow") {
      submitted.push(JSON.parse(init.body).urlList);
      return new Response("", { status: 200 });
    }
    throw new Error(`unexpected request to ${url}`);
  };
  console.log = () => {};
  try {
    await main(args);
  } finally {
    globalThis.fetch = realFetch;
    console.log = realLog;
  }
  return submitted;
}

test("every product URL gets its .md variant; other URLs do not", () => {
  const urls = [SITE_URL, `${SITE_URL}/tienda/marcas/ray-ban`, PRODUCT, `${SITE_URL}/tienda/productos/otro-1`];
  assert.deepEqual(withMarkdownUrls(urls), [...urls, `${PRODUCT}.md`, `${SITE_URL}/tienda/productos/otro-1.md`]);
});

test(".md variants are not duplicated", () => {
  const urls = [PRODUCT, `${PRODUCT}.md`];
  assert.deepEqual(withMarkdownUrls(urls), urls);
});

test("the default run submits the sitemap URLs and the .md copy of each product", async () => {
  const [batch, ...rest] = await runMocked([]);
  assert.equal(rest.length, 0);
  assert.deepEqual(batch, [SITE_URL, `${SITE_URL}/tienda/marcas/ray-ban/aviador`, PRODUCT, `${PRODUCT}.md`]);
});

test("explicit URLs are submitted as given, without adding .md variants", async () => {
  assert.deepEqual(await runMocked([PRODUCT]), [[PRODUCT]]);
});
