import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { publishedOnly } from "../../lib/catalog-published.mjs";
import {
  buildMerchantFeed,
  feedDescription,
  GOOGLE_PRODUCT_CATEGORIES,
  MAX_ADDITIONAL_IMAGES,
  merchantGender,
  merchantPrice,
  variantColor,
} from "../../lib/merchant-feed.mjs";
import { descriptionLines, fallbackDescription, splitDescription } from "../../lib/product-copy.mjs";
import { getAvailableVariants, getDisplayPrice } from "../../lib/storefront.mjs";

const projectRoot = process.cwd();
// The products the site lists (lib/catalog.ts drops unpublished ones).
const catalog = publishedOnly(
  JSON.parse(fs.readFileSync(path.join(projectRoot, "data/tiendanube-catalog.json"), "utf8")),
);

const SITE_URL = "https://smiletiendaimp.com.ar";
const CHANNEL = { title: "Smile", link: SITE_URL, description: "Anteojos de sol y relojes." };
const PAYMENT = {
  installments: "6 cuotas sin interés",
  transferDiscount: "10% off por transferencia",
  checkout: "checkout seguro de Tiendanube",
};
// Store, payment and shipping wording that must stay out of titles and
// descriptions.
const STORE_WORDING = /\bsmile\b|tiendanube|checkout|whats\s?app|cuotas|transferencia|descuento|env[ií]o|gratis/i;

// Mirrors lib/product-meta's getProductCopy: the description lines, else the
// catalog-facts fallback, which the page shows with the payment terms.
function copyFor(product) {
  const lines = descriptionLines(product.descriptionHtml);
  if (lines.length > 0) return splitDescription(lines);
  const description = fallbackDescription(product, {
    brand: product.brand,
    name: product.name,
    collection: ["Relojes", "Tommy Hilfiger"],
    payment: PAYMENT,
  });
  return { paragraphs: [description], specs: [] };
}

// Same rule as lib/catalog's hasPurchasableStock.
function isPurchasable(product) {
  return product.variants.some(
    (variant) =>
      product.tiendanubeProductId !== null &&
      variant.id !== null &&
      variant.available &&
      variant.stock > 0,
  );
}

function factsFor(product) {
  return {
    title: product.name,
    brand: product.brand,
    mpn: null,
    link: `${SITE_URL}/tienda/productos/${product.slug}`,
    purchasable: isPurchasable(product),
    copy: copyFor(product),
  };
}

function build(products) {
  return buildMerchantFeed({
    channel: CHANNEL,
    siteUrl: SITE_URL,
    entries: products.map((product) => ({ product, facts: factsFor(product) })),
  });
}

// A strict well-formedness check for the subset of XML the feed uses: one
// root, balanced and properly nested elements, quoted attributes, declared
// namespace prefixes, and text with only the predefined entities or numeric
// references. Returns the element tree with decoded text.
const NAME = "[A-Za-z_][\\w.-]*(?::[A-Za-z_][\\w.-]*)?";
const TOKEN = new RegExp(
  [
    "(<\\?xml\\b[^?]*\\?>)",
    "(<!--[\\s\\S]*?-->)",
    `<(/?)(${NAME})((?:\\s+${NAME}\\s*=\\s*(?:"[^"<]*"|'[^'<]*'))*)\\s*(/?)>`,
    "(<)",
    "([^<]+)",
  ].join("|"),
  "y",
);
const ENTITY = /&(amp|lt|gt|quot|apos|#\d+|#x[0-9a-fA-F]+);/g;
const ENTITIES = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'" };
const INVALID_XML_CHARS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F￾￿]/;

function decodeText(raw) {
  assert.doesNotMatch(raw, INVALID_XML_CHARS, "text has characters XML 1.0 forbids");
  assert.doesNotMatch(raw.replace(ENTITY, ""), /[&<]/, `unescaped markup in ${raw}`);
  return raw.replace(ENTITY, (_, token) => {
    if (token.startsWith("#x")) return String.fromCodePoint(Number.parseInt(token.slice(2), 16));
    if (token.startsWith("#")) return String.fromCodePoint(Number.parseInt(token.slice(1), 10));
    return ENTITIES[token];
  });
}

