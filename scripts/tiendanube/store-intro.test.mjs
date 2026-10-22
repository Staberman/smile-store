import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { countWords } from "../../lib/collection-hubs.mjs";
import {
  CHECKOUT_PHRASE,
  FREE_SHIPPING_PHRASE,
  STORE_LOCATION,
  STORE_PICKUP_PHRASE,
} from "../../lib/store-copy.mjs";
import {
  STORE_INTRO_MAX_WORDS,
  STORE_INTRO_MIN_WORDS,
  STORE_INTRO_SUNGLASSES_BRANDS,
  storeIntro,
} from "../../lib/store-intro.mjs";

const projectRoot = process.cwd();
const read = (relativePath) => fs.readFileSync(path.join(projectRoot, relativePath), "utf8");

// Brand-directory order, as app/page.tsx passes them (brands with stock).
const SUNGLASSES = ["Ray-Ban", "Prada", "Versace", "Christian Dior", "Louis Vuitton", "Gucci"];
const WATCHES = ["Tommy Hilfiger", "Invicta", "OMEGA x Swatch"];

test("the homepage intro says who Smile is with the shared store phrases", () => {
  const intro = storeIntro({ sunglassesBrands: SUNGLASSES, watchBrands: WATCHES });

  assert.ok(
    intro.startsWith(
      `Smile es una tienda online de ${STORE_LOCATION.locality}, ${STORE_LOCATION.region}, que vende anteojos de sol originales de Ray-Ban, Prada, Versace y otras marcas, y relojes originales de Tommy Hilfiger, Invicta y OMEGA x Swatch.`,
    ),
    intro,
  );
  assert.ok(intro.includes("envíos a todo el país"), intro);
  assert.ok(intro.includes(`${STORE_PICKUP_PHRASE}, ${STORE_LOCATION.locality}.`), intro);
  assert.ok(intro.includes(`${FREE_SHIPPING_PHRASE}.`), intro);
  assert.ok(intro.endsWith(`${CHECKOUT_PHRASE}.`), intro);
  // Only the first sunglasses brands are named.
  for (const brand of SUNGLASSES.slice(STORE_INTRO_SUNGLASSES_BRANDS)) {
    assert.ok(!intro.includes(brand), `${brand} is left to "otras marcas"`);
  }
});

test("the intro stays within its word range whatever brands have stock", () => {
  for (let sunglasses = 0; sunglasses <= SUNGLASSES.length; sunglasses += 1) {
    for (let watches = 0; watches <= WATCHES.length; watches += 1) {
      const intro = storeIntro({
        sunglassesBrands: SUNGLASSES.slice(0, sunglasses),
        watchBrands: WATCHES.slice(0, watches),
      });
      const words = countWords(intro);
      assert.ok(
        words >= STORE_INTRO_MIN_WORDS && words <= STORE_INTRO_MAX_WORDS,
        `${words} words: ${intro}`,
      );
      assert.doesNotMatch(intro, /,\s*,|\s{2}|\s[.,]/, intro);
    }
  }
  assert.match(
    storeIntro({ sunglassesBrands: ["Ray-Ban"], watchBrands: [] }),
    /originales de Ray-Ban y relojes originales\. /,
  );
});

test("the intro states no payment, warranty or returns terms and no storefront", () => {
  const intro = storeIntro({ sunglassesBrands: SUNGLASSES, watchBrands: WATCHES });
  assert.doesNotMatch(intro, /cuotas|transferencia|%|garant[ií]a|devoluci[oó]n|cambio|reembolso/i);
  assert.doesNotMatch(intro, /\blocal\b|showroom|horario|direcci[oó]n/i);
});

test("the homepage renders the intro right under its only H1, terms from constants", () => {
  const page = read("app/page.tsx");
  assert.equal((page.match(/<h1\b/g) ?? []).length, 1);
  assert.match(page, /<h1 className="sr-only">\{HOME_TITLE\}<\/h1>\s*<p\b[^>]*>\s*\{intro\}\s*<\/p>/);
  assert.match(page, /storeIntro\(/);

  // Payment, shipping and pickup wording only through lib/store-copy.mjs.
  const handWritten =
    /\$\s?\d|cuotas sin inter|% off|por transferencia|env[ií]o gratis|Puerto Norte|checkout seguro/i;
  for (const file of ["app/page.tsx", "lib/store-intro.mjs"]) {
    assert.doesNotMatch(read(file), handWritten, file);
  }
});
