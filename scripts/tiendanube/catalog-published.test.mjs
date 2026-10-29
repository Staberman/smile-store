import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { isPublished, publishedOnly } from "../../lib/catalog-published.mjs";

const catalog = JSON.parse(
  fs.readFileSync(path.join(process.cwd(), "data/tiendanube-catalog.json"), "utf8"),
);

test("only an explicit published: false unpublishes a product", () => {
  const product = { slug: "producto" };
  assert.equal(isPublished(product), true);
  assert.equal(isPublished({ ...product, published: true }), true);
  assert.equal(isPublished({ ...product, published: false }), false);
  assert.deepEqual(
    publishedOnly([product, { slug: "oculto", published: false }, { slug: "visible", published: true }]).map(
      (entry) => entry.slug,
    ),
    ["producto", "visible"],
  );
});

test("the catalog stores published state only as published: false", () => {
  // The sync writes the field on unpublished products alone, so it never
  // rewrites the published ones.
  for (const product of catalog) {
    assert.ok(!("published" in product) || product.published === false, `${product.slug}: published must be absent or false`);
  }
});

test("the site's product list drops every unpublished product and keeps the rest", () => {
  // lib/catalog.ts builds every list and lookup from publishedOnly(catalog).
  const listed = publishedOnly(catalog);
  assert.ok(listed.every((product) => product.published !== false));
  assert.deepEqual(
    listed.map((product) => product.slug),
    catalog.filter((product) => !("published" in product)).map((product) => product.slug),
  );
});
