import assert from "node:assert/strict";
import test from "node:test";
import { carouselImage, carouselSlides } from "../../lib/storefront.mjs";

function product(slug, { image = `/img/${slug}.webp`, stock = 1, variantImage = null } = {}) {
  return {
    slug,
    image,
    variants: [{ available: stock > 0, stock, image: variantImage }],
  };
}

const slugs = (products) => products.map((item) => item.slug);

test("carousel slides prefer products with stock and an image, in list order", () => {
  const products = [
    product("no-image", { image: null }),
    product("sold-out", { stock: 0 }),
    product("a"),
    product("b"),
    product("c"),
    product("d"),
    product("e"),
    product("f"),
  ];

  assert.deepEqual(slugs(carouselSlides(products)), ["a", "b", "c", "d", "e"]);
  assert.deepEqual(slugs(carouselSlides(products, 2)), ["a", "b"]);
});

test("carousel slides top up with the rest of the list when few products qualify", () => {
  const products = [
    product("no-image", { image: null }),
    product("sold-out", { stock: 0 }),
    product("a"),
  ];

  assert.deepEqual(slugs(carouselSlides(products)), ["a", "no-image", "sold-out"]);
});

test("without stocked products, carousel slides fall back to products with an image", () => {
  const products = [
    product("sold-out-no-image", { image: null, stock: 0 }),
    product("sold-out", { stock: 0 }),
  ];

  assert.deepEqual(slugs(carouselSlides(products)), ["sold-out"]);
  assert.deepEqual(slugs(carouselSlides([])), []);
});

test("a slide uses the product image, else the first variant image", () => {
  assert.equal(carouselImage(product("a")), "/img/a.webp");
  assert.equal(
    carouselImage(product("b", { image: null, variantImage: "/img/variant.webp" })),
    "/img/variant.webp",
  );
  assert.equal(carouselImage(product("c", { image: null })), null);
});
