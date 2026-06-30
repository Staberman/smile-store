import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const projectRoot = process.cwd();
const catalog = JSON.parse(
  fs.readFileSync(path.join(projectRoot, "data/tiendanube-catalog.json"), "utf8"),
);

const collectionRoutes = [
  ["app/tienda/marcas/invicta/page.tsx", "/tienda/marcas/invicta"],
  ["app/tienda/marcas/premium/page.tsx", "/tienda/marcas/premium"],
  ["app/tienda/marcas/premium/balenciaga/page.tsx", "/tienda/marcas/premium/balenciaga"],
  ["app/tienda/marcas/premium/cartier/page.tsx", "/tienda/marcas/premium/cartier"],
  ["app/tienda/marcas/premium/celine/page.tsx", "/tienda/marcas/premium/celine"],
  ["app/tienda/marcas/premium/christian-dior/page.tsx", "/tienda/marcas/premium/christian-dior"],
  ["app/tienda/marcas/premium/dolce-gabbana/page.tsx", "/tienda/marcas/premium/dolce-gabbana"],
  ["app/tienda/marcas/premium/fendi/page.tsx", "/tienda/marcas/premium/fendi"],
  ["app/tienda/marcas/premium/gucci/page.tsx", "/tienda/marcas/premium/gucci"],
  ["app/tienda/marcas/premium/louis-vuitton/page.tsx", "/tienda/marcas/premium/louis-vuitton"],
  ["app/tienda/marcas/premium/prada/page.tsx", "/tienda/marcas/premium/prada"],
  ["app/tienda/marcas/premium/saint-laurent/page.tsx", "/tienda/marcas/premium/saint-laurent"],
  ["app/tienda/marcas/premium/versace/page.tsx", "/tienda/marcas/premium/versace"],
  ["app/tienda/marcas/ray-ban/page.tsx", "/tienda/marcas/ray-ban"],
  ["app/tienda/marcas/ray-ban/ferrari/page.tsx", "/tienda/marcas/ray-ban/ferrari"],
  ["app/tienda/relojes/omega-swatch/page.tsx", "/tienda/relojes/omega-swatch"],
];

test("every collection page declares its own canonical URL", () => {
  for (const [relativePath, canonical] of collectionRoutes) {
    const source = fs.readFileSync(path.join(projectRoot, relativePath), "utf8");
    assert.match(
      source,
      new RegExp(`canonical:\\s*["']${canonical.replaceAll("/", "\\/")}["']`),
      `${relativePath} must declare ${canonical}`,
    );
  }
});

test("catalog does not use known pixelated Tommy Hilfiger thumbnails", () => {
  const rejectedFragments = [
    "reloj-mujer-1782776-8488429561e095d2a317727997986137",
    "D_NQ_NP_742501-MLU70800689389_072023-F.webp",
  ];
  const imageUrls = catalog.flatMap((product) => [
    ...product.images,
    ...product.variants.map((variant) => variant.image).filter(Boolean),
  ]);

  for (const fragment of rejectedFragments) {
    assert.equal(
      imageUrls.some((url) => url.includes(fragment)),
      false,
      `replace low-resolution image containing ${fragment}`,
    );
  }
});

test("visible products do not expose placeholder descriptions", () => {
  const visibleProducts = catalog.filter((product) =>
    product.variants.some(
      (variant) => variant.id !== null && variant.available && variant.stock > 0,
    ),
  );
  const placeholders = visibleProducts.filter((product) =>
    /\bGafas X\b/i.test(product.descriptionText),
  );

  assert.deepEqual(
    placeholders.map((product) => product.slug),
    [],
    "replace placeholder product copy with model-specific descriptions",
  );
});

test("checkout requires positive variant stock", () => {
  const source = fs.readFileSync(
    path.join(projectRoot, "components/checkout/TiendanubeCheckoutForm.tsx"),
    "utf8",
  );

  assert.match(source, /variant\.stock\s*>\s*0/);
});

test("checkout posts internally and sends only the selected catalog variant", () => {
  const source = fs.readFileSync(
    path.join(projectRoot, "components/checkout/TiendanubeCheckoutForm.tsx"),
    "utf8",
  );

  assert.match(source, /action="\/api\/checkout\/tiendanube"/);
  assert.match(source, /name="slug"/);
  assert.match(source, /name="variantId"/);
  assert.doesNotMatch(source, /mitiendanube\.com\/comprar/);
  assert.doesNotMatch(source, /name="go_to_checkout"/);
});

test("collection carousel exposes one semantic page heading", () => {
  const carouselSource = fs.readFileSync(
    path.join(projectRoot, "components/brand/BrandCarousel.tsx"),
    "utf8",
  );
  const storePageSource = fs.readFileSync(
    path.join(projectRoot, "app/tienda/page.tsx"),
    "utf8",
  );

  assert.match(carouselSource, /semanticHeading\?: boolean/);
  assert.match(carouselSource, /<h1[^>]*className="sr-only"[^>]*>/);
  assert.match(storePageSource, /<h1[^>]*className="sr-only"[^>]*>/);
});

test("only the active carousel slide can capture product-detail clicks", () => {
  const carouselSource = fs.readFileSync(
    path.join(projectRoot, "components/brand/BrandCarousel.tsx"),
    "utf8",
  );

  assert.match(carouselSource, /pointerEvents:\s*isActive\s*\?\s*"auto"\s*:\s*"none"/);
});

test("SEO outputs convert local product images to absolute URLs", () => {
  const productPageSource = fs.readFileSync(
    path.join(projectRoot, "app/tienda/productos/[slug]/page.tsx"),
    "utf8",
  );

  assert.match(productPageSource, /product\.images\.map\(absoluteUrl\)/);
});

test("empty premium brands stay out of navigation and sitemap", () => {
  const celineHasStock = catalog.some(
    (product) =>
      product.brand === "Celine Paris" &&
      product.variants.some(
        (variant) => variant.id !== null && variant.available && variant.stock > 0,
      ),
  );
  assert.equal(celineHasStock, false);

  const premiumSource = fs.readFileSync(
    path.join(projectRoot, "app/tienda/marcas/premium/page.tsx"),
    "utf8",
  );
  const sitemapSource = fs.readFileSync(
    path.join(projectRoot, "app/sitemap.ts"),
    "utf8",
  );

  assert.match(premiumSource, /availableBrands/);
  assert.match(sitemapSource, /availablePremiumBrandRoutes/);
});
