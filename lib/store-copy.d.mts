export declare const INSTALLMENTS_PHRASE: string;
export declare const TRANSFER_DISCOUNT_PHRASE: string;
export declare const CHECKOUT_PHRASE: string;

/** "en compras superiores a $ 200.000", or "a todo el país" for a minimum of 0. */
export function freeShippingCondition(minimumArs: number): string;
/** The synced minimum's condition, to follow an "Envío gratis" label. */
export declare const FREE_SHIPPING_CONDITION: string;
/** "Envío gratis en compras superiores a $ 200.000" (or "… a todo el país"). */
export declare const FREE_SHIPPING_PHRASE: string;

export declare const STORE_LOCATION: {
  readonly locality: "Rosario";
  readonly region: "Santa Fe";
  readonly countryCode: "AR";
  readonly label: "Rosario, Santa Fe, Argentina";
};

/** "retiro coordinado por WhatsApp en Puerto Norte", inside a sentence. */
export declare const STORE_PICKUP_PHRASE: string;
