import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import {
  INTEREST_FREE_INSTALLMENTS,
  TRANSFER_DISCOUNT_PERCENT,
  getInstallmentPrice,
  getTransferPrice,
} from "../../lib/storefront.mjs";
import {
  MAX_FREE_SHIPPING_MINIMUM_ARS,
  MAX_INTEREST_FREE_INSTALLMENTS,
  MAX_TRANSFER_DISCOUNT_PERCENT,
  STOREFRONT_ORIGIN,
  STORE_TERMS_FAILURES,
  STORE_TERMS_QUORUM,
  STORE_TERMS_SAMPLE_PAGES,
  agreeOnStoreTerms,
  parseStorefrontPaymentTerms,
  pickStorefrontProductUrls,
  storeTermsFileText,
  storeTermsProblem,
} from "./store-terms.mjs";

const projectRoot = process.cwd();
const readFixture = (name) =>
  fs.readFileSync(path.join(projectRoot, "scripts/tiendanube/fixtures", name), "utf8");
const erikaPage = readFixture("storefront-product-erika.html");
const watchPage = readFixture("storefront-product-reloj.html");

// Pieces of the saved page, cut at the elements the fixture keeps.
const announcementBar = erikaPage.slice(
  erikaPage.indexOf('<div class="js-addbar'),
  erikaPage.indexOf('<div id="single-product"'),
);
const withoutPaymentsModal = erikaPage.slice(0, erikaPage.indexOf('<div id="installments-modal"'));
const withoutProductPayments = erikaPage.replace(/<a href="#installments-modal"[\s\S]*?<\/a>/, "");
const withoutAnyPayments = withoutProductPayments.slice(
  0,
  withoutProductPayments.indexOf('<div id="installments-modal"'),
);
const withModalDiscount = (value) =>
  erikaPage.replace('data-payment-discount="10"', `data-payment-discount="${value}"`);
// A second transfer method in the modal that disagrees with the first (10%).
const withConflictingModal = erikaPage.replace(
  "</body>",
  '<div id="info-payment-method-wire_transfer"><strong data-payment-discount="15">$152.915,00</strong></div></body>',
);
// The product form's free-shipping block, verbatim from the fixture.
const freeShippingBlock = erikaPage.slice(
  erikaPage.indexOf('<div class="js-free-shipping-minimum-message'),
  erikaPage.indexOf('<input type="hidden" name="add_to_cart"'),
);
const withoutFreeShippingBlock = erikaPage.replace(freeShippingBlock, "");
const withFreeShippingLabel = (text) =>
  erikaPage.replace("superando los <span>$200.000,00", text);
const freeShippingMinimumOf = (page) => parseStorefrontPaymentTerms(page).freeShippingMinimumArs;
// The live home page's services banner (trimmed): owner-written text, not the
// promotion Tiendanube's checkout applies.
const homeBanner = `<div class="js-service-item service-item">
<div class="span10 service-text p-right p-none-xs">
<h3 class="h6 service-title"><strong>Envios a todo el pais</strong></h3>
<p>Envios gratis a partir de $200.000</p>
</div>
</div>`;

test("storefront product pages yield the transfer discount, installments and free-shipping minimum", () => {
  for (const page of [erikaPage, watchPage]) {
    assert.deepEqual(parseStorefrontPaymentTerms(page), {
      transferDiscountPercent: 10,
      interestFreeInstallments: 6,
      freeShippingMinimumArs: 200000,
    });
  }
});

test("the announcement bar and the home banner are never read as store terms", () => {
  assert.match(announcementBar, /6 CUOTAS SIN INTERES \+ 20% OFF {2}\+ ENVÍO GRATIS/);
  const nothing = {
    transferDiscountPercent: null,
    interestFreeInstallments: null,
    freeShippingMinimumArs: null,
  };
  assert.deepEqual(parseStorefrontPaymentTerms(announcementBar), nothing);
  assert.deepEqual(parseStorefrontPaymentTerms(homeBanner), nothing);
  // Not even next to a product page without its own free-shipping block.
  assert.equal(freeShippingMinimumOf(`${homeBanner}${withoutFreeShippingBlock}`), null);
});

