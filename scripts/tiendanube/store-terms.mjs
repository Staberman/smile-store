import { formatPrice } from "../../lib/price-format.mjs";
import { getAvailableVariants } from "../../lib/storefront.mjs";
import { htmlToText } from "./catalog-utils.mjs";

// Same origin as lib/checkout/storefront.ts (store-terms.test.mjs keeps them
// equal): catalog `sourceUrl`s still carry the store's former custom domain,
// so only their `/productos/<handle>/` path is reused.
export const STOREFRONT_ORIGIN = "https://smiletienda.mitiendanube.com";
export const STORE_TERMS_SOURCE = `${STOREFRONT_ORIGIN} product pages`;

// Product pages read on each run, and how many of them must parse for the run
// to count: two pages may be unreachable or unreadable without failing it.
export const STORE_TERMS_SAMPLE_PAGES = 5;
export const STORE_TERMS_QUORUM = 3;

// Sanity bounds: a reading outside them is a misread, not a store setting.
// 0% is a transfer discount switched off in the admin; more than half the price
// off for paying by transfer is beyond any discount the store would run.
export const MAX_TRANSFER_DISCOUNT_PERCENT = 50;
// Argentine card plans top out at 24 installments.
export const MAX_INTEREST_FREE_INSTALLMENTS = 24;
// Fifty times today's $200.000 leaves room for inflation, while an amount read
// in cents ($200.000,00 -> 20.000.000) is out. 0 is free shipping on every order.
export const MAX_FREE_SHIPPING_MINIMUM_ARS = 10_000_000;

// Why a page's reading can't be trusted. In Spanish: they reach the alert issue.
export const STORE_TERMS_FAILURES = Object.freeze({
  discountMissing: "no se encontró el descuento por transferencia",
  discountConflicting: "la página muestra descuentos por transferencia distintos",
  installmentsMissing: "no se encontraron las cuotas sin interés",
  installmentsConflicting: "las páginas no coinciden en las cuotas sin interés",
  freeShippingMissing: "no se encontró el monto mínimo para envío gratis",
  freeShippingConflicting: "las páginas no coinciden en el monto mínimo para envío gratis",
});

// "a", "a y b", "a, b y c".
function listInSpanish(items) {
  return items.length < 2 ? items.join("") : `${items.slice(0, -1).join(", ")} y ${items.at(-1)}`;
}

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

// "$200.000,00" -> 200000. Only es-AR grouping (dots for thousands, comma for
// cents) is accepted: "$200.00" could be either convention, so it is null.
function parseArsAmount(text) {
  const amount = /^\$\s*(\d{1,3}(?:\.\d{3})*)(?:,(\d{1,2}))?$/.exec(text);
  return amount ? Number(`${amount[1].replace(/\./g, "")}.${amount[2] ?? "0"}`) : null;
}

// The product form's "Envío gratis superando los $200.000,00" block, rendered
// from the store's free-shipping promotion:
//   <div class="js-free-shipping-minimum-message …"> … <strong>Envío gratis</strong>
//   <span class="js-shipping-minimum-label">superando los <span>$200.000,00 …
// Its inner <span> never closes (theme markup), so the amount is read as the
// text right after the label's start tag rather than from a balanced element.
// A product with its own free shipping gets the block without the label (no
// store-wide minimum to read). The theme has no "free shipping with no
// minimum" wording: a minimum of 0 reads "superando los $0,00".
// Related-product cards use js-free-shipping-minimum-label, a different class.
function freeShippingMinimum(html) {
  const block = /class="[^"]*\bjs-free-shipping-minimum-message\b/.exec(html);
  const message = block ? elementAt(html, block.index, "div") : null;
  const label = message && /<[^>]*class="[^"]*\bjs-shipping-minimum-label\b[^>]*>/.exec(message);
  if (!label) return null;

  const labelText = htmlToText(message.slice(label.index + label[0].length));
  const amount = /^superando\s+los\s+(\$\s*[\d.,]+)/i.exec(labelText);
  return amount ? parseArsAmount(amount[1]) : null;
}