function parseXml(xml) {
  const stack = [];
  let root = null;
  let index = 0;
  TOKEN.lastIndex = 0;

  while (TOKEN.lastIndex < xml.length) {
    const start = TOKEN.lastIndex;
    const match = TOKEN.exec(xml);
    assert.ok(match, `unparseable XML at offset ${start}`);
    const [, declaration, comment, closing, name, attributes, selfClosing, strayLt, text] = match;
    index += 1;

    if (declaration) {
      assert.equal(start, 0, "the XML declaration must come first");
      continue;
    }
    if (comment) continue;
    assert.equal(strayLt, undefined, `stray "<" at offset ${start}`);

    if (text !== undefined) {
      if (stack.length === 0) {
        assert.match(text, /^\s*$/, "text outside the root element");
      } else {
        stack[stack.length - 1].text += decodeText(text);
      }
      continue;
    }

    if (closing) {
      const open = stack.pop();
      assert.ok(open, `closing </${name}> without an open element`);
      assert.equal(name, open.name, `</${name}> closes <${open.name}>`);
      continue;
    }

    const attrs = {};
    for (const [, key, value] of attributes.matchAll(new RegExp(`(${NAME})\\s*=\\s*(?:"([^"]*)"|'([^']*)')`, "g"))) {
      assert.equal(attrs[key], undefined, `repeated attribute ${key}`);
      attrs[key] = decodeText(value ?? "");
    }
    const node = { name, attrs, children: [], text: "", parent: stack[stack.length - 1] ?? null };

    // Namespace prefixes must be declared on the element or an ancestor.
    const prefix = name.includes(":") ? name.split(":")[0] : null;
    if (prefix) {
      let declared = false;
      for (let scope = node; scope; scope = scope.parent) {
        if (scope.attrs[`xmlns:${prefix}`]) declared = true;
      }
      assert.ok(declared, `undeclared namespace prefix ${prefix}`);
    }

    if (node.parent) node.parent.children.push(node);
    else {
      assert.equal(root, null, "more than one root element");
      root = node;
    }
    if (!selfClosing) stack.push(node);
  }

  assert.equal(stack.length, 0, `unclosed <${stack[stack.length - 1]?.name}>`);
  assert.ok(root, "no root element");
  assert.ok(index > 0);
  return root;
}

function childrenNamed(node, name) {
  return node.children.filter((child) => child.name === name);
}

function field(item, name) {
  const matches = childrenNamed(item, name);
  assert.ok(matches.length <= 1, `repeated ${name}`);
  return matches[0]?.text;
}

const feed = build(catalog);
const rss = parseXml(feed.xml);
const [channel] = childrenNamed(rss, "channel");
const xmlItems = childrenNamed(channel, "item");
const productById = new Map(catalog.map((product) => [String(product.id), product]));

test("feed is well-formed RSS 2.0 in the Google Merchant namespace", () => {
  assert.equal(rss.name, "rss");
  assert.equal(rss.attrs.version, "2.0");
  assert.equal(rss.attrs["xmlns:g"], "http://base.google.com/ns/1.0");
  assert.equal(childrenNamed(rss, "channel").length, 1);
  assert.equal(field(channel, "link"), SITE_URL);
  assert.equal(xmlItems.length, feed.items.length);
  assert.equal(feed.items.length + feed.excluded.length, catalog.length);
});

test("markup and control characters in catalog text are escaped or dropped", () => {
  const [product] = catalog;
  const { xml, items } = buildMerchantFeed({
    channel: { ...CHANNEL, title: "Smile & Co <test>" },
    siteUrl: SITE_URL,
    entries: [
      {
        product,
        facts: {
          ...factsFor(product),
          title: `Ray-Ban "Erika" & <b>Wayfarer</b>\u0007`,
          copy: { paragraphs: ["Acetato <i>negro</i> & lentes 'G-15'.\u0001"], specs: [] },
        },
      },
    ],
  });
  const [item] = childrenNamed(childrenNamed(parseXml(xml), "channel")[0], "item");

  assert.equal(items.length, 1);
  assert.equal(field(item, "g:title"), `Ray-Ban "Erika" & Wayfarer`);
  assert.equal(field(item, "g:description"), "Acetato negro & lentes 'G-15'.");
});

test("every item carries the attributes free listings require", () => {
  assert.ok(xmlItems.length > 0);
  const categories = new Set(Object.values(GOOGLE_PRODUCT_CATEGORIES).map(String));

  for (const item of xmlItems) {
    const id = field(item, "g:id");
    for (const name of [
      "g:id",
      "g:title",
      "g:description",
      "g:link",
      "g:image_link",
      "g:availability",
      "g:price",
      "g:condition",
      "g:brand",
      "g:age_group",
    ]) {
      assert.ok(field(item, name)?.trim(), `item ${id} lacks ${name}`);
    }

    assert.ok(id.length <= 50, `item ${id}: id over 50 characters`);
    assert.ok(field(item, "g:title").length <= 150, `item ${id}: title over 150 characters`);
    assert.ok(field(item, "g:description").length <= 5000, `item ${id}: description over 5000 characters`);
    assert.equal(field(item, "g:condition"), "new");
    assert.equal(field(item, "g:age_group"), "adult");
    assert.ok(categories.has(field(item, "g:google_product_category")), `item ${id}: category`);
    assert.ok(
      childrenNamed(item, "g:additional_image_link").length <= MAX_ADDITIONAL_IMAGES,
      `item ${id}: more than ${MAX_ADDITIONAL_IMAGES} additional images`,
    );
    // Brand plus MPN, or no identifiers at all.
    assert.ok(
      field(item, "g:mpn") || field(item, "g:identifier_exists") === "no",
      `item ${id}: needs an MPN or identifier_exists no`,
    );
    const gender = field(item, "g:gender");
    assert.ok(gender === undefined || ["male", "female", "unisex"].includes(gender));
  }
});

