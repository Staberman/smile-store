import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import {
  descriptionLines,
  fallbackDescription,
  productAudience,
  productKind,
  splitDescription,
} from "../../lib/product-copy.mjs";
import { normalizeEyewearTerms } from "../../lib/product-seo.mjs";

const PAYMENT = {
  installments: "6 cuotas sin interés",
  transferDiscount: "20% off por transferencia",
  checkout: "checkout seguro de Tiendanube",
};
// Specs, warranty and shipping terms the fallback must never state.
const INVENTED_CLAIMS =
  /acero|cuarzo|autom[aá]tic|movimiento|cristal|zafiro|sumergible|resistente|\batm\b|\d+\s?mm\b|garant[ií]a|env[ií]os?|entrega|policarbonato|acetato|uv\s?400/i;
const wordCount = (text) => text.split(/\s+/).filter(Boolean).length;

const catalog = JSON.parse(
  fs.readFileSync(path.join(process.cwd(), "data/tiendanube-catalog.json"), "utf8"),
);

test("description HTML splits into one line per paragraph, item or break", () => {
  const html = [
    "<p style=\"font-size: 14px;\">Los anteojos de sol Bio Based 4441D son la pieza perfecta\n para tu look.</p>",
    "<p>&nbsp;</p>",
    "<p><span>CARACTER&Iacute;STICAS:</span><br /><span>&bull; G&eacute;nero: Unisex</span><br style=\"x\" />",
    "<span>&bull; Protecci&oacute;n: 100% de los rayos UV</span></p>",
    "<ul><li>Peso: Normal.</li></ul>",
  ].join("\n");

  assert.deepEqual(descriptionLines(html), [
    "Los anteojos de sol Bio Based 4441D son la pieza perfecta para tu look.",
    "CARACTERÍSTICAS:",
    "Género: Unisex",
    "Protección: 100% de los rayos UV",
    "Peso: Normal.",
  ]);
  assert.deepEqual(descriptionLines('<p class="MsoNormal" style="line-height: normal;">'), []);
  assert.deepEqual(descriptionLines(""), []);
});

test("spec lines move to the spec table and leave the prose", () => {
  const { paragraphs, specs } = splitDescription([
    "Los anteojos de sol Bio Based 4441D son la pieza perfecta para mejorar tu visión y tu look.",
    "Son 100% originales, hechos con materiales de altísima calidad.",
    "Características:",
    "Formato: Ovalado.",
    "Género: Hombre y Mujer (Unisex).",
    "Lentes Disponibles: Clásicos , Degrade y Espejados",
    "Material del Lente: Policarbonato.",
    "Formato de Cara Recomendada: Redonda, ovalada, rectangular.",
    "Encuentra tus gafas de sol favoritas en Argentina, como si estuvieras en USA.",
    "Packaging:",
  ]);

  assert.deepEqual(specs, [
    { name: "Formato", value: "Ovalado" },
    { name: "Género", value: "Hombre y Mujer (Unisex)" },
    { name: "Lentes disponibles", value: "Clásicos, Degrade y Espejados" },
    { name: "Material del lente", value: "Policarbonato" },
    { name: "Formato de cara recomendado", value: "Redonda, ovalada, rectangular" },
  ]);
  // Marketing and authenticity claims stay word for word; the labels left
  // with nothing under them go.
  assert.deepEqual(paragraphs, [
    "Los anteojos de sol Bio Based 4441D son la pieza perfecta para mejorar tu visión y tu look.",
    "Son 100% originales, hechos con materiales de altísima calidad.",
    "Encuentra tus anteojos de sol favoritos en Argentina, como si estuvieras en USA.",
  ]);
});

test("watch spec lines are read too", () => {
  const { paragraphs, specs } = splitDescription([
    "Movimiento: Cuarzo (calibre VD72)",
    "Material de la Caja/Banda: Acero inoxidable.",
    "Diámetro de la Caja: 43 mm",
    "Resistencia al Agua: 100 metros (10 ATM), apto para nadar",
  ]);
  assert.deepEqual(paragraphs, []);
  assert.deepEqual(specs, [
    { name: "Movimiento", value: "Cuarzo (calibre VD72)" },
    { name: "Material de la caja/banda", value: "Acero inoxidable" },
    { name: "Diámetro de la caja", value: "43 mm" },
    { name: "Resistencia al agua", value: "100 metros (10 ATM), apto para nadar" },
  ]);
});

test("feature lines and labels with content stay in the prose", () => {
  const lines = [
    "Las Gafas CA002 representan el equilibrio perfecto entre moda y funcionalidad.",
    "Características destacadas:",
    "Lentes de cristal mineral: Alta calidad óptica y gran resistencia.",
    "Protección UV400: Bloqueo total de los rayos UVA y UVB.",
    "Incluye:",
    "Estuche rígido",
    "Tarjeta de autenticidad",
  ];
  const { paragraphs, specs } = splitDescription(lines);
  assert.deepEqual(specs, []);
  assert.deepEqual(paragraphs, [
    "Los Anteojos CA002 representan el equilibrio perfecto entre moda y funcionalidad.",
    ...lines.slice(1),
  ]);
});

test("spec values read 'anteojos' and repeated lines show once", () => {
  const { specs } = splitDescription([
    "Formato: Gafas de sol rectangulares.",
    "Peso: Liviano.",
    "Peso: Liviano.",
  ]);
  assert.deepEqual(specs, [
    { name: "Formato", value: "Anteojos de sol rectangulares" },
    { name: "Peso", value: "Liviano" },
  ]);
});

