import { canonicalBrand } from "@/lib/brand-directory";
import type { CatalogProduct } from "@/lib/catalog";
import { getProductTrail } from "@/lib/collections";
import {
  audiencePhrase,
  descriptionLines,
  fallbackDescription,
  productAudience,
  productKind,
  splitDescription,
  type ProductSpec,
} from "@/lib/product-copy.mjs";
import { displayProductName } from "@/lib/product-name";
import {
  dedupeImages,
  extractModelCode,
  fitDescription,
  isGenericSeoText,
  listPhrase,
  plainName,
  productPageTitle,
  type ProductKind,
} from "@/lib/product-seo.mjs";
import { CHECKOUT_PHRASE, INSTALLMENTS_PHRASE, TRANSFER_DISCOUNT_PHRASE } from "@/lib/store-facts";

export type ProductSeo = {
  /** Canonical brand label ("Ray-Ban", never "RAY BAN"). */
  brand: string;
  /** H1, cards and Product.name: the catalog name with the canonical brand. */
  displayName: string;
  kind: ProductKind;
  /** <title> without the site suffix, at most 52 characters. */
  title: string;
  /** Meta description, 140-155 characters when the copy allows it. */
  description: string;
  /** Manufacturer model code, only when reliably readable from the name. */
  mpn: string | null;
  /** Product images without repeated renditions of the same photo. */
  images: string[];
};

/** Product facts stated in the store's own copy (not its generic defaults). */
function featurePhrase(product: CatalogProduct, kind: ProductKind): string {
  const text = [
    product.descriptionText,
    isGenericSeoText(product.seoTitle, product.name) ? "" : product.seoTitle,
    isGenericSeoText(product.seoDescription, product.name) ? "" : product.seoDescription,
  ].join(" ");

  if (kind === "watch") {
    const automatic = /autom[aá]tico/i.test(text);
    const quartz = /cuarzo/i.test(text);
    if (automatic === quartz) return "";
    return automatic ? ", con movimiento automático" : ", con movimiento de cuarzo";
  }

  if (kind === "sunglasses") {
    const features = [
      /cristal(es)? mineral/i.test(text) ? "lentes de cristal mineral" : "",
      /uv\s?400/i.test(text) ? "protección UV400" : "",
    ];
    const listed = listPhrase(features);
    return listed ? `, con ${listed}` : "";
  }

  return "";
}

function describe(product: CatalogProduct, displayName: string, kind: ProductKind): string {
  const name = plainName(displayName);
  const audience = audiencePhrase(productAudience(product), kind);
  const features = featurePhrase(product, kind);

  const leads =
    kind === "sunglasses"
      ? [
          `Anteojos de sol ${name} originales${audience}${features}.`,
          `Anteojos de sol ${name} originales${audience}.`,
          `${name}: anteojos de sol originales.`,
          `${name}.`,
        ]
      : kind === "watch"
        ? [
            `${name} original${audience}${features}.`,
            `${name} original${audience}.`,
            `${name}.`,
          ]
        : [`${name} original.`, `${name}.`];

  return fitDescription({
    leads,
    offers: [
      `Comprá en Smile en ${INSTALLMENTS_PHRASE} o con ${TRANSFER_DISCOUNT_PHRASE}.`,
      `${INSTALLMENTS_PHRASE} o ${TRANSFER_DISCOUNT_PHRASE} en Smile.`,
    ],
    extras: ["Checkout seguro de Tiendanube.", "Atención personalizada por WhatsApp."],
  });
}

export type ProductCopy = {
  /** Description paragraphs, without the lines moved to `specs`. */
  paragraphs: string[];
  /** "Clave: valor" lines of the description, e.g. Género: Unisex. */
  specs: ProductSpec[];
};

/**
 * Copy for a product without a Tiendanube description, from catalog facts
 * only: display name, brand, model code, collection, gender and variants.
 */
function getFallbackDescription(product: CatalogProduct): string {
  const collection = getProductTrail(product)
    .filter((crumb) => crumb.href !== "/")
    .map((crumb) => crumb.name);
  return fallbackDescription(product, {
    brand: canonicalBrand(product.brand),
    name: displayProductName(product.name, product.brand),
    collection,
    payment: {
      installments: INSTALLMENTS_PHRASE,
      transferDiscount: TRANSFER_DISCOUNT_PHRASE,
      checkout: CHECKOUT_PHRASE,
    },
  });
}

/**
 * Product description as the site shows and emits it (product page, Product
 * JSON-LD, search index): read from the description HTML, which keeps its
 * line breaks, with spec lines split out and eyewear terms normalized.
 * Products whose HTML has no text get the catalog-facts fallback, also over
 * the older fallback text stored by the importer.
 * Applied at read time: the hourly Tiendanube sync rewrites
 * data/tiendanube-catalog.json, so the stored copy is left as is.
 */
export function getProductCopy(product: CatalogProduct): ProductCopy {
  const lines = descriptionLines(product.descriptionHtml);
  if (lines.length > 0) return splitDescription(lines);
  return { paragraphs: [getFallbackDescription(product)], specs: [] };
}

function specsText(specs: ProductSpec[]): string {
  return specs.map((spec) => `${spec.name}: ${spec.value}.`).join(" ");
}

/**
 * Plain-text description for Product JSON-LD: the prose, or the specs when the
 * description has nothing else (they also go to Product.additionalProperty).
 */
export function getProductDescription(product: CatalogProduct): string {
  const { paragraphs, specs } = getProductCopy(product);
  return paragraphs.join(" ") || specsText(specs);
}

/** Description prose and specs, for product search. */
export function getProductSearchText(product: CatalogProduct): string {
  const { paragraphs, specs } = getProductCopy(product);
  return [...paragraphs, specsText(specs)].join(" ").trim();
}

export function getProductSeo(product: CatalogProduct): ProductSeo {
  const brand = canonicalBrand(product.brand);
  const kind = productKind(product);
  const displayName = displayProductName(product.name, product.brand);

  return {
    brand,
    displayName,
    kind,
    title: productPageTitle(displayName, kind),
    description: describe(product, displayName, kind),
    mpn: extractModelCode({
      brand,
      name: product.name,
      skus: product.variants.map((variant) => variant.sku),
    }),
    images: dedupeImages(product.images),
  };
}
