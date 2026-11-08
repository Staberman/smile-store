import assert from "node:assert/strict";
import test from "node:test";
import {
  mergeCatalogWithTiendanube,
  parseNextPage,
} from "./sync-utils.mjs";

function catalogProduct(overrides = {}) {
  return {
    id: "10",
    tiendanubeProductId: 10,
    slug: "producto",
    name: "Producto",
    brand: "Marca",
    categories: ["RELOJES"],
    tags: [],
    descriptionHtml: "<p>Descripcion</p>",
    descriptionText: "Descripcion",
    price: 100,
    promotionalPrice: null,
    stock: 2,
    images: ["https://example.com/image.jpg"],
    seoTitle: "Producto",
    seoDescription: "Descripcion",
    sourceUrl: "https://example.com/producto",
    variants: [
      {
        id: 101,
        sku: "SKU-1",
        options: [],
        price: 100,
        promotionalPrice: null,
        stock: 2,
        available: true,
        image: null,
      },
    ],
    importWarnings: [],
    ...overrides,
  };
}

function apiProduct(overrides = {}) {
  return {
    id: 10,
    published: true,
    variants: [
      {
        id: 101,
        price: "125.50",
        promotional_price: "110.00",
        stock_management: true,
        stock: 3,
      },
    ],
    ...overrides,
  };
}

test("merge updates only commercial catalog fields", () => {
  const original = catalogProduct();
  const result = mergeCatalogWithTiendanube([original], [apiProduct()]);
  const updated = result.catalog[0];

  assert.equal(updated.name, original.name);
  assert.deepEqual(updated.images, original.images);
  assert.equal(updated.descriptionText, original.descriptionText);
  assert.equal(updated.price, 126);
  assert.equal(updated.promotionalPrice, 110);
  assert.equal(updated.stock, 3);
  assert.deepEqual(updated.variants[0], {
    ...original.variants[0],
    price: 126,
    promotionalPrice: 110,
    stock: 3,
    available: true,
  });
});

test("variant barcodes are carried trimmed, as the last key, and only when set", () => {
  const original = catalogProduct();
  const withBarcode = (barcode) =>
    apiProduct({ variants: [{ ...apiProduct().variants[0], barcode }] });

  const loaded = mergeCatalogWithTiendanube([original], [withBarcode(" 7791234567898 ")]);
  const variant = loaded.catalog[0].variants[0];
  assert.equal(variant.barcode, "7791234567898");
  // Last key, so adding or clearing it is a one-line diff of the catalog file.
  assert.equal(Object.keys(variant).at(-1), "barcode");
  assert.deepEqual(Object.keys(variant).slice(0, -1), Object.keys(original.variants[0]));

  // Unchanged barcode: the entry is left as is.
  const again = mergeCatalogWithTiendanube(loaded.catalog, [withBarcode("7791234567898")]);
  assert.deepEqual(again.catalog, loaded.catalog);
  assert.equal(again.summary.changedProducts, 0);

  // Empty, null or missing in Tiendanube: no field, and a cleared one goes away.
  for (const barcode of ["", "   ", null, undefined]) {
    const plain = mergeCatalogWithTiendanube([original], [withBarcode(barcode)]).catalog[0];
    assert.equal("barcode" in plain.variants[0], false, String(barcode));
    const cleared = mergeCatalogWithTiendanube(loaded.catalog, [withBarcode(barcode)]).catalog[0];
    assert.equal("barcode" in cleared.variants[0], false, String(barcode));
  }

  // The sync stores what Tiendanube has; the Merchant feed decides if it is a GTIN.
  const invalid = mergeCatalogWithTiendanube([original], [withBarcode("ABC-123")]).catalog[0];
  assert.equal(invalid.variants[0].barcode, "ABC-123");
});

test("zero stock and unpublished products become unavailable", () => {
  const zeroStock = mergeCatalogWithTiendanube(
    [catalogProduct()],
    [apiProduct({ variants: [{ ...apiProduct().variants[0], stock: 0 }] })],
  ).catalog[0];
  assert.equal(zeroStock.variants[0].available, false);
  assert.equal(zeroStock.stock, 0);

  const unpublished = mergeCatalogWithTiendanube(
    [catalogProduct()],
    [apiProduct({ published: false })],
  ).catalog[0];
  assert.equal(unpublished.variants[0].available, false);
  assert.equal(unpublished.stock, 0);
});

