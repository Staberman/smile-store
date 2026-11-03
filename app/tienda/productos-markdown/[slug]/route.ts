import { allProductsIncludingOutOfStock, getProductBySlug, hasPurchasableStock } from "@/lib/catalog";
import { getProductTrail } from "@/lib/collections";
import { productModelHub } from "@/lib/hub-pages";
import { buildProductMarkdown } from "@/lib/llms-text.mjs";
import { getProductCopy, getProductSeo } from "@/lib/product-meta";
import { productUrl, SITE_URL } from "@/lib/seo";

// The Markdown copy of a product page, served at /tienda/productos/<slug>.md
// (next.config.mjs rewrites it here: the [slug] page would otherwise answer
// "<slug>.md"). Same products as the page, prerendered at build time; an
// unknown or unpublished slug is a 404.
export const dynamic = "force-static";
export const dynamicParams = false;

type Props = { params: { slug: string } };

export function generateStaticParams() {
  return allProductsIncludingOutOfStock.map((product) => ({ slug: product.slug }));
}

export function GET(_request: Request, { params }: Props) {
  const product = getProductBySlug(params.slug);
  if (!product) return new Response("Not found", { status: 404 });

  const seo = getProductSeo(product);
  // The collection crumb the page shows before the product itself.
  const collection = getProductTrail(product, productModelHub(product))
    .filter((crumb) => crumb.href !== "/")
    .pop();

  const text = buildProductMarkdown({
    siteUrl: SITE_URL,
    entry: {
      product,
      facts: {
        name: seo.displayName,
        brand: seo.brand,
        purchasable: hasPurchasableStock(product),
        mpn: seo.mpn,
      },
    },
    collection: collection ? { name: collection.name, path: collection.href } : null,
    paragraphs: getProductCopy(product).paragraphs,
  });

  return new Response(text, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      Link: `<${productUrl(product)}>; rel="canonical"`,
    },
  });
}
