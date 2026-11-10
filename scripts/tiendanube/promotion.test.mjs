import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { publishedOnly } from "../../lib/catalog-published.mjs";
import { buildLlmsFull, buildProductMarkdown, llmsProduct } from "../../lib/llms-text.mjs";
import { buildMerchantFeed, merchantPrice } from "../../lib/merchant-feed.mjs";
import { formatPrice } from "../../lib/price-format.mjs";
import {
  productOffers,
  STRIKETHROUGH_PRICE_TYPE,
  strikethroughPrice,
} from "../../lib/product-offers.mjs";
import {
  discountPercent,
  getAvailableVariants,
  getDisplayPrice,
  getInstallmentPrice,
  getPromotion,
  getTransferPrice,
} from "../../lib/storefront.mjs";

// Promotions: a variant's synced promotionalPrice below its own price. The
// page, the cards, the Merchant feed, the JSON-LD and the text copies all
// read them through lib/storefront.mjs getPromotion.

const projectRoot = process.cwd();
const read = (relativePath) => fs.readFileSync(path.join(projectRoot, relativePath), "utf8");
const catalog = publishedOnly(JSON.parse(read("data/tiendanube-catalog.json")));

const SITE_URL = "https://smiletiendaimp.com.ar";
const SELLER = `${SITE_URL}/#organization`;
const NOW = Date.UTC(2026, 10, 10);

const variant = (id, price, promotionalPrice, { stock = 1 } = {}) => ({
  id,
  sku: `SKU-${id}`,
  options: [],
  price,
  promotionalPrice,
  stock,
  available: stock > 0,
  image: null,
});

/** A catalog product with these variants, aggregated as the sync does. */
function product(variants, overrides = {}) {
  const prices = variants.map((entry) => entry.price).filter((price) => price !== null);
  const promotional = variants.map((entry) => entry.promotionalPrice).filter((price) => price !== null);
  return {
    ...catalog[0],
    id: "promo-test",
    slug: "producto-promo",
    tiendanubeProductId: 1,
    price: prices.length > 0 ? Math.min(...prices) : null,
    promotionalPrice: promotional.length > 0 ? Math.min(...promotional) : null,
    images: ["https://example.com/a.jpg"],
    variants,
    ...overrides,
  };
}

const purchasable = (item) =>
  item.tiendanubeProductId !== null &&
  item.variants.some((entry) => entry.id !== null && entry.available && entry.stock > 0);

// ── The discount badge ───────────────────────────────────────────────────────

test("the discount is a whole percent, rounded down so it never overstates", () => {
  assert.equal(discountPercent(228375, 182700), 20, "exactly 20%");
  assert.equal(discountPercent(100, 80), 20);
  assert.equal(discountPercent(3, 2), 33, "33.3% shows 33");
  assert.equal(discountPercent(200000, 133334), 33, "33.333% shows 33");
  assert.equal(discountPercent(100000, 70001), 29, "29.999% shows 29, not 30");
  assert.equal(discountPercent(215000, 182700), 15, "15.02% shows 15");
  assert.equal(discountPercent(100000, 99500), 0, "under 1% shows no percent");
  assert.equal(discountPercent(100000, 1), 99, "99.999% shows 99");
});

test("no discount without a positive promotional price below the price", () => {
  assert.equal(discountPercent(100000, 100000), 0, "equal");
  assert.equal(discountPercent(100000, 120000), 0, "higher");
  assert.equal(discountPercent(100000, 0), 0, "zero");
  assert.equal(discountPercent(100000, -5000), 0, "negative");
  assert.equal(discountPercent(100000, null), 0, "null");
  assert.equal(discountPercent(100000, undefined), 0, "undefined");
  assert.equal(discountPercent(null, 80000), 0, "no regular price");
  assert.equal(discountPercent(Number.NaN, 80000), 0, "not a number");
  assert.equal(discountPercent(100000.4, 99999.6), 0, "the same whole pesos on the page");
});

// ── The promotion of a variant ───────────────────────────────────────────────

test("a purchasable variant below its own price is on promotion", () => {
  const promoted = variant(1, 228375, 182700);
  assert.deepEqual(getPromotion(product([promoted]), promoted), { regularPrice: 228375, discountPercent: 20 });
});

test("a promotional price that is equal, higher, zero or missing is no promotion", () => {
  for (const promotional of [228375, 300000, 0, -1, null]) {
    const entry = variant(1, 228375, promotional);
    assert.equal(getPromotion(product([entry]), entry), null, String(promotional));
  }
});

test("a sold-out variant shows no promotion, nor does a sold-out product", () => {
  const soldOut = variant(1, 228375, 182700, { stock: 0 });
  const item = product([soldOut]);
  assert.equal(getPromotion(item, soldOut), null);
  assert.equal(getPromotion(item, null), null, "the product-level price of a sold-out product");
  const noId = { ...variant(1, 228375, 182700), id: null };
  assert.equal(getPromotion(product([noId]), noId), null, "a variant without id cannot be bought");
});