test("unpublished products are flagged and the flag goes away once published again", () => {
  const original = catalogProduct();
  const published = mergeCatalogWithTiendanube([original], [apiProduct()]).catalog[0];
  // Published products carry no field, so syncs leave their entries alone.
  assert.equal("published" in published, false);

  const unpublished = mergeCatalogWithTiendanube([original], [apiProduct({ published: false })]);
  assert.equal(unpublished.catalog[0].published, false);
  assert.equal(unpublished.summary.unpublishedProducts, 1);
  // Last key, where the catalog file keeps it.
  assert.equal(Object.keys(unpublished.catalog[0]).at(-1), "published");

  // Still unpublished: the entry is left as is.
  const again = mergeCatalogWithTiendanube(unpublished.catalog, [apiProduct({ published: false })]);
  assert.deepEqual(again.catalog, unpublished.catalog);
  assert.equal(again.summary.changedProducts, 0);

  const republished = mergeCatalogWithTiendanube(unpublished.catalog, [apiProduct()]);
  assert.deepEqual(republished.catalog[0], published);
  assert.equal(republished.summary.unpublishedProducts, 0);
});

test("products missing from the API response keep their published state", () => {
  const products = Array.from({ length: 4 }, (_, index) =>
    catalogProduct({
      id: String(index + 1),
      tiendanubeProductId: index + 1,
      ...(index === 3 ? { published: false } : {}),
    }),
  );
  const result = mergeCatalogWithTiendanube(products, [
    apiProduct({ id: 1 }),
    apiProduct({ id: 2 }),
  ]);

  assert.equal(result.summary.missingProducts, 2);
  // A short response neither unpublishes nor republishes anything.
  assert.equal("published" in result.catalog[2], false);
  assert.equal(result.catalog[3].published, false);
  assert.equal(result.catalog[3].variants[0].available, false);
});

test("unmanaged stock remains purchasable", () => {
  const result = mergeCatalogWithTiendanube(
    [catalogProduct()],
    [
      apiProduct({
        variants: [
          {
            ...apiProduct().variants[0],
            stock_management: false,
            stock: null,
          },
        ],
      }),
    ],
  );

  assert.equal(result.catalog[0].variants[0].available, true);
  assert.equal(result.catalog[0].variants[0].stock, 1);
});

test("missing API variants and products are disabled", () => {
  const missingVariant = mergeCatalogWithTiendanube(
    [catalogProduct()],
    [apiProduct({ variants: [] })],
  ).catalog[0];
  assert.equal(missingVariant.variants[0].available, false);

  const products = Array.from({ length: 4 }, (_, index) =>
    catalogProduct({
      id: String(index + 1),
      tiendanubeProductId: index + 1,
      variants: [
        {
          ...catalogProduct().variants[0],
          id: 101 + index,
        },
      ],
    }),
  );
  const apiProducts = products.slice(0, 2).map((product, index) =>
    apiProduct({
      id: product.tiendanubeProductId,
      variants: [
        {
          ...apiProduct().variants[0],
          id: 101 + index,
        },
      ],
    }),
  );
  const result = mergeCatalogWithTiendanube(products, apiProducts);

  assert.equal(result.catalog[2].stock, 0);
  assert.equal(result.catalog[2].variants[0].available, false);
});

test("suspiciously incomplete and duplicate API responses are rejected", () => {
  const products = Array.from({ length: 4 }, (_, index) =>
    catalogProduct({
      id: String(index + 1),
      tiendanubeProductId: index + 1,
    }),
  );

  assert.throws(
    () => mergeCatalogWithTiendanube(products, [apiProduct({ id: 1 })]),
    /incompleta/i,
  );
  assert.throws(
    () =>
      mergeCatalogWithTiendanube(products, [
        apiProduct({ id: 1 }),
        apiProduct({ id: 1 }),
      ]),
    /duplicado/i,
  );
});

test("parseNextPage reads RFC Link headers", () => {
  assert.equal(
    parseNextPage(
      '<https://api.tiendanube.com/v1/1/products?page=2&per_page=200>; rel="next", <https://api.tiendanube.com/v1/1/products?page=4&per_page=200>; rel="last"',
    ),
    "https://api.tiendanube.com/v1/1/products?page=2&per_page=200",
  );
  assert.equal(parseNextPage(null), null);
  assert.equal(
    parseNextPage('<https://api.tiendanube.com/v1/1/products?page=1>; rel="prev"'),
    null,
  );
});
