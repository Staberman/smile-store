import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { formatPrice } from "../../lib/price-format.mjs";
import {
  FREE_SHIPPING_CONDITION,
  FREE_SHIPPING_PHRASE,
  freeShippingCondition,
} from "../../lib/store-copy.mjs";
import { STORE_FAQS } from "../../lib/store-faqs.mjs";
import { FREE_SHIPPING_MINIMUM_ARS } from "../../lib/storefront.mjs";

const projectRoot = process.cwd();
const read = (relativePath) => fs.readFileSync(path.join(projectRoot, relativePath), "utf8");

test("free shipping is promised above the minimum, in the site's price format", () => {
  assert.equal(freeShippingCondition(200000), "en compras superiores a $ 200.000");
  assert.equal(freeShippingCondition(1500000), "en compras superiores a $ 1.500.000");
  assert.equal(
    `Envío gratis ${freeShippingCondition(200000)}`,
    `Envío gratis en compras superiores a ${formatPrice(200000)}`,
  );
});

test("a minimum of 0 promises free shipping to the whole country", () => {
  assert.equal(freeShippingCondition(0), "a todo el país");
  assert.equal(`Envío gratis ${freeShippingCondition(0)}`, "Envío gratis a todo el país");
});

test("the shared phrase follows the minimum synced from Tiendanube", () => {
  assert.equal(FREE_SHIPPING_CONDITION, freeShippingCondition(FREE_SHIPPING_MINIMUM_ARS));
  assert.equal(FREE_SHIPPING_PHRASE, `Envío gratis ${FREE_SHIPPING_CONDITION}`);
  if (FREE_SHIPPING_MINIMUM_ARS > 0) {
    assert.ok(FREE_SHIPPING_PHRASE.endsWith(formatPrice(FREE_SHIPPING_MINIMUM_ARS)));
  }
});

test("the shipping FAQ states the synced free-shipping terms", () => {
  const shipping = STORE_FAQS.find((faq) => faq.question === "¿Hacen envíos a todo el país?");
  assert.ok(shipping, "the shipping question is in the store FAQ");
  assert.match(shipping.answer, /^Sí, hacemos envíos a todo el país\. /);
  assert.ok(shipping.answer.includes(`${FREE_SHIPPING_PHRASE}.`), shipping.answer);
  assert.doesNotMatch(shipping.answer, /monto m[ií]nimo/i);
});

test("free-shipping claims are never written by hand", () => {
  const sourceFiles = ["app", "components", "lib"].flatMap((dir) =>
    fs
      .readdirSync(path.join(projectRoot, dir), { recursive: true })
      .filter((file) => /\.(ts|tsx|mjs|mts|js)$/.test(file))
      .map((file) => path.join(dir, file)),
  );
  for (const file of sourceFiles) {
    const source = read(file);
    assert.doesNotMatch(source, /sin monto m[ií]nimo/i, file);
    // Only freeShippingCondition(0) may say it, built from its parts.
    assert.doesNotMatch(source, /env[ií]o gratis a todo el pa[ií]s/i, file);
  }

  for (const file of [
    // The llms.txt / llms-full.txt summary and store facts.
    "lib/llms-text.mjs",
    "components/promo/SessionOfferPopup.tsx",
    "lib/store-faqs.mjs",
  ]) {
    assert.match(read(file), /\bFREE_SHIPPING_PHRASE\b/, `${file} states free shipping`);
  }
  assert.match(
    read("components/sections/BenefitsStrip.tsx"),
    /label: "Envío gratis",\s*detail: FREE_SHIPPING_CONDITION,/,
  );
});