test("missing payment blocks come back as null", () => {
  assert.deepEqual(parseStorefrontPaymentTerms(""), {
    transferDiscountPercent: null,
    interestFreeInstallments: null,
    freeShippingMinimumArs: null,
  });
  assert.deepEqual(parseStorefrontPaymentTerms(withoutAnyPayments), {
    transferDiscountPercent: null,
    interestFreeInstallments: null,
    freeShippingMinimumArs: 200000,
  });
  // The modal still carries the transfer discount; installments need the product block.
  assert.deepEqual(parseStorefrontPaymentTerms(withoutProductPayments), {
    transferDiscountPercent: 10,
    interestFreeInstallments: null,
    freeShippingMinimumArs: 200000,
  });
});

test("the free-shipping minimum is read from the product form's block, in es-AR pesos", () => {
  assert.match(freeShippingBlock, /js-shipping-minimum-label/);
  assert.equal(freeShippingMinimumOf(freeShippingBlock), 200000);
  assert.equal(freeShippingMinimumOf(withFreeShippingLabel("superando los <span>$1.500.000,00")), 1500000);
  assert.equal(freeShippingMinimumOf(withFreeShippingLabel("superando los <span>$ 85.000")), 85000);
  assert.equal(freeShippingMinimumOf(withFreeShippingLabel("superando los <span>$0,00")), 0);
  // Cents are kept, so the sanity check can refuse them instead of rounding.
  assert.equal(freeShippingMinimumOf(withFreeShippingLabel("superando los <span>$150.000,50")), 150000.5);
});

test("a free-shipping block without a readable minimum comes back as null", () => {
  assert.equal(freeShippingMinimumOf(withoutFreeShippingBlock), null);
  // A product with its own free shipping: the theme hides the label and drops its class.
  assert.equal(
    freeShippingMinimumOf(
      erikaPage.replace(
        '<span class="js-shipping-minimum-label">',
        '<span style="display: none;">',
      ),
    ),
    null,
  );
  // Not es-AR grouping: "$200.00" could mean 200 or 20.000.
  assert.equal(freeShippingMinimumOf(withFreeShippingLabel("superando los <span>$200.00")), null);
  assert.equal(freeShippingMinimumOf(withFreeShippingLabel("superando los <span>consultar")), null);
  // Related-product cards carry js-free-shipping-minimum-label, not the message block.
  assert.equal(
    freeShippingMinimumOf(
      '<div class="js-shipping-label-private js-free-shipping-minimum-label label">Envío gratis</div>',
    ),
    null,
  );
});

test("the transfer method's data-payment-discount wins over the visible text", () => {
  assert.equal(parseStorefrontPaymentTerms(withoutPaymentsModal).transferDiscountPercent, 10);
  assert.equal(parseStorefrontPaymentTerms(withModalDiscount(15)).transferDiscountPercent, 15);
  // Only the transfer method counts, not other methods' discounts.
  assert.equal(
    parseStorefrontPaymentTerms(
      withoutPaymentsModal.replace("pagando con Transferencia", "pagando con Efectivo"),
    ).transferDiscountPercent,
    null,
  );
  // A discount turned off in the admin is a valid reading, not a missing one.
  assert.equal(parseStorefrontPaymentTerms(withModalDiscount(0)).transferDiscountPercent, 0);
});

test("a transfer discount that conflicts within the page is rejected as conflicting, not missing", () => {
  const conflicting = parseStorefrontPaymentTerms(withConflictingModal);

  // The visible "10% de descuento" text is not used to pick a side.
  assert.deepEqual(conflicting, {
    transferDiscountPercent: null,
    interestFreeInstallments: 6,
    freeShippingMinimumArs: 200000,
    conflictingTransferDiscounts: [10, 15],
  });
  assert.equal(
    storeTermsProblem(conflicting),
    "la página muestra descuentos por transferencia distintos (10% y 15%)",
  );
  assert.equal(
    storeTermsProblem(parseStorefrontPaymentTerms(withoutAnyPayments)),
    STORE_TERMS_FAILURES.discountMissing,
  );
  assert.notEqual(STORE_TERMS_FAILURES.discountConflicting, STORE_TERMS_FAILURES.discountMissing);
});

test("three or more conflicting discounts are listed as a Spanish series", () => {
  assert.equal(
    storeTermsProblem({
      transferDiscountPercent: null,
      interestFreeInstallments: 6,
      conflictingTransferDiscounts: [10, 15, 20],
    }),
    "la página muestra descuentos por transferencia distintos (10%, 15% y 20%)",
  );
});

test("installments must be interest-free", () => {
  const withInterest = erikaPage.replace(/cuotas\s+sin interés/, "cuotas");
  assert.equal(parseStorefrontPaymentTerms(withInterest).interestFreeInstallments, null);
});