/**
 * Reads the store-wide payment terms and free-shipping minimum (ARS) from a
 * Tiendanube storefront product page. Never reads the announcement bar or the
 * home banner: their "20% OFF" and "ENVÍO GRATIS" are marketing text, not what
 * Tiendanube's checkout applies. Missing values come back as null.
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
  const freeShippingMinimumArs = freeShippingMinimum(source);
  const structured = structuredTransferDiscounts(source);

  if (structured.length > 1) {
    return {
      transferDiscountPercent: null,
      interestFreeInstallments,
      freeShippingMinimumArs,
      conflictingTransferDiscounts: structured,
    };
  }
  return {
    transferDiscountPercent:
      structured.length === 1 ? structured[0] : textDiscount ? toNumber(textDiscount[1]) : null,
    interestFreeInstallments,
    freeShippingMinimumArs,
  };
}

// Why a reading cannot be trusted, or null when it is sane.
export function storeTermsProblem(terms) {
  const discount = terms?.transferDiscountPercent;
  const installments = terms?.interestFreeInstallments;
  const freeShipping = terms?.freeShippingMinimumArs;
  const conflicting = terms?.conflictingTransferDiscounts ?? [];

  if (conflicting.length > 0) {
    const values = listInSpanish(conflicting.map((value) => `${value}%`));
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
  if (freeShipping === null || freeShipping === undefined) {
    return STORE_TERMS_FAILURES.freeShippingMissing;
  }
  // Whole pesos only: the site would round a minimum with cents into a
  // different promise.
  if (
    !Number.isInteger(freeShipping) ||
    freeShipping < 0 ||
    freeShipping > MAX_FREE_SHIPPING_MINIMUM_ARS
  ) {
    return `monto mínimo para envío gratis fuera de rango (${freeShipping})`;
  }
  return null;
}

/**
 * Combines the page readings (`{ url, terms }` or `{ url, error }`) into the
 * store terms, or says why it can't:
 * - pages that failed to load or didn't yield sane terms are set aside, and at
 *   least `quorum` pages must remain;
 * - the transfer discount and the free-shipping minimum are store-wide, so
 *   every remaining page must agree on each;
 * - the interest-free installments are the value shown by at least `quorum`
 *   remaining pages. Pages can legitimately differ (a cheaper product gets
 *   fewer installments because of the minimum installment amount; a product
 *   can carry a bank promo with more), so unanimity would flap. Taking the
 *   maximum would let one promo page raise the cuotas advertised on every
 *   product; requiring a quorum means a single outlier page, cheaper or
 *   promo, can't move the site-wide value.
 */
export function agreeOnStoreTerms(readings, quorum = STORE_TERMS_QUORUM) {
  const parsed = [];
  const setAside = [];
  for (const reading of readings) {
    const problem = reading.error ?? storeTermsProblem(reading.terms);
    if (problem) setAside.push(`${reading.url}: ${problem}`);
    else parsed.push(reading);
  }

  if (parsed.length < quorum) {
    return {
      ok: false,
      reason: [
        `se leyeron bien ${parsed.length} de ${readings.length} páginas de producto y hacen falta ${quorum}`,
        ...setAside,
      ].join("; "),
    };
  }

  const [first, ...rest] = parsed;
  const different = rest.find(
    (reading) => reading.terms.transferDiscountPercent !== first.terms.transferDiscountPercent,
  );
  if (different) {
    return {
      ok: false,
      reason: `las páginas no coinciden en el descuento por transferencia: ${first.url} dice ${first.terms.transferDiscountPercent}% y ${different.url} dice ${different.terms.transferDiscountPercent}%`,
    };
  }

  const otherMinimum = rest.find(
    (reading) => reading.terms.freeShippingMinimumArs !== first.terms.freeShippingMinimumArs,
  );
  if (otherMinimum) {
    return {
      ok: false,
      reason: `${STORE_TERMS_FAILURES.freeShippingConflicting}: ${first.url} dice ${formatPrice(first.terms.freeShippingMinimumArs)} y ${otherMinimum.url} dice ${formatPrice(otherMinimum.terms.freeShippingMinimumArs)}`,
    };
  }

  const installments = quorumInstallments(parsed, quorum);
  if (!installments.ok) return installments;

  return {
    ok: true,
    terms: {
      transferDiscountPercent: first.terms.transferDiscountPercent,
      interestFreeInstallments: installments.value,
      freeShippingMinimumArs: first.terms.freeShippingMinimumArs,
    },
    pages: parsed.map((reading) => reading.url),
    setAside,
  };
}

