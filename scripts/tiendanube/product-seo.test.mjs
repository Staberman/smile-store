import assert from "node:assert/strict";
import test from "node:test";
import {
  MAX_TITLE_LENGTH,
  TITLE_SUFFIX,
  dedupeImages,
  extractModelCode,
  fitDescription,
  isGenericSeoText,
  normalizeEyewearTerms,
  productDisplayName,
  productPageTitle,
} from "../../lib/product-seo.mjs";

const RAY_BAN = { label: "Ray-Ban", aliases: ["ray ban", "rayban"] };

test("display names carry the canonical brand exactly once", () => {
  assert.equal(productDisplayName("4375 Polarizado", RAY_BAN), "Ray-Ban 4375 Polarizado");
  assert.equal(
    productDisplayName("RAY BAN WAYFARER FOLDING 4105", RAY_BAN),
    "Ray-Ban Wayfarer Folding 4105",
  );
  assert.equal(
    productDisplayName("Reloj tommy hilfiger 1791788", { label: "Tommy Hilfiger", aliases: ["tommy hilfiger"] }),
    "Reloj Tommy Hilfiger 1791788",
  );
  assert.equal(
    productDisplayName("Catier CA002", { label: "Cartier", aliases: ["cartier"] }),
    "Cartier CA002",
  );
  assert.equal(
    productDisplayName("Dolce&Gabbana DG005", {
      label: "Dolce & Gabbana",
      aliases: ["dolce gabbana", "dolceandgabbana"],
    }),
    "Dolce & Gabbana DG005",
  );
  assert.equal(productDisplayName("FENDI FE008", { label: "Fendi", aliases: ["fendi"] }), "Fendi FE008");
});

test("product titles fit 60 characters with the site suffix", () => {
  const long = productPageTitle(
    "Ray-Ban Wayfarer Liteforce 4195 Scuderia Ferrari Collection",
    "sunglasses",
  );
  assert.ok(`${long}${TITLE_SUFFIX}`.length <= MAX_TITLE_LENGTH, long);
  assert.equal(
    productPageTitle("Ray-Ban Aviador Classic 3025", "sunglasses"),
    "Anteojos de sol Ray-Ban Aviador Classic 3025",
  );
  assert.equal(
    productPageTitle("Reloj Invicta Pro Diver 49277", "watch"),
    "Reloj Invicta Pro Diver 49277",
  );
  assert.doesNotMatch(productPageTitle("Gafas de sol Gucci GG1443S", null), /gafas/i);
});

test("Tiendanube default SEO copy is treated as generic", () => {
  assert.equal(isGenericSeoText("lentes sol importados originales"), true);
  assert.equal(isGenericSeoText("¡Tienda online con promociones y envíos gratis en Rosario!"), true);
  assert.equal(isGenericSeoText("Aviador Classic 3025", "Aviador Classic 3025"), true);
  assert.equal(
    isGenericSeoText("Gafas Gucci GG1443S Unisex con Lentes Cristal Mineral y UV400"),
    false,
  );
  assert.equal(normalizeEyewearTerms("Gafas de sol Fendi"), "Anteojos de sol Fendi");
});

test("descriptions land in the 140-155 character range when possible", () => {
  const description = fitDescription({
    leads: ["Anteojos de sol Ray-Ban Aviador Classic 3025 originales unisex."],
    offers: [
      "Comprá en Smile en 6 cuotas sin interés o con 20% off por transferencia.",
      "6 cuotas sin interés o 20% off por transferencia en Smile.",
    ],
    extras: ["Checkout seguro de Tiendanube.", "Atención personalizada por WhatsApp."],
  });
  assert.ok(description.length >= 140 && description.length <= 155, description);
});

test("model codes are only read in the brand's official format", () => {
  assert.equal(extractModelCode({ brand: "Ray-Ban", name: "Aviador Classic 3025", skus: ["3025"] }), "RB3025");
  assert.equal(extractModelCode({ brand: "Ray-Ban", name: "Cats 5000 - RB4125" }), "RB4125");
  // The SKU points to another model: not reliable.
  assert.equal(
    extractModelCode({ brand: "Ray-Ban", name: "Jackie Ohh II 4098", skus: ["4380N 6357/v0"] }),
    null,
  );
  assert.equal(extractModelCode({ brand: "Ray-Ban", name: "Wayfarer Reverse" }), null);
  assert.equal(extractModelCode({ brand: "Invicta", name: "Reloj Invicta Pro Diver 49277" }), "49277");
  assert.equal(
    extractModelCode({ brand: "Tommy Hilfiger", name: "Reloj Tommy Hilfiger TH1782499" }),
    "1782499",
  );
  assert.equal(extractModelCode({ brand: "Gucci", name: "Gucci GG1443S", skus: ["GG1443S"] }), "GG1443S");
  assert.equal(extractModelCode({ brand: "Gucci", name: "Gucci G011" }), null);
  assert.equal(
    extractModelCode({ brand: "Prada", name: "Prada Symbole SPR26Z", skus: ["SPR17W PR008"] }),
    null,
  );
  assert.equal(extractModelCode({ brand: "Fendi", name: "Fendi FE016" }), null);
});

test("image renditions of the same photo are deduplicated", () => {
  const base = "https://dcdn-us.mitiendanube.com/stores/1/products/photo-abc";
  assert.deepEqual(
    dedupeImages([`${base}-640-0.webp`, `${base}-1024-1024.webp`, `${base}-2-1024-1024.webp`]),
    [`${base}-1024-1024.webp`, `${base}-2-1024-1024.webp`],
  );
});