test("storeTermsProblem enforces sane bounds", () => {
  const terms = (transferDiscountPercent, interestFreeInstallments, freeShippingMinimumArs = 200000) => ({
    transferDiscountPercent,
    interestFreeInstallments,
    freeShippingMinimumArs,
  });

  assert.equal(storeTermsProblem(terms(10, 6)), null);
  assert.equal(storeTermsProblem(terms(0, 1)), null);
  assert.equal(
    storeTermsProblem(
      terms(
        MAX_TRANSFER_DISCOUNT_PERCENT,
        MAX_INTEREST_FREE_INSTALLMENTS,
        MAX_FREE_SHIPPING_MINIMUM_ARS,
      ),
    ),
    null,
  );
  // Free shipping on every order is a valid setting, not a missing one.
  assert.equal(storeTermsProblem(terms(10, 6, 0)), null);
  for (const insane of [
    terms(null, 6),
    terms(-1, 6),
    terms(MAX_TRANSFER_DISCOUNT_PERCENT + 1, 6),
    terms(Number.NaN, 6),
    terms(10, null),
    terms(10, 0),
    terms(10, MAX_INTEREST_FREE_INSTALLMENTS + 1),
    terms(10, 6.5),
    terms(10, 6, null),
    { transferDiscountPercent: 10, interestFreeInstallments: 6 },
    terms(10, 6, -1),
    terms(10, 6, 150000.5),
    terms(10, 6, MAX_FREE_SHIPPING_MINIMUM_ARS + 1),
    terms(10, 6, Number.NaN),
  ]) {
    assert.notEqual(storeTermsProblem(insane), null, JSON.stringify(insane));
  }
  assert.equal(storeTermsProblem(terms(null, 6)), STORE_TERMS_FAILURES.discountMissing);
  assert.equal(storeTermsProblem(terms(10, null)), STORE_TERMS_FAILURES.installmentsMissing);
  assert.equal(storeTermsProblem(terms(10, 6, null)), STORE_TERMS_FAILURES.freeShippingMissing);
  assert.equal(storeTermsProblem(terms(51, 6)), "descuento por transferencia fuera de rango (51%)");
  // "$200.000,00" read in cents.
  assert.equal(
    storeTermsProblem(terms(10, 6, 20_000_000)),
    "monto mínimo para envío gratis fuera de rango (20000000)",
  );
});

test("a product page without the free-shipping block fails as free shipping missing", () => {
  assert.equal(
    storeTermsProblem(parseStorefrontPaymentTerms(withoutFreeShippingBlock)),
    STORE_TERMS_FAILURES.freeShippingMissing,
  );
  assert.equal(storeTermsProblem(parseStorefrontPaymentTerms(erikaPage)), null);
});

test("the sync reads the same storefront origin the checkout links to", () => {
  const checkoutSource = fs.readFileSync(
    path.join(projectRoot, "lib/checkout/storefront.ts"),
    "utf8",
  );
  const declared = /const STOREFRONT_ORIGIN = "([^"]+)"/.exec(checkoutSource);

  assert.ok(declared, "lib/checkout/storefront.ts no longer declares STOREFRONT_ORIGIN");
  assert.equal(STOREFRONT_ORIGIN, declared[1]);
});

const reading = (
  url,
  transferDiscountPercent = 10,
  interestFreeInstallments = 6,
  freeShippingMinimumArs = 200000,
) => ({
  url,
  terms: { transferDiscountPercent, interestFreeInstallments, freeShippingMinimumArs },
});
const storeTerms = { transferDiscountPercent: 10, interestFreeInstallments: 6, freeShippingMinimumArs: 200000 };
const failedReading = (url, error = "no se pudo leer la página (HTTP 503, tras 3 intentos)") => ({
  url,
  error,
});

test("agreeOnStoreTerms accepts a quorum of sane pages and sets the rest aside", () => {
  assert.equal(STORE_TERMS_QUORUM, 3);
  assert.deepEqual(
    agreeOnStoreTerms([reading("a"), reading("b"), reading("c"), reading("d"), reading("e")]),
    {
      ok: true,
      terms: storeTerms,
      pages: ["a", "b", "c", "d", "e"],
      setAside: [],
    },
  );

  // Two unreachable or unreadable pages out of five don't fail the run.
  const degraded = agreeOnStoreTerms([
    reading("a"),
    failedReading("b"),
    reading("c"),
    reading("d", null),
    reading("e"),
  ]);
  assert.equal(degraded.ok, true);
  assert.deepEqual(degraded.terms, storeTerms);
  assert.deepEqual(degraded.pages, ["a", "c", "e"]);
  assert.deepEqual(degraded.setAside, [
    "b: no se pudo leer la página (HTTP 503, tras 3 intentos)",
    "d: no se encontró el descuento por transferencia",
  ]);
});

