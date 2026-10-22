import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { STORE_LOCATION, STORE_PICKUP_PHRASE } from "../../lib/store-copy.mjs";
import { PICKUP_FAQ_ANSWER, STORE_FAQS } from "../../lib/store-faqs.mjs";

const projectRoot = process.cwd();
const read = (relativePath) => fs.readFileSync(path.join(projectRoot, relativePath), "utf8");
const occurrences = (text, phrase) => text.split(phrase).length - 1;

// The pickup point is not a storefront: no "local", showroom, opening hours,
// address or street number, and shipping cost or threshold is not confirmed.
const STOREFRONT_WORDS = /\blocal\b|showroom|horario|direcci[oó]n|\bcalle\b|\bav(enida)?\b/i;
const SHIPPING_TERMS = /gratis|monto m[ií]nimo|costo|\$/i;

test("the store FAQ answers the Rosario pickup question with the shared phrase", () => {
  const questions = STORE_FAQS.map((faq) => faq.question);
  assert.equal(new Set(questions).size, questions.length, "questions are React keys");
  for (const question of questions) assert.match(question, /^¿.+\?$/);

  const pickup = STORE_FAQS.find(
    (faq) => faq.question === `¿Puedo retirar mi compra en ${STORE_LOCATION.locality}?`,
  );
  assert.ok(pickup, "the pickup question is in the store FAQ");
  assert.equal(pickup.answer, PICKUP_FAQ_ANSWER);
  assert.ok(pickup.answer.includes(`${STORE_PICKUP_PHRASE}, ${STORE_LOCATION.locality}`));
  assert.match(pickup.answer, /envíos a todo el país/);

  // One mention: the pickup answer, not repeated in the other answers.
  const allText = STORE_FAQS.map((faq) => `${faq.question} ${faq.answer}`).join(" ");
  assert.equal(occurrences(allText, STORE_PICKUP_PHRASE), 1);
});

test("pickup copy never reads as a storefront or states shipping terms", () => {
  const pickupTexts = [
    STORE_PICKUP_PHRASE,
    PICKUP_FAQ_ANSWER,
    ...STORE_FAQS.filter((faq) => faq.answer.includes(STORE_PICKUP_PHRASE)).map(
      (faq) => `${faq.question} ${faq.answer}`,
    ),
  ];
  for (const text of pickupTexts) {
    assert.doesNotMatch(text, STOREFRONT_WORDS, text);
    assert.doesNotMatch(text, /\d/, `no street number: ${text}`);
    assert.doesNotMatch(text, SHIPPING_TERMS, text);
  }
});

test("the pickup point is named only through STORE_PICKUP_PHRASE, once per page", () => {
  const sourceFiles = ["app", "components", "lib"].flatMap((dir) =>
    fs
      .readdirSync(path.join(projectRoot, dir), { recursive: true })
      .filter((file) => /\.(ts|tsx|mjs|mts|js)$/.test(file))
      .map((file) => path.join(dir, file)),
  );
  for (const file of sourceFiles) {
    const source = read(file);
    if (!/^lib\/store-copy\.(mjs|d\.mts)$/.test(file)) {
      assert.doesNotMatch(source, /Puerto Norte/, `${file} must use STORE_PICKUP_PHRASE`);
    }
    // The sitewide OnlineStore node gives the city only.
    assert.doesNotMatch(source, /streetAddress|openingHours/, file);
  }

  for (const file of ["app/contacto/page.tsx", "app/llms.txt/route.ts", "components/brand/PickupNote.tsx"]) {
    assert.match(read(file), /STORE_PICKUP_PHRASE/, `${file} mentions the pickup point`);
  }
  // Product pages add the pickup line to the trust block. The homepage renders
  // the block too (TiendaCatalog) and already answers pickup in its FAQ.
  assert.match(
    read("app/tienda/productos/[slug]/ProductDetailClient.tsx"),
    /<TrustHighlights>\s*<PickupNote \/>\s*<\/TrustHighlights>/,
  );
  assert.doesNotMatch(read("components/store/TiendaCatalog.tsx"), /PickupNote/);
  assert.doesNotMatch(read("components/brand/TrustHighlights.tsx"), /store-facts|store-copy/);
});
