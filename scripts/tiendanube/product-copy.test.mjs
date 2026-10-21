import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { descriptionLines, splitDescription } from "../../lib/product-copy.mjs";
import { normalizeEyewearTerms } from "../../lib/product-seo.mjs";

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