test("agreeOnStoreTerms fails below the quorum and lists every page it set aside", () => {
  const result = agreeOnStoreTerms([
    reading("a"),
    failedReading("b"),
    reading("c", 10, null),
    failedReading("d", "no se pudo leer la página (HTTP 404)"),
    reading("e"),
  ]);

  assert.deepEqual(result, {
    ok: false,
    reason:
      "se leyeron bien 2 de 5 páginas de producto y hacen falta 3; " +
      "b: no se pudo leer la página (HTTP 503, tras 3 intentos); " +
      "c: no se encontraron las cuotas sin interés; " +
      "d: no se pudo leer la página (HTTP 404)",
  });
  assert.equal(agreeOnStoreTerms([]).ok, false);
});

test("the transfer discount must be the same on every parsed page", () => {
  const result = agreeOnStoreTerms([reading("a"), reading("b"), reading("c", 15), reading("d")]);

  assert.deepEqual(result, {
    ok: false,
    reason: "las páginas no coinciden en el descuento por transferencia: a dice 10% y c dice 15%",
  });
});

test("the free-shipping minimum must be the same on every parsed page", () => {
  const result = agreeOnStoreTerms([
    reading("a"),
    reading("b"),
    reading("c", 10, 6, 150000),
    reading("d"),
  ]);

  assert.deepEqual(result, {
    ok: false,
    reason:
      "las páginas no coinciden en el monto mínimo para envío gratis: a dice $ 200.000 y c dice $ 150.000",
  });
  assert.ok(result.reason.startsWith(STORE_TERMS_FAILURES.freeShippingConflicting));
  // A page showing no minimum (0) disagrees with one showing $200.000 just the same.
  assert.equal(agreeOnStoreTerms([reading("a"), reading("b"), reading("c", 10, 6, 0)]).ok, false);
});

test("pages without the free-shipping block are set aside, and fail the run below the quorum", () => {
  const degraded = agreeOnStoreTerms([
    reading("a"),
    reading("b", 10, 6, null),
    reading("c"),
    reading("d"),
    reading("e", 10, 6, null),
  ]);
  assert.equal(degraded.ok, true);
  assert.equal(degraded.terms.freeShippingMinimumArs, 200000);
  assert.deepEqual(degraded.setAside, [
    "b: no se encontró el monto mínimo para envío gratis",
    "e: no se encontró el monto mínimo para envío gratis",
  ]);

  // The promotion switched off (no block anywhere): the run fails, so the
  // last synced value stays and the alert reports why.
  const switchedOff = agreeOnStoreTerms(
    ["a", "b", "c", "d", "e"].map((url) => reading(url, 10, 6, null)),
  );
  assert.equal(switchedOff.ok, false);
  assert.match(switchedOff.reason, /^se leyeron bien 0 de 5 páginas de producto y hacen falta 3; /);
  assert.match(switchedOff.reason, /a: no se encontró el monto mínimo para envío gratis/);
});

test("free shipping with no minimum (0) is a valid agreed reading", () => {
  const result = agreeOnStoreTerms(["a", "b", "c"].map((url) => reading(url, 10, 6, 0)));
  assert.equal(result.ok, true);
  assert.equal(result.terms.freeShippingMinimumArs, 0);
});

const withInstallments = (...values) =>
  values.map((installments, index) => reading(`p${index + 1}`, 10, installments));

test("interest-free installments are the value a quorum of pages shows", () => {
  assert.deepEqual(agreeOnStoreTerms(withInstallments(6, 6, 6)).terms, storeTerms);

  // A cheaper page (3, minimum installment amount) and a promo page (12)
  // don't move the site-wide value.
  const outliers = agreeOnStoreTerms(withInstallments(6, 6, 6, 3, 12));
  assert.equal(outliers.ok, true);
  assert.equal(outliers.terms.interestFreeInstallments, 6);
});

