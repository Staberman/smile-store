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
