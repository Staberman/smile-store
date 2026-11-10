type OfferVariant = {
  id: number | null;
  price: number | null;
  promotionalPrice: number | null;
  stock: number;
  available: boolean;
};

/** Catalog product fields the offers read. */
export type OfferProduct = {
  price: number | null;
  promotionalPrice: number | null;
  variants: OfferVariant[];
};

export type StrikethroughPriceSpecification = {
  "@type": "UnitPriceSpecification";
  priceType: "https://schema.org/StrikethroughPrice";
  price: number;
  priceCurrency: string;
};

type OfferCommon = {
  url: string;
  priceCurrency: string;
  itemCondition: string;
  availability: string;
  seller: { "@id": string };
};

export type ProductOffer =
  | (OfferCommon & {
      "@type": "Offer";
      price: number;
      priceSpecification?: StrikethroughPriceSpecification;
      priceValidUntil: string;
    })
  | (OfferCommon & {
      "@type": "AggregateOffer";
      lowPrice: number;
      highPrice: number;
      offerCount: number;
    });

export declare const OFFER_CURRENCY: string;
export declare const STRIKETHROUGH_PRICE_TYPE: "https://schema.org/StrikethroughPrice";

/** The regular price of the variant selected on load, while on promotion at `offerPrice`. */
export function strikethroughPrice(
  product: OfferProduct,
  offerPrice: number,
): StrikethroughPriceSpecification | null;

export function productOffers(
  product: OfferProduct,
  options: {
    url: string;
    outOfStock: boolean;
    /** The seller's JSON-LD @id. */
    sellerId: string;
    /** Build time in ms, for priceValidUntil; defaults to now. */
    now?: number;
  },
): ProductOffer | null;