test("installments that no quorum of pages agrees on fail as conflicting", () => {
  const result = agreeOnStoreTerms(withInstallments(6, 6, 3, 12), 3);

  assert.deepEqual(result, {
    ok: false,
    reason:
      "las páginas no coinciden en las cuotas sin interés: hace falta que al menos 3 páginas " +
      "muestren la misma cantidad, más que cualquier otra " +
      "(6 en 2 páginas, 3 en 1 página y 12 en 1 página)",
  });
  assert.ok(result.reason.startsWith(STORE_TERMS_FAILURES.installmentsConflicting));

  // Two values that both reach the quorum are just as ambiguous.
  assert.equal(agreeOnStoreTerms(withInstallments(6, 6, 6, 12, 12, 12), 3).ok, false);
});

test("pickStorefrontProductUrls samples in-stock products at or above the median price", () => {
  const product = (handle, price, { available = true, promotionalPrice = null } = {}) => ({
    sourceUrl: `https://www.smiletiendaimp.com.ar/productos/${handle}/`,
    variants: [{ id: 1, price, promotionalPrice, stock: available ? 1 : 0, available }],
  });
  const catalog = [
    product("cheap-1", 10_000),
    product("mid-1", 50_000),
    product("sold-out", 900_000, { available: false }),
    product("cheap-2", 20_000),
    product("high-1", 80_000),
    product("on-sale", 90_000, { promotionalPrice: 15_000 }),
    product("mid-2", 60_000),
    product("cheap-3", 30_000),
    product("high-2", 70_000),
    { ...product("not-a-product", 99_000), sourceUrl: "https://www.smiletiendaimp.com.ar/contacto/" },
    product("at-median", 40_000),
  ];

  // In stock with a product URL: 10k 15k 20k 30k 40k 50k 60k 70k 80k -> median 40k.
  const urls = pickStorefrontProductUrls(catalog);
  assert.equal(STORE_TERMS_SAMPLE_PAGES, 5);
  assert.deepEqual(
    urls,
    ["mid-1", "high-1", "mid-2", "high-2", "at-median"].map(
      (handle) => `https://smiletienda.mitiendanube.com/productos/${handle}/`,
    ),
  );
});

test("pickStorefrontProductUrls spreads its picks across the catalog order", () => {
  const catalog = Array.from({ length: 20 }, (_, index) => ({
    sourceUrl: `https://www.smiletiendaimp.com.ar/productos/p${index}/`,
    variants: [{ id: 1, price: 1000, promotionalPrice: null, stock: 1, available: true }],
  }));

  assert.deepEqual(
    pickStorefrontProductUrls(catalog).map((url) => new URL(url).pathname),
    ["/productos/p0/", "/productos/p4/", "/productos/p8/", "/productos/p12/", "/productos/p16/"],
  );
  assert.equal(pickStorefrontProductUrls(catalog.slice(0, 2)).length, 2);
  assert.deepEqual(pickStorefrontProductUrls([]), []);
});

test("storeTermsFileText writes the terms, the free-shipping minimum included, without a timestamp", () => {
  assert.equal(
    storeTermsFileText(storeTerms),
    `{
  "transferDiscountPercent": 10,
  "interestFreeInstallments": 6,
  "freeShippingMinimumArs": 200000,
  "source": "https://smiletienda.mitiendanube.com product pages"
}
`,
  );
  // Same terms, same text: an unchanged reading never produces a commit.
  assert.equal(storeTermsFileText({ ...storeTerms }), storeTermsFileText(storeTerms));
  assert.notEqual(
    storeTermsFileText({ ...storeTerms, freeShippingMinimumArs: 250000 }),
    storeTermsFileText(storeTerms),
  );
});

test("lib/storefront.mjs exposes the synced store terms", () => {
  const storedText = fs.readFileSync(path.join(projectRoot, "data/store-terms.json"), "utf8");
  const stored = JSON.parse(storedText);

  assert.equal(storeTermsProblem(stored), null);
  assert.equal(TRANSFER_DISCOUNT_PERCENT, stored.transferDiscountPercent);
  assert.equal(INTEREST_FREE_INSTALLMENTS, stored.interestFreeInstallments);
  assert.equal(
    getTransferPrice(100000),
    Math.round(100000 * (1 - stored.transferDiscountPercent / 100)),
  );
  assert.equal(getInstallmentPrice(60000), Math.round(60000 / stored.interestFreeInstallments));
  // The sync writes exactly this text, so unchanged terms never produce a commit.
  assert.equal(storeTermsFileText(stored), storedText);
});
