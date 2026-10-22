import { getAvailableVariants } from "../../lib/storefront.mjs";
import { htmlToText } from "./catalog-utils.mjs";

// Same origin as lib/checkout/storefront.ts (store-terms.test.mjs keeps them
// equal): catalog `sourceUrl`s still carry the store's former custom domain,
// so only their `/productos/<handle>/` path is reused.
export const STOREFRONT_ORIGIN = "https://smiletienda.mitiendanube.com";
export const STORE_TERMS_SOURCE = `${STOREFRONT_ORIGIN} product pages`;

// Sanity bounds: a reading outside them is a misread, not a store setting.
// 0% is a transfer discount switched off in the admin; more than half the price
// off for paying by transfer is beyond any discount the store would run.
export const MAX_TRANSFER_DISCOUNT_PERCENT = 50;
// Argentine card plans top out at 24 installments.
export const MAX_INTEREST_FREE_INSTALLMENTS = 24;

// Why a page's reading can't be trusted. In Spanish: they reach the alert issue.
export const STORE_TERMS_FAILURES = Object.freeze({
  discountMissing: "no se encontró el descuento por transferencia",
  discountConflicting: "la página muestra descuentos por transferencia distintos",
  installmentsMissing: "no se encontraron las cuotas sin interés",
});

// Returns the whole element (balanced by tag name) whose start tag contains
// `index`, or null when it never closes.
function elementAt(html, index, tag) {
  const start = html.lastIndexOf(`<${tag}`, index);
  if (start === -1) return null;

  const tags = new RegExp(`<${tag}[\\s>]|</${tag}>`, "gi");
  tags.lastIndex = start;
  let depth = 0;
  for (let match = tags.exec(html); match; match = tags.exec(html)) {
    depth += match[0].startsWith("</") ? -1 : 1;
    if (depth === 0) return html.slice(start, tags.lastIndex);
  }
  return null;
}

function toNumber(value) {
  const parsed = Number(String(value).replace(",", "."));
  return Number.isFinite(parsed) ? parsed : null;
}

// The product's own payment link ("6 cuotas sin interés de $…", "10% de
// descuento pagando con Transferencia"). Related-product cards and the
// announcement bar live outside it.
function productPaymentsBlock(html) {
  const match = /class="[^"]*\bjs-product-payments-container\b/.exec(html);
  return match ? elementAt(html, match.index, "a") : null;
}

// Structured values: the payment-methods modal tags each method's discounted
// total with `data-payment-discount`; only the transfer method is read. Every
// distinct value comes back, so "none" and "several" stay distinguishable.
function structuredTransferDiscounts(html) {
  const values = new Set();
  for (const match of html.matchAll(/id="info-payment-method-wire_transfer"/g)) {
    const method = elementAt(html, match.index, "div") ?? "";
    const discount = /data-payment-discount="([\d.,]+)"/.exec(method);
    const value = discount ? toNumber(discount[1]) : null;
    if (value !== null) values.add(value);
  }
  return [...values].sort((a, b) => a - b);
}

/**
 * Reads the store-wide payment terms from a Tiendanube storefront product page.
 * Never reads the announcement bar: its "20% OFF" is a marketing banner, not
 * the discount Tiendanube's checkout applies. Missing values come back as null.
 * When the transfer method carries several different discounts the page is
 * ambiguous: `transferDiscountPercent` is null, the visible text is not used as
 * a tie-breaker, and `conflictingTransferDiscounts` lists the values.
 */
export function parseStorefrontPaymentTerms(html) {
  const source = String(html ?? "");
  const paymentsText = htmlToText(productPaymentsBlock(source) ?? "");
  const textDiscount =
    /(\d{1,2}(?:[.,]\d+)?)\s*%\s*de\s+descuento\s+pagando\s+con\s+transferencia/i.exec(
      paymentsText,
    );
  const installments = /(\d{1,2})\s*cuotas\s+sin\s+inter[eé]s/i.exec(paymentsText);
  const interestFreeInstallments = installments ? Number(installments[1]) : null;
  const structured = structuredTransferDiscounts(source);

  if (structured.length > 1) {
    return {
      transferDiscountPercent: null,
      interestFreeInstallments,
      conflictingTransferDiscounts: structured,
    };
  }
  return {
    transferDiscountPercent:
      structured.length === 1 ? structured[0] : textDiscount ? toNumber(textDiscount[1]) : null,
    interestFreeInstallments,
  };
}

