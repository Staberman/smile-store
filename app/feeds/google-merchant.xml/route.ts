import { allProductsIncludingOutOfStock, hasPurchasableStock } from "@/lib/catalog";
import { buildMerchantFeed } from "@/lib/merchant-feed.mjs";
import { getProductCopy, getProductSeo } from "@/lib/product-meta";
import { productUrl, SITE_NAME, SITE_URL } from "@/lib/seo";
import { STORE_LOCATION } from "@/lib/store-facts";

// Google Merchant Center product feed (free listings). One item per product,
// named, priced and stocked as its product page shows it on load; products
// without stock stay listed as out_of_stock. Merchant Center fetches it on a
// schedule, so it stays out of the sitemap.
export const dynamic = "force-static";

export function GET() {
  const { xml } = buildMerchantFeed({
    channel: {
      title: SITE_NAME,
      link: SITE_URL,
      description: `Anteojos de sol y relojes originales de ${SITE_NAME}, ${STORE_LOCATION.label}.`,
    },
    siteUrl: SITE_URL,
    entries: allProductsIncludingOutOfStock.map((product) => {
      const seo = getProductSeo(product);
      return {
        product,
        facts: {
          title: seo.displayName,
          brand: seo.brand,
          mpn: seo.mpn,
          link: productUrl(product),
          purchasable: hasPurchasableStock(product),
          copy: getProductCopy(product),
        },
      };
    }),
  });

  return new Response(xml, {
    headers: { "Content-Type": "application/xml; charset=utf-8" },
  });
}
