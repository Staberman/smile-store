import { allProductsIncludingOutOfStock, hasPurchasableStock } from "@/lib/catalog";
import { llmsHubs } from "@/lib/llms-hubs";
import { buildLlmsFull } from "@/lib/llms-text.mjs";
import { getProductSeo } from "@/lib/product-meta";
import { SITE_NAME, SITE_URL } from "@/lib/seo";
import {
  INSTAGRAM_URL,
  PHONE_DISPLAY,
  STORE_ALTERNATE_NAME,
  STORE_EMAIL,
  WHATSAPP_URL,
} from "@/lib/store-facts";

// The full version of /llms.txt: the same summary, the store facts, every
// indexed hub, the whole catalog (named, priced and stocked as each product
// page shows it on load, sold-out products included) and the store FAQ.
export const dynamic = "force-static";

export function GET() {
  const text = buildLlmsFull({
    siteUrl: SITE_URL,
    store: { name: SITE_NAME, alternateName: STORE_ALTERNATE_NAME },
    contact: {
      whatsappUrl: WHATSAPP_URL,
      phone: PHONE_DISPLAY,
      email: STORE_EMAIL,
      instagramUrl: INSTAGRAM_URL,
    },
    hubs: llmsHubs(),
    entries: allProductsIncludingOutOfStock.map((product) => {
      const seo = getProductSeo(product);
      return {
        product,
        facts: {
          name: seo.displayName,
          brand: seo.brand,
          purchasable: hasPurchasableStock(product),
        },
      };
    }),
  });

  return new Response(text, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
