import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { publishedOnly } from "../../lib/catalog-published.mjs";
import { buildProductMarkdown } from "../../lib/llms-text.mjs";
import { formatPrice } from "../../lib/price-format.mjs";
import {
  FREE_SHIPPING_PHRASE,
  INSTALLMENTS_PHRASE,
  STORE_LOCATION,
  STORE_PICKUP_PHRASE,
  TRANSFER_DISCOUNT_PHRASE,
} from "../../lib/store-copy.mjs";
import {
  getAvailableVariants,
  getDisplayPrice,
  getInstallmentPrice,
  getTransferPrice,
} from "../../lib/storefront.mjs";

// The Markdown copy of every product page (/tienda/productos/<slug>.md).
// Nothing here depends on today's stock: it checks the rules against whatever
// the catalog holds, in stock or not.

const projectRoot = process.cwd();
const read = (relativePath) => fs.readFileSync(path.join(projectRoot, relativePath), "utf8");
const catalog = publishedOnly(JSON.parse(read("data/tiendanube-catalog.json")));

const SITE_URL = "https://smiletiendaimp.com.ar";
const purchasable = (product) =>
  product.tiendanubeProductId !== null &&
  product.variants.some((variant) => variant.id !== null && variant.available && variant.stock > 0);

const render = (product, extra = {}) =>
  buildProductMarkdown({
    siteUrl: SITE_URL,
    entry: {
      product,
      facts: { name: product.name, brand: product.brand, purchasable: purchasable(product), ...extra },
    },
  });

test("every product's Markdown states its name, price, payment terms and URL", () => {
  assert.ok(catalog.length > 0);
  for (const product of catalog) {
    const markdown = render(product);
    assert.ok(markdown.startsWith(`# ${product.name}\n`), product.slug);
    assert.ok(markdown.includes(`- Marca: ${product.brand}`), product.slug);
    assert.ok(markdown.includes(`${SITE_URL}/tienda/productos/${product.slug}`), product.slug);

    const variant = getAvailableVariants(product)[0] ?? product.variants[0] ?? null;
    const price = getDisplayPrice(product, variant);
    assert.ok(markdown.includes(`- Precio: ${formatPrice(price)}`), product.slug);
    if (price !== null) {
      assert.ok(
        markdown.includes(`- Precio con transferencia: ${formatPrice(getTransferPrice(price))} (${TRANSFER_DISCOUNT_PHRASE})`),
        product.slug,
      );
      assert.ok(
        markdown.includes(`${INSTALLMENTS_PHRASE} de ${formatPrice(getInstallmentPrice(price))}`),
        product.slug,
      );
    }
  }
});

test("stock status follows the catalog and is never invented", () => {
  for (const product of catalog) {
    const markdown = render(product);
    const line = purchasable(product) ? "- Disponibilidad: en stock" : "- Disponibilidad: sin stock";
    assert.ok(markdown.includes(line), product.slug);
    assert.equal(markdown.split("- Disponibilidad:").length - 1, 1, product.slug);
  }
});

test("shipping and pickup use the site's own wording and no warranty or returns claims", () => {
  for (const product of catalog) {
    const markdown = render(product);
    assert.ok(markdown.includes(`Envíos a todo el país o ${STORE_PICKUP_PHRASE}, ${STORE_LOCATION.locality}.`));
    assert.ok(markdown.includes(`${FREE_SHIPPING_PHRASE}.`));
    // The product page states neither: the owner has yet to confirm wording.
    // (Catalog specs are Tiendanube's own text, so only the sections the
    // store writes are checked.)
    const storeText = markdown.replace(/## Especificaciones[\s\S]*?\n(?=## )/, "");
    assert.doesNotMatch(storeText, /garant[ií]a|devoluci[oó]n|cambio de/i, product.slug);
  }
});

test("the model code and the collection link appear only when given", () => {
  const [product] = catalog;
  const plain = render(product);
  assert.doesNotMatch(plain, /- Modelo:|- Colección:/);

  const full = buildProductMarkdown({
    siteUrl: SITE_URL,
    entry: {
      product,
      facts: { name: product.name, brand: product.brand, purchasable: true, mpn: "RB3025" },
    },
    collection: { name: "Ray-Ban Aviador", path: "/tienda/marcas/ray-ban/aviador" },
    paragraphs: ["Una descripción."],
  });
  assert.ok(full.includes("- Modelo: RB3025"));
  assert.ok(full.includes(`- Colección: [Ray-Ban Aviador](${SITE_URL}/tienda/marcas/ray-ban/aviador)`));
  assert.ok(full.includes("\nUna descripción.\n"));
});

test("the .md URL is rewritten ahead of the dynamic product page and served as Markdown", () => {
  const config = read("next.config.mjs");
  assert.match(config, /beforeFiles/);
  assert.match(config, /\/tienda\/productos\/:slug\(\[\^\/\]\+\)\\\\\.md/);
  assert.match(config, /destination: "\/tienda\/productos-markdown\/:slug"/);

  const route = read("app/tienda/productos-markdown/[slug]/route.ts");
  assert.match(route, /dynamic = "force-static"/);
  assert.match(route, /dynamicParams = false/);
  assert.match(route, /"Content-Type": "text\/markdown; charset=utf-8"/);
  assert.match(route, /Link: `<\$\{productUrl\(product\)\}>; rel="canonical"`/);
  // Same source and visibility filter as the HTML page.
  assert.match(route, /allProductsIncludingOutOfStock\.map/);
  assert.match(route, /getProductBySlug\(params\.slug\)/);
});

test("product pages link their Markdown copy and the sitemap does not list it", () => {
  assert.match(read("app/tienda/productos/[slug]/page.tsx"), /types: \{ "text\/markdown": `\$\{path\}\.md` \}/);
  assert.doesNotMatch(read("app/sitemap.ts"), /\.md/);
});
