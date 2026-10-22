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
const withoutProductPayments = erikaPage.replace(
  /<a href="#installments-modal"[\s\S]*?<\/a>\s*<\/form>/,
  "</form>",
);
const withoutAnyPayments = withoutProductPayments.slice(
  0,
  withoutProductPayments.indexOf('<div id="installments-modal"'),
);
const withModalDiscount = (value) =>
  erikaPage.replace('data-payment-discount="10"', `data-payment-discount="${value}"`);

test("storefront product pages yield the transfer discount and interest-free installments", () => {
  for (const page of [erikaPage, watchPage]) {
    assert.deepEqual(parseStorefrontPaymentTerms(page), {
      transferDiscountPercent: 10,
      interestFreeInstallments: 6,
    });
  }
});

test("the announcement bar is never read as payment terms", () => {
  assert.match(announcementBar, /6 CUOTAS SIN INTERES \+ 20% OFF/);
  assert.deepEqual(parseStorefrontPaymentTerms(announcementBar), {
    transferDiscountPercent: null,
    interestFreeInstallments: null,
  });
});

test("missing payment blocks come back as null", () => {
  assert.deepEqual(parseStorefrontPaymentTerms(""), {
    transferDiscountPercent: null,
    interestFreeInstallments: null,
  });
  assert.deepEqual(parseStorefrontPaymentTerms(withoutAnyPayments), {
    transferDiscountPercent: null,
    interestFreeInstallments: null,
  });
  // The modal still carries the transfer discount; installments need the product block.
  assert.deepEqual(parseStorefrontPaymentTerms(withoutProductPayments), {
    transferDiscountPercent: 10,
    interestFreeInstallments: null,
  });
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

test("installments must be interest-free", () => {
  const withInterest = erikaPage.replace(/cuotas\s+sin interés/, "cuotas");
  assert.equal(parseStorefrontPaymentTerms(withInterest).interestFreeInstallments, null);
});

test("storeTermsProblem enforces sane bounds", () => {
  const terms = (transferDiscountPercent, interestFreeInstallments) => ({
    transferDiscountPercent,
    interestFreeInstallments,
  });

  assert.equal(storeTermsProblem(terms(10, 6)), null);
  assert.equal(storeTermsProblem(terms(0, 1)), null);
  assert.equal(storeTermsProblem(terms(50, 24)), null);
  for (const insane of [
    terms(null, 6),
    terms(-1, 6),
    terms(51, 6),
    terms(Number.NaN, 6),
    terms(10, null),
    terms(10, 0),
    terms(10, 25),
    terms(10, 6.5),
  ]) {
    assert.notEqual(storeTermsProblem(insane), null, JSON.stringify(insane));
  }
});

test("agreeOnStoreTerms needs three sane readings that agree", () => {
  const reading = (url, transferDiscountPercent = 10, interestFreeInstallments = 6) => ({
    url,
    terms: { transferDiscountPercent, interestFreeInstallments },
  });

  assert.deepEqual(agreeOnStoreTerms([reading("a"), reading("b"), reading("c")]), {
    ok: true,
    terms: { transferDiscountPercent: 10, interestFreeInstallments: 6 },
  });

  const disagreement = agreeOnStoreTerms([reading("a"), reading("b"), reading("c", 15)]);
  assert.equal(disagreement.ok, false);
  assert.match(disagreement.reason, /a dice 10% \/ 6 cuotas y c dice 15% \/ 6 cuotas/);

  const failedFetch = agreeOnStoreTerms([reading("a"), { url: "b", error: "HTTP 503" }, reading("c")]);
  assert.deepEqual(failedFetch, { ok: false, reason: "b: HTTP 503" });

  assert.equal(agreeOnStoreTerms([reading("a"), reading("b", null), reading("c")]).ok, false);
  assert.equal(agreeOnStoreTerms([reading("a"), reading("b")]).ok, false);
});

test("pickStorefrontProductUrls maps purchasable products to the Tiendanube storefront", () => {
  const product = (handle, available) => ({
    sourceUrl: `https://www.smiletiendaimp.com.ar/productos/${handle}/`,
    variants: [{ id: 1, price: 1000, promotionalPrice: null, stock: available ? 1 : 0, available }],
  });
  const catalog = ["a", "b", "c", "d", "e", "f"].map((handle) => product(handle, handle !== "a"));

  const urls = pickStorefrontProductUrls(catalog, 3);
  assert.equal(urls.length, 3);
  assert.equal(new Set(urls).size, 3);
  for (const url of urls) {
    assert.match(url, /^https:\/\/smiletienda\.mitiendanube\.com\/productos\/[b-f]\/$/);
  }
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