test("a variant without prices falls back to the product-level promotion", () => {
  const unpriced = variant(1, null, null);
  const promoted = variant(2, 250000, 200000);
  const item = product([unpriced, promoted]);
  assert.equal(getDisplayPrice(item, unpriced), 200000);
  assert.deepEqual(getPromotion(item, unpriced), { regularPrice: 250000, discountPercent: 20 });
});

test("the product-level price takes the regular price of a purchasable variant at that promotional price", () => {
  // Product-level price (lowest price) and promotional price (lowest
  // promotional price) come from different variants: 200.000 is not the
  // regular price of the 150.000 offer.
  const item = product([variant(1, 200000, null), variant(2, 300000, 150000), variant(3, 250000, 150000)]);
  assert.equal(item.price, 200000);
  assert.equal(getDisplayPrice(item, null), 150000);
  assert.deepEqual(getPromotion(item, null), { regularPrice: 250000, discountPercent: 40 }, "the lowest regular price");

  // Round Metal Classic 3447 in the catalog: 159.900 is the promotional
  // price of a sold-out variant, so no regular price backs it.
  const roundMetal = product([variant(1, 210105, 182700), variant(2, 215000, 159900, { stock: 0 })]);
  assert.equal(getDisplayPrice(roundMetal, null), 159900);
  assert.equal(getPromotion(roundMetal, null), null);
});

test("transfer and installment amounts come from the price charged", () => {
  const promoted = variant(1, 228375, 182700);
  const charged = getDisplayPrice(product([promoted]), promoted);
  assert.equal(charged, 182700);
  assert.equal(getTransferPrice(charged), getTransferPrice(182700));
  assert.equal(getInstallmentPrice(charged), getInstallmentPrice(182700));
});

// ── Text copies ──────────────────────────────────────────────────────────────

const entry = (item) => ({
  product: item,
  facts: { name: "Ray-Ban Erika", brand: "Ray-Ban", purchasable: purchasable(item) },
});

test("the Markdown copy states the regular price next to a promotional one", () => {
  const promoted = product([variant(1, 228375, 182700)]);
  const markdown = buildProductMarkdown({ siteUrl: SITE_URL, entry: entry(promoted) });
  assert.ok(markdown.includes(`\n- Precio: ${formatPrice(182700)} (antes ${formatPrice(228375)})\n`), markdown);
  // The payment lines stay on the price charged.
  assert.ok(markdown.includes(`- Precio con transferencia: ${formatPrice(getTransferPrice(182700))} (`));
  assert.ok(markdown.includes(`de ${formatPrice(getInstallmentPrice(182700))}`));
  assert.equal(llmsProduct(entry(promoted), SITE_URL).regularPrice, formatPrice(228375));
});

test("without a promotion the Markdown copy states one price, as before", () => {
  for (const item of [
    product([variant(1, 228375, null)]),
    product([variant(1, 228375, 228375)]),
    product([variant(1, 228375, 182700, { stock: 0 })]),
  ]) {
    const markdown = buildProductMarkdown({ siteUrl: SITE_URL, entry: entry(item) });
    const price = getDisplayPrice(item, getAvailableVariants(item)[0] ?? null);
    assert.ok(markdown.includes(`\n- Precio: ${formatPrice(price)}\n`), markdown);
    assert.doesNotMatch(markdown, /antes/);
    assert.equal(llmsProduct(entry(item), SITE_URL).regularPrice, null);
  }
});

test("llms-full.txt lists the regular price of products on promotion only", () => {
  const promoted = product([variant(1, 228375, 182700)], { slug: "en-oferta" });
  const plain = product([variant(2, 199000, null)], { id: "plain", slug: "sin-oferta" });
  const text = buildLlmsFull({
    siteUrl: SITE_URL,
    store: { name: "Smile", alternateName: "Smile Tienda" },
    contact: { whatsappUrl: "https://wa.me/1", phone: "1", email: "a@b.c", instagramUrl: "https://www.instagram.com/x" },
    hubs: [],
    entries: [entry(promoted), { ...entry(plain), facts: { ...entry(plain).facts, name: "Otro" } }],
  });
  assert.ok(text.includes(`  - Precio: ${formatPrice(182700)} (antes ${formatPrice(228375)})\n`));
  assert.ok(text.includes(`  - Precio: ${formatPrice(199000)}\n`));
  assert.equal(text.split("(antes ").length - 1, 1);
});

// ── JSON-LD ──────────────────────────────────────────────────────────────────

const offersOf = (item) =>
  productOffers(item, { url: `${SITE_URL}/tienda/productos/${item.slug}`, outOfStock: !purchasable(item), sellerId: SELLER, now: NOW });

test("on promotion the Offer charges the promotional price with the regular one as strikethrough", () => {
  const offer = offersOf(product([variant(1, 228375, 182700)]));
  assert.equal(offer["@type"], "Offer");
  assert.equal(offer.price, 182700);
  assert.equal(offer.priceCurrency, "ARS");
  assert.deepEqual(offer.priceSpecification, {
    "@type": "UnitPriceSpecification",
    priceType: "https://schema.org/StrikethroughPrice",
    price: 228375,
    priceCurrency: "ARS",
  });
  assert.equal(STRIKETHROUGH_PRICE_TYPE, "https://schema.org/StrikethroughPrice");
});

