import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import imageLoader, { TIENDANUBE_WIDTHS, tiendanubeSize } from "../../lib/image-loader.mjs";

const projectRoot = process.cwd();
const read = (relativePath) => fs.readFileSync(path.join(projectRoot, relativePath), "utf8");

const STORE = "https://dcdn-us.mitiendanube.com/stores/003/759/046/products";
const photo = `${STORE}/img_0653-ebb226c5e66439100017706680869165-1024-1024.webp`;
const load = (src, width, quality) => imageLoader({ src, width, quality });

// ── Tiendanube ───────────────────────────────────────────────────────────────

test("Tiendanube photos are requested at the smallest size at least as wide", () => {
  assert.deepEqual(TIENDANUBE_WIDTHS, [50, 100, 240, 320, 480, 640]);
  const cases = [
    [1, "50-0"], [50, "50-0"], [51, "100-0"], [64, "100-0"], [128, "240-0"], [240, "240-0"],
    [256, "320-0"], [384, "480-0"], [480, "480-0"], [640, "640-0"], [641, "1024-1024"],
    [750, "1024-1024"], [3840, "1024-1024"],
  ];
  for (const [width, size] of cases) {
    assert.equal(tiendanubeSize(width), size, `${width}`);
    assert.equal(load(photo, width), `${STORE}/img_0653-ebb226c5e66439100017706680869165-${size}.webp`, `${width}`);
  }
});

test("the sizes next/image asks for land on the CDN's sizes", () => {
  // Cards: ProductMedia, 192 px wide, gets 1x/2x candidates at 256 and 384.
  assert.match(load(photo, 256), /-320-0\.webp$/);
  assert.match(load(photo, 384), /-480-0\.webp$/);
  // Search rows: 56 px thumbnails, 1x/2x at 64 and 128.
  assert.match(load(photo, 64), /-100-0\.webp$/);
  assert.match(load(photo, 128), /-240-0\.webp$/);
});

test("only the last size suffix of a file name changes", () => {
  const twice = `${STORE}/hexagonal-doradoverde-1-227facac717bd19fbd17125052950509-640-0-7604c248955289edbb17604505536382-1024-1024.webp`;
  assert.equal(
    load(twice, 384),
    `${STORE}/hexagonal-doradoverde-1-227facac717bd19fbd17125052950509-640-0-7604c248955289edbb17604505536382-480-0.webp`,
  );
  const dated = `${STORE}/whatsapp-image-2025-11-20-at-08-48-41-2-946cd1b589958edbde17636406252978-1024-1024.webp`;
  assert.equal(load(dated, 64), dated.replace(/-1024-1024\.webp$/, "-100-0.webp"));
});

test("any stored size, extension, query and the legacy CloudFront host work the same", () => {
  assert.equal(load(`${STORE}/a-1-640-0.webp`, 750), `${STORE}/a-1-1024-1024.webp`, "a -640-0 photo asked larger");
  assert.equal(load(`${STORE}/a-1024-1024.png`, 256), `${STORE}/a-320-0.png`);
  assert.equal(load(`${STORE}/a-640-0.jpg`, 128), `${STORE}/a-240-0.jpg`);
  assert.equal(load(`${STORE}/a-1024-1024.JPEG`, 50), `${STORE}/a-50-0.JPEG`);
  assert.equal(load(`${STORE}/a-1024-1024.webp?v=2`, 384), `${STORE}/a-480-0.webp?v=2`);
  const legacy = "https://d1a9qnv764bsoo.cloudfront.net/stores/003/759/046/products/a-1024-1024.webp";
  assert.equal(load(legacy, 384), "https://d1a9qnv764bsoo.cloudfront.net/stores/003/759/046/products/a-480-0.webp");
});

test("Tiendanube files without a size suffix are left alone", () => {
  for (const src of [
    `${STORE}/frame-d465d553a68023029217133189317260.png`,
    `${STORE}/photo-3-12345678901234567890.png`, // a long numeric id, not a size
    `${STORE}/plain.webp`,
    "https://dcdn-us.mitiendanube.com/assets/themes/x/static/images/empty-placeholder.png",
  ]) {
    assert.equal(load(src, 384), src);
  }
});