test("prices are the price the product page displays, in ARS", () => {
  for (const item of xmlItems) {
    const product = productById.get(field(item, "g:id"));
    // ProductDetailClient: getDisplayPrice(product, first available variant).
    const displayed = getDisplayPrice(product, getAvailableVariants(product)[0] ?? null);

    assert.match(field(item, "g:price"), /^\d+\.\d{2} ARS$/);
    assert.equal(field(item, "g:price"), `${displayed}.00 ARS`, `${product.slug}`);
    // The page shows no regular price next to a promotional one.
    assert.equal(childrenNamed(item, "g:sale_price").length, 0);
  }

  assert.equal(merchantPrice(182700), "182700.00 ARS");
  assert.equal(merchantPrice(1234.5), "1235.00 ARS");
});

test("promotional and per-variant prices follow the page, not the lowest price", () => {
  const itemFor = (slug) => feed.items.find((item) => productById.get(item.id).slug === slug);
  const promoted = catalog.find(
    (product) =>
      product.promotionalPrice !== null &&
      product.variants.length === 1 &&
      product.variants[0].promotionalPrice === product.promotionalPrice,
  );
  assert.ok(promoted, "the catalog has a single-variant product on promotion");
  assert.equal(itemFor(promoted.slug).price, merchantPrice(promoted.promotionalPrice));

  // The page selects the first in-stock variant, even when another is cheaper.
  const firstNotCheapest = catalog.find((product) => {
    const [first, ...rest] = getAvailableVariants(product);
    const price = (variant) => variant.promotionalPrice ?? variant.price;
    return first && rest.some((variant) => price(variant) < price(first));
  });
  if (firstNotCheapest) {
    const [first] = getAvailableVariants(firstNotCheapest);
    assert.equal(
      itemFor(firstNotCheapest.slug).price,
      merchantPrice(first.promotionalPrice ?? first.price),
    );
  }
});

test("availability follows real stock and out-of-stock products stay listed", () => {
  for (const item of feed.items) {
    const product = productById.get(item.id);
    const inStock = isPurchasable(product) && getAvailableVariants(product).length > 0;
    assert.equal(item.availability, inStock ? "in_stock" : "out_of_stock", product.slug);
  }
  const outOfStock = catalog.filter((product) => !isPurchasable(product));
  assert.ok(
    outOfStock.every((product) => feed.items.some((item) => item.id === String(product.id))),
    "out-of-stock products are listed as out_of_stock, not dropped",
  );
});

test("titles and descriptions are plain text without store or payment terms", () => {
  for (const item of xmlItems) {
    const id = field(item, "g:id");
    const title = field(item, "g:title");
    const description = field(item, "g:description");

    assert.doesNotMatch(description, /<[^>]*>/, `item ${id}: HTML in description`);
    assert.doesNotMatch(title, /<[^>]*>/, `item ${id}: HTML in title`);
    assert.doesNotMatch(description, STORE_WORDING, `item ${id}: ${description}`);
    assert.doesNotMatch(title, STORE_WORDING, `item ${id}: ${title}`);
    assert.doesNotMatch(description, /\s{2,}/, `item ${id}: repeated whitespace`);
  }
});

test("links and images are absolute https URLs; product links use the canonical domain", () => {
  for (const item of xmlItems) {
    const product = productById.get(field(item, "g:id"));
    assert.equal(field(item, "g:link"), `${SITE_URL}/tienda/productos/${product.slug}`);

    const images = [
      field(item, "g:image_link"),
      ...childrenNamed(item, "g:additional_image_link").map((node) => node.text),
    ];
    assert.equal(new Set(images).size, images.length, `${product.slug}: repeated image`);
    for (const image of images) {
      assert.equal(new URL(image).protocol, "https:", `${product.slug}: ${image}`);
    }
  }

  // Images stored as site paths resolve against the canonical domain.
  const local = catalog.find((product) => product.images.some((image) => image.startsWith("/")));
  if (local) {
    const item = feed.items.find((entry) => entry.id === String(local.id));
    const localImage = local.images.find((image) => image.startsWith("/"));
    assert.ok([item.imageLink, ...item.additionalImageLinks].includes(`${SITE_URL}${localImage}`));
  }
});

