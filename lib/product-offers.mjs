// The offers of a product page's Product JSON-LD (app/tienda/productos/[slug]).
// Plain JavaScript so node:test can check them against the catalog.
// Merchant listing structured data:
// https://developers.google.com/search/docs/appearance/structured-data/merchant-listing
import { getAvailableVariants, getDisplayPrice, getPromotion } from "./storefront.mjs";

export const OFFER_CURRENCY = "ARS";
export const STRIKETHROUGH_PRICE_TYPE = "https://schema.org/StrikethroughPrice";

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Google's strikethrough price for an Offer at `offerPrice`: the regular
 * price of the variant the page selects on load (the first purchasable one,
 * as the Merchant feed), while that variant is on promotion at `offerPrice`.
 * The page shows that regular price struck through. Null otherwise.
 */
export function strikethroughPrice(product, offerPrice) {
  const variant = getAvailableVariants(product)[0] ?? null;
  const promotion = getPromotion(product, variant);
  if (!promotion || getDisplayPrice(product, variant) !== offerPrice) return null;
  return {
    "@type": "UnitPriceSpecification",
    priceType: STRIKETHROUGH_PRICE_TYPE,
    price: promotion.regularPrice,
    priceCurrency: OFFER_CURRENCY,
  };
}

/**
 * Offer for a single price, AggregateOffer when the offered variants differ
 * in price. In-stock variants are the ones on offer; an out-of-stock product
 * reports its listed variants as out of stock. `price` is the price charged
 * (the promotional one on promotion); a single Offer on promotion adds the
 * regular price as its strikethrough price. Null without any price.
 */
export function productOffers(product, { url, outOfStock, sellerId, now = Date.now() }) {
  const offered = product.variants.filter(
    (variant) => outOfStock || (variant.available && variant.stock > 0),
  );
  const prices = offered
    .map((variant) => variant.promotionalPrice ?? variant.price)
    .filter((price) => typeof price === "number" && price > 0);
  const productPrice = product.promotionalPrice ?? product.price;
  if (prices.length === 0 && !(typeof productPrice === "number" && productPrice > 0)) {
    return null;
  }

  const common = {
    url,
    priceCurrency: OFFER_CURRENCY,
    itemCondition: "https://schema.org/NewCondition",
    availability: outOfStock ? "https://schema.org/OutOfStock" : "https://schema.org/InStock",
    seller: { "@id": sellerId },
  };
  const lowPrice = prices.length > 0 ? Math.min(...prices) : productPrice;
  const highPrice = prices.length > 0 ? Math.max(...prices) : productPrice;

  if (lowPrice !== highPrice) {
    return {
      "@type": "AggregateOffer",
      ...common,
      lowPrice,
      highPrice,
      offerCount: offered.length,
    };
  }

  const strikethrough = strikethroughPrice(product, lowPrice);
  // Prices sync from Tiendanube hourly; each build restates them.
  const priceValidUntil = new Date(now + 30 * DAY_MS).toISOString().slice(0, 10);
  return {
    "@type": "Offer",
    ...common,
    price: lowPrice,
    ...(strikethrough ? { priceSpecification: strikethrough } : {}),
    priceValidUntil,
  };
}