test("fallback copy for a watch is built from catalog facts only", () => {
  const watch = {
    name: "Reloj Tommy Hilfiger 1782779",
    categories: ["RELOJES", "TOMMY HILFIGER DAMA"],
    tags: [],
    variants: [{ sku: "", options: [] }],
  };
  const text = fallbackDescription(watch, {
    brand: "Tommy Hilfiger",
    name: "Reloj Tommy Hilfiger 1782779",
    collection: ["Relojes", "Tommy Hilfiger"],
    payment: PAYMENT,
  });

  assert.equal(
    text,
    "El Tommy Hilfiger 1782779 es un reloj para dama. " +
      "Tommy Hilfiger es una marca estadounidense fundada en 1985. " +
      "Su número de modelo es 1782779. " +
      "En Smile lo encontrás en la sección Tommy Hilfiger, dentro de Relojes. " +
      "Podés pagarlo en 6 cuotas sin interés o con 20% off por transferencia, a través del checkout seguro de Tiendanube. " +
      "Si querés confirmar medidas, materiales u otros detalles antes de comprar, consultanos por WhatsApp.",
  );
  assert.ok(wordCount(text) >= 60 && wordCount(text) <= 90, `${wordCount(text)} words`);
  assert.doesNotMatch(text, INVENTED_CLAIMS);
});

test("fallback copy varies with the product's own data", () => {
  const sunglasses = {
    name: "Hexagonal Evolve 3548",
    categories: ["LENTES DE SOL"],
    tags: ["Unisex"],
    variants: [
      { sku: "", options: ["Dorado/Azul liso"] },
      { sku: "", options: ["Negro/Verde"] },
    ],
  };
  const text = fallbackDescription(sunglasses, {
    brand: "Ray-Ban",
    name: "Ray-Ban Hexagonal Evolve 3548",
    collection: ["Ray-Ban"],
  });
  assert.match(text, /^Los Ray-Ban Hexagonal Evolve 3548 son anteojos de sol unisex\./);
  assert.match(text, /Su número de modelo es RB3548\./);
  assert.match(text, /En Smile los encontrás en la sección Ray-Ban\./);
  assert.match(text, /Se publican en las variantes Dorado\/Azul liso y Negro\/Verde\./);
  assert.doesNotMatch(text, /Podés pagar/);

  // No brand fact on record, no model code, no section: those sentences go.
  const other = fallbackDescription(
    { name: "Reloj Invicta Speedway", categories: ["RELOJES", "INVICTA"], tags: ["hombre"], variants: [] },
    { brand: "Invicta", name: "Reloj Invicta Speedway" },
  );
  assert.equal(
    other,
    "El Invicta Speedway es un reloj para caballero. " +
      "Si querés confirmar medidas, materiales u otros detalles antes de comprar, consultanos por WhatsApp.",
  );
});

test("product kind and audience come from categories and tags", () => {
  assert.equal(productKind({ categories: ["RELOJES", "INVICTA"] }), "watch");
  assert.equal(productKind({ categories: ["LENTES DE SOL", "RAY BAN"] }), "sunglasses");
  assert.equal(productKind({ categories: ["SIN CATEGORIA"] }), null);
  assert.equal(productAudience({ categories: ["RELOJES", "TOMMY HILFIGER CABALLERO"], tags: [] }), "men");
  assert.equal(productAudience({ categories: ["LENTES DE SOL"], tags: ["Mujer", "Hombre"] }), "unisex");
  assert.equal(productAudience({ categories: ["LENTES DE SOL"], tags: [] }), null);
});

test("catalog products without a description get 60-90 words of factual copy", () => {
  const withoutCopy = catalog.filter((product) => descriptionLines(product.descriptionHtml).length === 0);
  assert.ok(withoutCopy.length > 0);

  const texts = withoutCopy.map((product) => {
    const brand = product.brand === "Ray Ban" ? "Ray-Ban" : product.brand;
    const text = fallbackDescription(product, {
      brand,
      name: product.name.startsWith("Reloj") ? product.name : `${brand} ${product.name}`,
      collection: [brand],
      payment: PAYMENT,
    });
    const words = wordCount(text);
    assert.ok(words >= 60 && words <= 90, `${product.slug}: ${words} words`);
    assert.doesNotMatch(text, INVENTED_CLAIMS, product.slug);
    return text;
  });
  assert.equal(new Set(texts).size, texts.length, "each product reads differently");
});

test("catalog descriptions lose no copy and show no spec twice", () => {
  const claims = (texts) =>
    texts.join(" ").match(/originales?|garant[ií]a|autenticidad|oficial/gi)?.length ?? 0;

  for (const product of catalog) {
    const lines = descriptionLines(product.descriptionHtml);
    const { paragraphs, specs } = splitDescription(lines);

    for (const line of lines) {
      const isEmptyLabel = /^[^:]{1,40}:\s*$/.test(line);
      const isSpec = splitDescription([line]).specs.length === 1;
      assert.ok(
        isEmptyLabel || isSpec || paragraphs.includes(normalizeEyewearTerms(line)),
        `${product.slug} keeps "${line}"`,
      );
      if (isSpec) {
        assert.ok(!paragraphs.includes(normalizeEyewearTerms(line)), `${product.slug} shows "${line}" once`);
      }
    }
    assert.equal(claims(paragraphs), claims(lines), `${product.slug} keeps its claims`);
    assert.ok(specs.every((spec) => !/gafa/i.test(spec.value)), product.slug);
  }
});
