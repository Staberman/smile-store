import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { HOME_GRID_PREVIEW_COUNT } from "../../lib/home-catalog.mjs";

// Checks the prerendered homepage of the last `npm run build`. Skipped when
// there is none (test:catalog runs before the build in CI); every file read
// comes from the same build, so a catalog sync after it cannot make them
// disagree.
const appDir = path.join(process.cwd(), ".next/server/app");
const homeFile = path.join(appDir, "index.html");
const skip = fs.existsSync(homeFile) ? false : "no production build: run npm run build first";

const readBuild = (relativePath) => fs.readFileSync(path.join(appDir, relativePath), "utf8");
// Markup only: the inline RSC payload repeats props as JSON, not as links.
const markup = (html) => html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/g, "");
const productLinks = (html) =>
  new Set([...markup(html).matchAll(/href="\/tienda\/productos\/([^"#?]+)"/g)].map((m) => m[1]));
const hubLinks = (html) =>
  new Set(
    [...markup(html).matchAll(/href="(\/tienda\/(?!productos\/)[^"#?]+)"/g)].map((m) => m[1]),
  );

test("the built homepage stays short and puts its intro and FAQ early", { skip }, () => {
  const html = fs.readFileSync(homeFile, "utf8");
  const bytes = Buffer.byteLength(html);
  const offset = (text) => Buffer.byteLength(html.slice(0, html.indexOf(text)));

  assert.ok(bytes < 350_000, `homepage HTML is ${bytes} bytes`);
  assert.equal((markup(html).match(/<h1\b/g) ?? []).length, 1);
  assert.ok(offset('<h1 class="sr-only"') < 20_000, "intro within the first 20 KB");
  assert.ok(html.includes("Preguntas frecuentes"));
  assert.ok(offset("Preguntas frecuentes") < 200_000, "FAQ within the first 200 KB");

  const jsonLd = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
  const types = jsonLd.map(([, body]) => JSON.parse(body)).map((data) => data["@type"] ?? "graph");
  assert.ok(types.includes("FAQPage"), `JSON-LD types: ${types.join(", ")}`);
});

test("the built homepage server-renders a bounded set of product links", { skip }, () => {
  const html = fs.readFileSync(homeFile, "utf8");
  const storeProducts = JSON.parse(readBuild("store-products.json.body"));
  const links = productLinks(html);

  assert.ok(links.size >= HOME_GRID_PREVIEW_COUNT, `${links.size} product links`);
  assert.ok(links.size <= HOME_GRID_PREVIEW_COUNT * 3, `${links.size} product links`);
  assert.ok(links.size < storeProducts.length / 2);
  // The full list stays out of the page: only the preview is inline.
  const inlineSlugs = storeProducts.filter((product) => html.includes(`\\"slug\\":\\"${product.slug}\\"`));
  assert.ok(inlineSlugs.length < storeProducts.length / 2, `${inlineSlugs.length} products inline`);
});

test("the built homepage counts only the grid cards it renders", { skip }, () => {
  const html = markup(fs.readFileSync(homeFile, "utf8"));
  const grid = html.slice(html.indexOf('id="catalogo"'), html.indexOf('id="relojes-destacados"'));
  // React separates text parts with <!-- -->: "16<!-- --> <!-- -->productos".
  const label = /(\d+)(?:<!-- -->| )+productos?</.exec(grid);
  assert.ok(label, "the grid shows a product count");
  assert.equal(Number(label[1]), productLinks(grid).size);
});

test("every product the homepage loads lazily is linked from a hub it links, and in the sitemap", { skip }, () => {
  const html = fs.readFileSync(homeFile, "utf8");
  const storeProducts = JSON.parse(readBuild("store-products.json.body"));
  const hubs = [...hubLinks(html)];
  assert.ok(hubs.includes("/tienda/anteojos-de-sol"), hubs.join(", "));
  assert.ok(hubs.includes("/tienda/relojes"), hubs.join(", "));

  const linkedFromHubs = new Set(
    hubs.flatMap((hub) => {
      const file = `${hub.slice(1)}.html`;
      return fs.existsSync(path.join(appDir, file)) ? [...productLinks(readBuild(file))] : [];
    }),
  );
  const sitemap = readBuild("sitemap.xml.body");

  for (const { slug } of storeProducts) {
    assert.ok(linkedFromHubs.has(slug), `${slug} is not linked from any hub the homepage links`);
    assert.ok(sitemap.includes(`/tienda/productos/${slug}</loc>`), `${slug} is not in the sitemap`);
  }
});