test("item ids are unique", () => {
  const ids = xmlItems.map((item) => field(item, "g:id"));
  assert.equal(new Set(ids).size, ids.length);
});

test("products without an image or a price are left out with the reason", () => {
  const [product] = catalog;
  const noImage = {
    ...product,
    id: "no-image",
    images: [],
    variants: product.variants.map((variant) => ({ ...variant, image: null })),
  };
  const noPrice = {
    ...product,
    id: "no-price",
    price: null,
    promotionalPrice: null,
    variants: product.variants.map((variant) => ({ ...variant, price: null, promotionalPrice: null })),
  };
  const { items, excluded } = build([noImage, noPrice, product]);

  assert.deepEqual(items.map((item) => item.id), [String(product.id)]);
  assert.deepEqual(
    excluded.map(({ id, reason }) => ({ id, reason })),
    [
      { id: "no-image", reason: "no image" },
      { id: "no-price", reason: "no price" },
    ],
  );
});

test("descriptions keep product facts and drop store, payment and contact sentences", () => {
  const product = {
    name: "Reloj Tommy Hilfiger 1782779",
    categories: ["RELOJES", "TOMMY HILFIGER DAMA"],
    tags: [],
    variants: [{ sku: "", options: [] }],
  };
  const fallback = fallbackDescription(product, {
    brand: "Tommy Hilfiger",
    name: "Reloj Tommy Hilfiger 1782779",
    collection: ["Relojes", "Tommy Hilfiger"],
    payment: PAYMENT,
  });
  const description = feedDescription({ paragraphs: [fallback], specs: [] });

  assert.match(fallback, /cuotas|WhatsApp|Smile/);
  assert.equal(
    description,
    "El Tommy Hilfiger 1782779 es un reloj para dama. Tommy Hilfiger es una marca estadounidense fundada en 1985. Su número de modelo es 1782779.",
  );

  assert.equal(
    feedDescription({
      paragraphs: ["Son 100% originales.", "Incluye:", "Estuche rígido", "Envío gratis a todo el país."],
      specs: [{ name: "Protección", value: "UV400" }],
    }),
    "Son 100% originales. Incluye: Estuche rígido. Protección: UV400.",
  );

  const long = feedDescription({ paragraphs: [`${"Montura de acetato. ".repeat(400)}`], specs: [] });
  assert.ok(long.length <= 5000);
  assert.ok(long.length > 4900);
});

test("colors come from the variant's color option, never from its size", () => {
  assert.equal(variantColor({ options: ["STANDARD (M)", "negro/verde"] }), "Negro/Verde");
  assert.equal(variantColor({ options: ["Dorado/Marrón degradé", "LARGE (L)"] }), "Dorado/Marrón degradé");
  assert.equal(
    variantColor({ options: ["Negro/ gris degrade ( punta patilla negra)"] }),
    "Negro/Gris degrade",
  );
  assert.equal(variantColor({ options: ["STANDARD (M)"] }), null);
  assert.equal(variantColor({ options: [] }), null);
});

test("gender comes from the spec table, then the gender tags and categories", () => {
  const noAudience = { categories: ["LENTES DE SOL"], tags: [] };
  assert.equal(
    merchantGender(noAudience, [{ name: "Género", value: "Hombre y Mujer (Unisex)" }]),
    "unisex",
  );
  assert.equal(merchantGender(noAudience, [{ name: "Género", value: "Mujer" }]), "female");
  assert.equal(merchantGender({ categories: ["RELOJES", "TOMMY HILFIGER DAMA"], tags: [] }), "female");
  assert.equal(merchantGender({ categories: ["RELOJES", "TOMMY HILFIGER CABALLERO"], tags: [] }), "male");
  assert.equal(merchantGender(noAudience), null);
});

test("the feed route is static XML built from the page's own helpers, outside the sitemap", () => {
  const route = fs.readFileSync(path.join(projectRoot, "app/feeds/google-merchant.xml/route.ts"), "utf8");
  assert.match(route, /export const dynamic = "force-static"/);
  assert.match(route, /"Content-Type": "application\/xml; charset=utf-8"/);
  assert.match(route, /title: seo\.displayName/);
  assert.match(route, /purchasable: hasPurchasableStock\(product\)/);
  assert.match(route, /copy: getProductCopy\(product\)/);
  assert.match(route, /link: productUrl\(product\)/);

  const sitemap = fs.readFileSync(path.join(projectRoot, "app/sitemap.ts"), "utf8");
  const robots = fs.readFileSync(path.join(projectRoot, "app/robots.ts"), "utf8");
  assert.doesNotMatch(sitemap, /feeds/);
  assert.doesNotMatch(robots, /feeds/);
});
