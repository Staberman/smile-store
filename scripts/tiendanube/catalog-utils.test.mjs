import test from "node:test";
import assert from "node:assert/strict";
import {
  extractAssignedJson,
  htmlToText,
  normalizeImageUrl,
  parseCategoryField,
  parseTiendanubePrice,
  stripBase64Images,
} from "./catalog-utils.mjs";

test("parseTiendanubePrice converts exported ARS strings to numbers", () => {
  assert.equal(parseTiendanubePrice("494,500.00"), 494500);
  assert.equal(parseTiendanubePrice("0.00"), 0);
  assert.equal(parseTiendanubePrice(""), null);
});

test("normalizeImageUrl converts Tiendanube protocol-relative URLs", () => {
  assert.equal(
    normalizeImageUrl("//dcdn-us.mitiendanube.com/stores/003/image.webp"),
    "https://dcdn-us.mitiendanube.com/stores/003/image.webp",
  );
  assert.equal(normalizeImageUrl("https://example.com/a.webp"), "https://example.com/a.webp");
  assert.equal(normalizeImageUrl(""), null);
});

test("stripBase64Images removes embedded image payloads", () => {
  const result = stripBase64Images('<p>Hola</p><img src="data:image/png;base64,AAAA" /><p>Chau</p>');
  assert.equal(result.includes("data:image"), false);
  assert.equal(result.includes("Hola"), true);
  assert.equal(result.includes("Chau"), true);
});

test("htmlToText creates readable product copy", () => {
  assert.equal(
    htmlToText("<p>L&iacute;nea uno &bull; dise&ntilde;o</p><ul><li>Formato: Aviador.</li></ul>"),
    "Línea uno • diseño Formato: Aviador.",
  );
});

test("parseCategoryField keeps canonical path and separates secondary tags", () => {
  assert.deepEqual(parseCategoryField("LENTES DE SOL > RAY BAN > WAYFARER, LENTES EN PROMO, MES DE LA MADRE?"), {
    path: ["LENTES DE SOL", "RAY BAN", "WAYFARER"],
    tags: ["LENTES EN PROMO", "MES DE LA MADRE?"],
  });
});

test("extractAssignedJson reads LS.variants assignment", () => {
  const html = '<script>LS.variants = [{"id":923,"product_id":207,"option0":"STANDARD (M)"}];</script>';
  assert.deepEqual(extractAssignedJson(html, "LS.variants"), [
    { id: 923, product_id: 207, option0: "STANDARD (M)" },
  ]);
});

test("extractAssignedJson parses nested LS.variants assignment", () => {
  const html = '<script>LS.variants = [{"id":1,"options":[{"a":1}]}];</script>';
  assert.deepEqual(extractAssignedJson(html, "LS.variants"), [
    { id: 1, options: [{ a: 1 }] },
  ]);
});