// ── Other hosts ──────────────────────────────────────────────────────────────

test("Unsplash resizes through its own query parameters", () => {
  const src = "https://images.unsplash.com/photo-1523170335258-f5ed11844a49?auto=format&fit=crop&w=1800&q=80";
  const url = new URL(load(src, 828, 60));
  assert.equal(url.searchParams.get("w"), "828");
  assert.equal(url.searchParams.get("q"), "60");
  assert.equal(url.searchParams.get("auto"), "format");
  assert.equal(url.searchParams.get("fit"), "crop");
  assert.equal(new URL(load(src, 640)).searchParams.get("q"), "75", "next/image default quality");
});

test("MercadoLibre, other hosts, local files and data URIs are served as they are", () => {
  for (const src of [
    "https://http2.mlstatic.com/D_NQ_NP_829189-MLA89375775941_082025-F.webp",
    "https://example.com/a-1024-1024.webp",
    "/images/smile-logo.svg",
    "/images/products/tommy-hilfiger/1791243.jpg",
    "data:image/svg+xml,%3Csvg%3E%3C/svg%3E",
  ]) {
    assert.equal(load(src, 384), src);
  }
});

test("odd input never throws and comes back as given", () => {
  assert.equal(imageLoader(undefined), "");
  assert.equal(imageLoader(null), "");
  assert.equal(imageLoader({}), "");
  assert.equal(load(42, 384), "");
  for (const src of ["", "not a url", "https://", "http://[bad", "//dcdn-us.mitiendanube.com/a-1024-1024.webp"]) {
    assert.equal(load(src, 384), src, JSON.stringify(src));
  }
  for (const width of [0, -1, NaN, undefined, "abc"]) assert.equal(load(photo, width), photo, String(width));
});

test("the same input always gives the same URL", () => {
  assert.equal(load(photo, 384, 75), load(photo, 384, 75));
  assert.equal(load(photo, 384, 10), load(photo, 384, 90), "quality does not change Tiendanube URLs");
});

// ── Real catalog ─────────────────────────────────────────────────────────────

test("every catalog photo keeps its host and file, with at most its last suffix changed", () => {
  const catalog = JSON.parse(read("data/tiendanube-catalog.json"));
  const urls = [...new Set(catalog.flatMap((p) => [...p.images, ...p.variants.map((v) => v.image).filter(Boolean)]))];
  const SUFFIX = /-\d{1,4}-\d{1,4}(\.\w+)$/;
  const SIZES = /-(?:50|100|240|320|480|640)-0\.\w+$|-1024-1024\.\w+$/;
  let resized = 0;
  for (const src of urls) {
    const tiendanube = src.startsWith("https://dcdn-us.mitiendanube.com/") && SUFFIX.test(src);
    for (const width of [64, 128, 256, 384, 640, 1080]) {
      const out = load(src, width);
      if (!tiendanube) {
        assert.equal(out, src, src);
        continue;
      }
      assert.equal(out.replace(SUFFIX, "$1"), src.replace(SUFFIX, "$1"), src);
      assert.match(out, SIZES, src);
      resized++;
    }
  }
  assert.ok(resized > 4000, `${resized} resized URLs`);
});

// ── Wiring ───────────────────────────────────────────────────────────────────

test("next/image goes through this loader, never through /_next/image", () => {
  const config = read("next.config.mjs");
  assert.match(config, /loader: "custom"/);
  assert.match(config, /loaderFile: "\.\/lib\/image-loader\.mjs"/);
  for (const host of ["dcdn-us.mitiendanube.com", "d1a9qnv764bsoo.cloudfront.net", "http2.mlstatic.com", "images.unsplash.com"]) {
    assert.ok(config.includes(`hostname: "${host}"`), host);
  }
});