test("without a promotion the Offer is unchanged: no price specification", () => {
  const offer = offersOf(product([variant(1, 228375, null)]));
  assert.deepEqual(offer, {
    "@type": "Offer",
    url: `${SITE_URL}/tienda/productos/producto-promo`,
    priceCurrency: "ARS",
    itemCondition: "https://schema.org/NewCondition",
    availability: "https://schema.org/InStock",
    seller: { "@id": SELLER },
    price: 228375,
    priceValidUntil: "2026-12-10",
  });
  assert.deepEqual(Object.keys(offer), ["@type", "url", "priceCurrency", "itemCondition", "availability", "seller", "price", "priceValidUntil"]);
});

test("sold-out products and AggregateOffers carry no strikethrough price", () => {
  const soldOut = offersOf(product([variant(1, 228375, 182700, { stock: 0 })]));
  assert.equal(soldOut.availability, "https://schema.org/OutOfStock");
  assert.equal(soldOut.price, 182700, "the price as before");
  assert.equal(soldOut.priceSpecification, undefined);

  const aggregate = offersOf(product([variant(1, 228375, 182700), variant(2, 199000, null)]));
  assert.equal(aggregate["@type"], "AggregateOffer");
  assert.equal(aggregate.priceSpecification, undefined);

  // A single price, but the selected variant is not the promoted one.
  const item = product([variant(1, 182700, null), variant(2, 228375, 182700)]);
  assert.equal(offersOf(item).priceSpecification, undefined);
  assert.equal(strikethroughPrice(item, 182700), null);
});

// ── The real catalog: page, feed and JSON-LD agree ───────────────────────────

test("the feed, the Offer and the text copies state the promotion the page shows", () => {
  const { items } = buildMerchantFeed({
    channel: { title: "Smile", link: SITE_URL, description: "Smile" },
    siteUrl: SITE_URL,
    entries: catalog.map((item) => ({
      product: item,
      facts: {
        title: item.name,
        brand: item.brand,
        mpn: null,
        link: `${SITE_URL}/tienda/productos/${item.slug}`,
        purchasable: purchasable(item),
        copy: { paragraphs: ["Anteojos de sol de acetato."], specs: [] },
      },
    })),
  });
  const feedById = new Map(items.map((item) => [item.id, item]));
  let promoted = 0;

  for (const item of catalog) {
    // ProductDetailClient selects the first available variant on load.
    const selected = getAvailableVariants(item)[0] ?? null;
    const promotion = getPromotion(item, selected);
    const charged = getDisplayPrice(item, selected);
    const feedItem = feedById.get(String(item.id));
    const offer = offersOf(item);
    const markdown = buildProductMarkdown({ siteUrl: SITE_URL, entry: entry(item) });

    if (!promotion) {
      if (feedItem) assert.equal(feedItem.salePrice, null, item.slug);
      if (offer?.["@type"] === "Offer") assert.equal(offer.priceSpecification, undefined, item.slug);
      assert.doesNotMatch(markdown, /\(antes /, item.slug);
      continue;
    }
    promoted += 1;
    assert.ok(promotion.regularPrice > charged, item.slug);
    assert.ok(promotion.discountPercent >= 0 && promotion.discountPercent < 100, item.slug);
    assert.equal(feedItem.price, merchantPrice(promotion.regularPrice), item.slug);
    assert.equal(feedItem.salePrice, merchantPrice(charged), item.slug);
    if (offer["@type"] === "Offer") {
      assert.equal(offer.price, charged, item.slug);
      assert.equal(offer.priceSpecification.price, promotion.regularPrice, item.slug);
    }
    assert.ok(markdown.includes(`- Precio: ${formatPrice(charged)} (antes ${formatPrice(promotion.regularPrice)})`), item.slug);
  }
  assert.ok(promoted > 0, "the catalog has in-stock products on promotion");
});

// ── Wiring ───────────────────────────────────────────────────────────────────

test("every price on cards, rows and the product page reads the same promotion", () => {
  const component = read("components/product/PromotionPrice.tsx");
  assert.match(component, /<s\b/, "the regular price is struck through");
  assert.match(component, /sr-only">Precio anterior: </, "and read out as the previous price");
  assert.match(component, /discountPercent > 0/, "no badge under 1%");

  for (const file of [
    "components/brand/ProductCard.tsx",
    "app/tienda/productos/[slug]/ProductDetailClient.tsx",
    "components/brand/HubAlternatives.tsx",
    "components/brand/BrandCarousel.tsx",
    "components/search/SearchOverlay.tsx",
  ]) {
    assert.match(read(file), /<PromotionPrice\b/, file);
  }
  assert.match(read("components/brand/ProductCard.tsx"), /getPromotion\(product, selectedVariant\)/);
  assert.match(read("app/tienda/productos/[slug]/ProductDetailClient.tsx"), /getPromotion\(product, selectedVariant\)/);
  assert.match(read("lib/search-row.ts"), /getPromotion\(product, variant\)/);
  assert.match(read("app/tienda/productos/[slug]/page.tsx"), /productOffers\(product, \{/);
});