// Why a reading cannot be trusted, or null when it is sane.
export function storeTermsProblem(terms) {
  const discount = terms?.transferDiscountPercent;
  const installments = terms?.interestFreeInstallments;
  const conflicting = terms?.conflictingTransferDiscounts ?? [];

  if (conflicting.length > 0) {
    const values = conflicting.map((value) => `${value}%`).join(" y ");
    return `${STORE_TERMS_FAILURES.discountConflicting} (${values})`;
  }
  if (discount === null || discount === undefined) {
    return STORE_TERMS_FAILURES.discountMissing;
  }
  if (!Number.isFinite(discount) || discount < 0 || discount > MAX_TRANSFER_DISCOUNT_PERCENT) {
    return `descuento por transferencia fuera de rango (${discount}%)`;
  }
  if (installments === null || installments === undefined) {
    return STORE_TERMS_FAILURES.installmentsMissing;
  }
  if (
    !Number.isInteger(installments) ||
    installments < 1 ||
    installments > MAX_INTEREST_FREE_INSTALLMENTS
  ) {
    return `cuotas sin interés fuera de rango (${installments})`;
  }
  return null;
}

function describeTerms(terms) {
  return `${terms.transferDiscountPercent}% / ${terms.interestFreeInstallments} cuotas`;
}

/**
 * Accepts the readings (`{ url, terms }` or `{ url, error }`) only when there
 * are at least `minimumPages`, every one is sane and they all agree.
 */
export function agreeOnStoreTerms(readings, minimumPages = 3) {
  if (readings.length < minimumPages) {
    return {
      ok: false,
      reason: `se revisaron ${readings.length} de ${minimumPages} páginas de producto`,
    };
  }

  for (const reading of readings) {
    const problem = reading.error ?? storeTermsProblem(reading.terms);
    if (problem) return { ok: false, reason: `${reading.url}: ${problem}` };
  }

  const [first, ...rest] = readings;
  const different = rest.find(
    (reading) =>
      reading.terms.transferDiscountPercent !== first.terms.transferDiscountPercent ||
      reading.terms.interestFreeInstallments !== first.terms.interestFreeInstallments,
  );
  if (different) {
    return {
      ok: false,
      reason: `las páginas no coinciden: ${first.url} dice ${describeTerms(first.terms)} y ${different.url} dice ${describeTerms(different.terms)}`,
    };
  }

  return {
    ok: true,
    terms: {
      transferDiscountPercent: first.terms.transferDiscountPercent,
      interestFreeInstallments: first.terms.interestFreeInstallments,
    },
  };
}

// Up to `count` purchasable products spread across the catalog, as storefront URLs.
export function pickStorefrontProductUrls(catalog, count = 3) {
  const urls = catalog
    .filter((product) => getAvailableVariants(product).length > 0)
    .map((product) => {
      try {
        const { pathname } = new URL(product.sourceUrl);
        return pathname.startsWith("/productos/") ? `${STOREFRONT_ORIGIN}${pathname}` : null;
      } catch {
        return null;
      }
    })
    .filter(Boolean);
  const step = Math.max(1, Math.floor(urls.length / count));
  return urls.filter((_, index) => index % step === 0).slice(0, count);
}

// No timestamp on purpose: the file only changes (and gets committed) when
// the terms change; `git log data/store-terms.json` says when that happened.
export function storeTermsFileText(terms) {
  return `${JSON.stringify(
    {
      transferDiscountPercent: terms.transferDiscountPercent,
      interestFreeInstallments: terms.interestFreeInstallments,
      source: STORE_TERMS_SOURCE,
    },
    null,
    2,
  )}\n`;
}