// The installments shown by the most pages, if that is at least `quorum` pages
// and no other value ties with it.
function quorumInstallments(parsed, quorum) {
  const pagesByValue = new Map();
  for (const { terms } of parsed) {
    const value = terms.interestFreeInstallments;
    pagesByValue.set(value, (pagesByValue.get(value) ?? 0) + 1);
  }
  const ranked = [...pagesByValue].sort(
    ([valueA, pagesA], [valueB, pagesB]) => pagesB - pagesA || valueA - valueB,
  );
  const [[value, pages], runnerUp] = ranked;

  if (pages >= quorum && runnerUp?.[1] !== pages) return { ok: true, value };

  const seen = ranked.map(
    ([seenValue, seenPages]) =>
      `${seenValue} en ${seenPages} ${seenPages === 1 ? "página" : "páginas"}`,
  );
  return {
    ok: false,
    reason: `${STORE_TERMS_FAILURES.installmentsConflicting}: hace falta que al menos ${quorum} páginas muestren la misma cantidad, más que cualquier otra (${listInSpanish(seen)})`,
  };
}

function storefrontUrl(sourceUrl) {
  try {
    const { pathname } = new URL(sourceUrl);
    return pathname.startsWith("/productos/") ? `${STOREFRONT_ORIGIN}${pathname}` : null;
  } catch {
    return null;
  }
}

/**
 * Up to `count` storefront URLs of in-stock products priced at or above the
 * median in-stock price (cheapest purchasable variant), spread across the
 * catalog order. Those products clear Tiendanube's minimum installment amount,
 * so their pages show the store's full interest-free plan.
 */
export function pickStorefrontProductUrls(catalog, count = STORE_TERMS_SAMPLE_PAGES) {
  const candidates = catalog.flatMap((product) => {
    const prices = getAvailableVariants(product).map((variant) =>
      Number(variant.promotionalPrice ?? variant.price),
    );
    const url = storefrontUrl(product.sourceUrl);
    return prices.length > 0 && url ? [{ url, price: Math.min(...prices) }] : [];
  });
  if (candidates.length === 0) return [];

  // Lower median, so at least half of the in-stock products qualify.
  const sortedPrices = candidates.map((candidate) => candidate.price).sort((a, b) => a - b);
  const median = sortedPrices[Math.floor((sortedPrices.length - 1) / 2)];
  const pool = candidates.filter((candidate) => candidate.price >= median);
  const picks = Math.min(count, pool.length);
  return Array.from(
    { length: picks },
    (_, index) => pool[Math.floor((index * pool.length) / picks)].url,
  );
}

// No timestamp on purpose: the file only changes (and gets committed) when
// the terms change; `git log data/store-terms.json` says when that happened.
export function storeTermsFileText(terms) {
  return `${JSON.stringify(
    {
      transferDiscountPercent: terms.transferDiscountPercent,
      interestFreeInstallments: terms.interestFreeInstallments,
      freeShippingMinimumArs: terms.freeShippingMinimumArs,
      source: STORE_TERMS_SOURCE,
    },
    null,
    2,
  )}\n`;
}
