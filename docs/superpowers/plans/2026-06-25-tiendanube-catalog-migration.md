# Tiendanube Catalog Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the hand-written Smile catalog with a generated Tiendanube catalog, remove local cart behavior, and send `Comprar ahora` actions directly into Tiendanube's purchase flow while preserving the current storefront aesthetic.

**Architecture:** Add a focused import pipeline that reads the Tiendanube CSV, fetches each public product page, extracts `LS.product` and `LS.variants`, and writes a normalized JSON catalog. The Next.js UI keeps the existing black/gold premium styling and swaps its data source plus cart behavior for direct Tiendanube checkout forms.

**Tech Stack:** Next.js 14 App Router, React 18, TypeScript, Tailwind CSS 4, Node.js scripts, built-in `node:test` for import helper tests, generated JSON catalog.

## Global Constraints

- Source CSV: `/Users/lautaroantunez/Downloads/tiendanube-3759046-17823966794630592303951883044.csv`
- CSV encoding: `cp1252`
- CSV delimiter: semicolon
- Import only products where `Mostrar en tienda = SI`
- Expected visible products from current CSV: `178`
- Public product URL pattern: `https://www.smiletiendaimp.com.ar/productos/{slug}/`
- Checkout form action: `https://www.smiletiendaimp.com.ar/comprar/`
- No local cart, no local storage cart state, no WhatsApp checkout.
- Preserve current aesthetic: black premium storefront, gold accent `#c9a96e`, Inter/Cormorant typography, dark product cards, existing header/footer feel, and current listing/detail page rhythm.
- Preserve out-of-stock products but disable their purchase action.
- Strip embedded base64 images from descriptions.
- Convert protocol-relative image URLs to `https://...`.

---

## File Structure

- Create `scripts/tiendanube/import-catalog.mjs`: executable import script that reads CSV, scrapes Tiendanube pages, normalizes records, and writes JSON plus a summary.
- Create `scripts/tiendanube/catalog-utils.mjs`: pure parsing/sanitizing helpers used by the importer and tests.
- Create `scripts/tiendanube/catalog-utils.test.mjs`: built-in Node tests for parsing prices, categories, descriptions, image URLs, and LS JSON extraction.
- Create `data/tiendanube-catalog.json`: generated catalog consumed by the app.
- Create `data/tiendanube-import-summary.json`: generated import diagnostics.
- Create `lib/catalog.ts`: typed accessors for generated catalog data.
- Create `components/checkout/TiendanubeCheckoutForm.tsx`: direct submit form to Tiendanube.
- Modify `lib/products.ts`: remove manual arrays or reduce it to compatibility exports backed by `lib/catalog.ts`.
- Modify `components/brand/ProductGrid.tsx`: keep current card styling, use generated product shape, remove local cart behavior, render buy/detail actions.
- Modify `app/tienda/productos/[slug]/ProductDetailClient.tsx`: keep current detail styling, render migrated fields, variant selector, and checkout form.
- Modify `app/tienda/productos/[slug]/page.tsx`: use generated catalog accessors.
- Modify `app/tienda/page.tsx`: build categories from generated catalog while keeping current tab/grid aesthetic.
- Modify brand/category route files under `app/tienda/**/page.tsx`: either route through generic catalog filters or keep wrappers that use generated category data.
- Modify `app/layout.tsx`: remove `CartProvider` and `CartButton`, keep fonts and global layout.
- Remove or orphan from UI path: `components/cart/CartSidebar.tsx`, `components/cart/CartButton.tsx`, `lib/context/CartContext.tsx`.
- Modify `components/layout/Footer.tsx`: update links to generated category routes only if old links become invalid.

---

### Task 1: Catalog Helpers And Tests

**Files:**
- Create: `scripts/tiendanube/catalog-utils.mjs`
- Create: `scripts/tiendanube/catalog-utils.test.mjs`
- Modify: `package.json`

**Interfaces:**
- Produces:
  - `parseTiendanubePrice(value: string): number | null`
  - `normalizeImageUrl(value: string | null | undefined): string | null`
  - `stripBase64Images(html: string): string`
  - `htmlToText(html: string): string`
  - `parseCategoryField(value: string): { path: string[]; tags: string[] }`
  - `extractAssignedJson(html: string, assignmentName: string): unknown | null`

- [ ] **Step 1: Add failing tests**

Create `scripts/tiendanube/catalog-utils.test.mjs`:

```js
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
    "https://dcdn-us.mitiendanube.com/stores/003/image.webp"
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
  assert.equal(htmlToText("<p>Linea uno</p><ul><li>Formato: Aviador.</li></ul>"), "Linea uno Formato: Aviador.");
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
```

- [ ] **Step 2: Add test script**

Modify `package.json` scripts:

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "test:catalog": "node --test scripts/tiendanube/*.test.mjs"
  }
}
```

- [ ] **Step 3: Run tests and verify failure**

Run: `npm run test:catalog`

Expected: FAIL because `scripts/tiendanube/catalog-utils.mjs` does not exist yet.

- [ ] **Step 4: Implement helper module**

Create `scripts/tiendanube/catalog-utils.mjs`:

```js
export function parseTiendanubePrice(value) {
  const raw = String(value ?? "").trim();
  if (!raw) return null;
  const normalized = raw.replace(/,/g, "");
  const parsed = Number.parseFloat(normalized);
  if (!Number.isFinite(parsed)) return null;
  return Math.round(parsed);
}

export function normalizeImageUrl(value) {
  const raw = String(value ?? "").trim();
  if (!raw) return null;
  if (raw.startsWith("//")) return `https:${raw}`;
  if (raw.startsWith("http://")) return raw.replace(/^http:\/\//, "https://");
  if (raw.startsWith("https://")) return raw;
  return null;
}

export function stripBase64Images(html) {
  return String(html ?? "").replace(/<img\b[^>]*src=["']data:image\/[^"']+["'][^>]*>/gi, "");
}

export function htmlToText(html) {
  return stripBase64Images(html)
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<\/(p|li|div|h[1-6])>/gi, " ")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

export function parseCategoryField(value) {
  const raw = String(value ?? "").trim();
  if (!raw) return { path: [], tags: [] };
  const [pathPart, ...tagParts] = raw.split(",");
  const path = pathPart
    .split(">")
    .map((part) => part.trim())
    .filter(Boolean);
  const tags = tagParts.map((part) => part.trim()).filter(Boolean);
  return { path, tags };
}

export function extractAssignedJson(html, assignmentName) {
  const escaped = assignmentName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = String(html ?? "").match(new RegExp(`${escaped}\\s*=\\s*(\\[.*?\\]|\\{.*?\\});`, "s"));
  if (!match) return null;
  return JSON.parse(match[1]);
}
```

- [ ] **Step 5: Run tests and verify pass**

Run: `npm run test:catalog`

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add package.json scripts/tiendanube/catalog-utils.mjs scripts/tiendanube/catalog-utils.test.mjs
git commit -m "test: add tiendanube catalog helpers"
```

---

### Task 2: Tiendanube Import Script

**Files:**
- Create: `scripts/tiendanube/import-catalog.mjs`
- Create: `data/tiendanube-catalog.json`
- Create: `data/tiendanube-import-summary.json`

**Interfaces:**
- Consumes helpers from `scripts/tiendanube/catalog-utils.mjs`.
- Produces JSON catalog records consumed by `lib/catalog.ts`.

- [ ] **Step 1: Write importer skeleton**

Create `scripts/tiendanube/import-catalog.mjs`:

```js
import fs from "node:fs/promises";
import path from "node:path";
import {
  extractAssignedJson,
  htmlToText,
  normalizeImageUrl,
  parseCategoryField,
  parseTiendanubePrice,
  stripBase64Images,
} from "./catalog-utils.mjs";

const CSV_PATH =
  process.argv[2] ??
  "/Users/lautaroantunez/Downloads/tiendanube-3759046-17823966794630592303951883044.csv";
const STORE_ORIGIN = "https://www.smiletiendaimp.com.ar";
const OUT_DIR = path.resolve("data");

function parseCsvLine(line) {
  const cells = [];
  let current = "";
  let quoted = false;
  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const next = line[index + 1];
    if (char === '"' && quoted && next === '"') {
      current += '"';
      index += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === ";" && !quoted) {
      cells.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  cells.push(current);
  return cells;
}

function parseCsv(text) {
  const rows = [];
  let row = "";
  let quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];
    if (char === '"' && quoted && next === '"') {
      row += char + next;
      index += 1;
    } else if (char === '"') {
      quoted = !quoted;
      row += char;
    } else if ((char === "\n" || char === "\r") && !quoted) {
      if (row.trim()) rows.push(parseCsvLine(row.replace(/\r$/, "")));
      row = "";
      if (char === "\r" && next === "\n") index += 1;
    } else {
      row += char;
    }
  }
  if (row.trim()) rows.push(parseCsvLine(row));
  const [headers, ...records] = rows;
  return records.map((cells) =>
    Object.fromEntries(headers.map((header, index) => [header, cells[index] ?? ""]))
  );
}

async function fetchHtml(url) {
  const response = await fetch(url, {
    headers: {
      "user-agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Safari/537.36",
      accept: "text/html",
    },
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.text();
}

function variantOptions(variant) {
  return [variant.option0, variant.option1, variant.option2].filter(Boolean);
}

function normalizeProduct(row, pageData) {
  const slug = row["Identificador de URL"].trim();
  const category = parseCategoryField(row["Categorías"]);
  const descriptionHtml = stripBase64Images(row["Descripción"]);
  const variants = pageData.variants.map((variant) => ({
    id: variant.id,
    sku: variant.sku ?? row.SKU ?? "",
    options: variantOptions(variant),
    price: variant.price_number ?? parseTiendanubePrice(row.Precio),
    promotionalPrice: variant.promotional_price_number ?? parseTiendanubePrice(row["Precio promocional"]),
    stock: Number(variant.stock ?? row.Stock ?? 0),
    available: Boolean(variant.available) && Number(variant.stock ?? 0) > 0,
    image: normalizeImageUrl(variant.image_url),
  }));
  const images = [...new Set(variants.map((variant) => variant.image).filter(Boolean))];
  return {
    id: String(pageData.product?.id ?? slug),
    tiendanubeProductId: pageData.product?.id ?? null,
    slug,
    name: row.Nombre.trim(),
    brand: (row.Marca || pageData.product?.brand || "").trim(),
    categories: category.path,
    tags: [...new Set([...category.tags, ...String(row.Tags ?? "").split(",").map((tag) => tag.trim()).filter(Boolean)])],
    descriptionHtml,
    descriptionText: htmlToText(descriptionHtml),
    price: parseTiendanubePrice(row.Precio),
    promotionalPrice: parseTiendanubePrice(row["Precio promocional"]),
    stock: Number(row.Stock || 0),
    images,
    seoTitle: row["Título para SEO"] || row.Nombre,
    seoDescription: row["Descripción para SEO"] || "",
    sourceUrl: `${STORE_ORIGIN}/productos/${slug}/`,
    variants,
    importWarnings: pageData.warnings,
  };
}

async function scrapeProduct(slug) {
  const url = `${STORE_ORIGIN}/productos/${slug}/`;
  const html = await fetchHtml(url);
  const product = extractAssignedJson(html, "LS.product");
  const variants = extractAssignedJson(html, "LS.variants") ?? [];
  return { product, variants, warnings: [] };
}

async function main() {
  const buffer = await fs.readFile(CSV_PATH);
  const rows = parseCsv(buffer.toString("latin1"));
  const visibleRows = rows.filter((row) => String(row["Mostrar en tienda"] ?? "").trim().toUpperCase() === "SI");
  const products = [];
  const errors = [];
  for (const row of visibleRows) {
    const slug = row["Identificador de URL"].trim();
    try {
      const pageData = await scrapeProduct(slug);
      products.push(normalizeProduct(row, pageData));
      process.stdout.write(".");
    } catch (error) {
      errors.push({ slug, message: error.message });
      products.push(normalizeProduct(row, { product: null, variants: [], warnings: [error.message] }));
      process.stdout.write("!");
    }
  }
  const summary = {
    csvPath: CSV_PATH,
    csvRowsRead: rows.length,
    visibleProductsImported: products.length,
    scrapeErrors: errors,
    productsWithVariants: products.filter((product) => product.variants.length > 0).length,
    productsWithoutImages: products.filter((product) => product.images.length === 0).map((product) => product.slug),
  };
  await fs.mkdir(OUT_DIR, { recursive: true });
  await fs.writeFile(path.join(OUT_DIR, "tiendanube-catalog.json"), `${JSON.stringify(products, null, 2)}\n`);
  await fs.writeFile(path.join(OUT_DIR, "tiendanube-import-summary.json"), `${JSON.stringify(summary, null, 2)}\n`);
  console.log(`\nImported ${products.length} visible products`);
  if (errors.length) console.log(`Scrape errors: ${errors.length}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
```

- [ ] **Step 2: Run importer**

Run: `node scripts/tiendanube/import-catalog.mjs`

Expected: prints progress dots and `Imported 178 visible products`.

- [ ] **Step 3: Inspect generated summary**

Run: `node -e 'const s=require("./data/tiendanube-import-summary.json"); console.log(s.visibleProductsImported, s.productsWithVariants, s.scrapeErrors.length, s.productsWithoutImages.length)'`

Expected: first number is `178`; scrape errors should be reviewed before continuing.

- [ ] **Step 4: Commit**

```bash
git add scripts/tiendanube/import-catalog.mjs data/tiendanube-catalog.json data/tiendanube-import-summary.json
git commit -m "feat: import tiendanube catalog data"
```

---

### Task 3: Typed Catalog Accessors

**Files:**
- Create: `lib/catalog.ts`
- Modify: `lib/products.ts`

**Interfaces:**
- Produces:
  - `CatalogProduct`
  - `CatalogVariant`
  - `allProducts: CatalogProduct[]`
  - `getProductBySlug(slug: string): CatalogProduct | undefined`
  - `getCategoryTree(): CategoryNode[]`
  - `formatPrice(n: number | null | undefined): string`

- [ ] **Step 1: Create typed catalog module**

Create `lib/catalog.ts`:

```ts
import catalog from "@/data/tiendanube-catalog.json";

export type CatalogVariant = {
  id: number | null;
  sku: string;
  options: string[];
  price: number | null;
  promotionalPrice: number | null;
  stock: number;
  available: boolean;
  image: string | null;
};

export type CatalogProduct = {
  id: string;
  tiendanubeProductId: number | null;
  slug: string;
  name: string;
  brand: string;
  categories: string[];
  tags: string[];
  descriptionHtml: string;
  descriptionText: string;
  price: number | null;
  promotionalPrice: number | null;
  stock: number;
  images: string[];
  seoTitle: string;
  seoDescription: string;
  sourceUrl: string;
  variants: CatalogVariant[];
  importWarnings: string[];
};

export type CategoryNode = {
  label: string;
  slug: string;
  path: string[];
  count: number;
  children: CategoryNode[];
};

export const allProducts = catalog as CatalogProduct[];

export function formatPrice(value: number | null | undefined): string {
  if (value === null || value === undefined) return "Consultar";
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(value);
}

export function getProductBySlug(slug: string): CatalogProduct | undefined {
  return allProducts.find((product) => product.slug === slug);
}

export function slugifyCategory(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function getCategoryTree(): CategoryNode[] {
  const root: CategoryNode[] = [];
  for (const product of allProducts) {
    let level = root;
    const path: string[] = [];
    for (const label of product.categories) {
      path.push(label);
      const slug = slugifyCategory(label);
      let node = level.find((item) => item.label === label);
      if (!node) {
        node = { label, slug, path: [...path], count: 0, children: [] };
        level.push(node);
      }
      node.count += 1;
      level = node.children;
    }
  }
  return root;
}
```

- [ ] **Step 2: Keep compatibility exports temporarily**

Replace `lib/products.ts` with compatibility exports:

```ts
export {
  allProducts,
  formatPrice,
  getCategoryTree,
  getProductBySlug,
  slugifyCategory,
};
export type { CatalogProduct as Product, CatalogVariant as Variant } from "./catalog";
```

- [ ] **Step 3: Type check**

Run: `npm run build`

Expected: build may fail in UI files that still expect old fields. Note exact failures for Task 5 and Task 6.

- [ ] **Step 4: Commit after UI tasks instead of now if build is broken**

If `npm run build` fails only because UI still expects old product fields, do not commit this task alone. Continue to Task 4 and commit a combined data-access/UI transition.

---

### Task 4: Direct Tiendanube Checkout Component

**Files:**
- Create: `components/checkout/TiendanubeCheckoutForm.tsx`

**Interfaces:**
- Consumes: `CatalogProduct`, `CatalogVariant`.
- Produces: reusable checkout button preserving current gold button styling.

- [ ] **Step 1: Create checkout form component**

```tsx
import type { CatalogProduct, CatalogVariant } from "@/lib/catalog";

type Props = {
  product: CatalogProduct;
  variant: CatalogVariant | null;
  disabled?: boolean;
  label?: string;
  className?: string;
};

export default function TiendanubeCheckoutForm({
  product,
  variant,
  disabled = false,
  label = "Comprar ahora",
  className = "",
}: Props) {
  const options = variant?.options ?? [];
  const canBuy =
    !disabled &&
    product.tiendanubeProductId !== null &&
    variant !== null &&
    variant.available;

  return (
    <form method="post" action="https://www.smiletiendaimp.com.ar/comprar/" className={className}>
      <input type="hidden" name="add_to_cart" value={product.tiendanubeProductId ?? ""} />
      <input type="hidden" name="quantity" value="1" />
      {options.map((option, index) => (
        <input key={`${option}-${index}`} type="hidden" name={`variation[${index}]`} value={option} />
      ))}
      <button
        type="submit"
        disabled={!canBuy}
        className="flex w-full items-center justify-center gap-2 rounded-full py-4 text-[11px] font-medium uppercase tracking-[0.26em] transition-all duration-300 disabled:cursor-not-allowed disabled:opacity-35"
        style={{
          background: canBuy ? "#c9a96e" : "#c9a96e18",
          color: canBuy ? "#0a0a0a" : "#c9a96e",
          border: "1px solid #c9a96e40",
        }}
      >
        {canBuy ? label : "Sin stock"}
      </button>
    </form>
  );
}
```

- [ ] **Step 2: Commit with UI transition task**

Do not commit this component until it is used by product cards and detail pages.

---

### Task 5: Product Grid With Current Aesthetic And No Cart

**Files:**
- Modify: `components/brand/ProductGrid.tsx`

**Interfaces:**
- Consumes: `CatalogProduct[]`.
- Uses: `TiendanubeCheckoutForm`.

- [ ] **Step 1: Replace old cart behavior**

Remove:

```ts
import { useCart } from "@/lib/context/CartContext";
```

Add:

```ts
import TiendanubeCheckoutForm from "@/components/checkout/TiendanubeCheckoutForm";
import type { CatalogProduct } from "@/lib/catalog";
```

- [ ] **Step 2: Update props and card variant state**

Use:

```ts
interface Props {
  products: CatalogProduct[];
  brandLabel: string;
  filterBy?: "collection" | "brand";
}

function ProductCard({ product, collectionLabel }: { product: CatalogProduct; collectionLabel: string }) {
  const availableVariants = product.variants.filter((variant) => variant.available);
  const [selectedVariantId, setSelectedVariantId] = useState<number | null>(
    availableVariants[0]?.id ?? product.variants[0]?.id ?? null
  );
  const selectedVariant =
    product.variants.find((variant) => variant.id === selectedVariantId) ??
    availableVariants[0] ??
    product.variants[0] ??
    null;
}
```

- [ ] **Step 3: Preserve visual styling**

Keep these existing visual classes unchanged unless data shape requires minor text changes:

```tsx
<section className="bg-[#0a0a0a] px-6 py-20 text-[#f0ece4] md:px-12 md:py-28">
<div className="group relative overflow-hidden rounded-[1.4rem] border border-white/8 bg-white/[0.025] transition-all duration-500">
<div className="relative h-56 overflow-hidden bg-[#121010]">
```

- [ ] **Step 4: Render imported image and price**

Use:

```tsx
const image = selectedVariant?.image ?? product.images[0];
const price = selectedVariant?.promotionalPrice ?? selectedVariant?.price ?? product.promotionalPrice ?? product.price;
```

- [ ] **Step 5: Replace add button with checkout form**

Use:

```tsx
<TiendanubeCheckoutForm
  product={product}
  variant={selectedVariant}
  disabled={!selectedVariant?.available}
/>
```

- [ ] **Step 6: Run build**

Run: `npm run build`

Expected: remaining failures point to product detail/category pages, not `ProductGrid`.

---

### Task 6: Product Detail With Imported Variants

**Files:**
- Modify: `app/tienda/productos/[slug]/page.tsx`
- Modify: `app/tienda/productos/[slug]/ProductDetailClient.tsx`

**Interfaces:**
- Consumes: `getProductBySlug`, `allProducts`, `CatalogProduct`, `CatalogVariant`.
- Uses: `TiendanubeCheckoutForm`.

- [ ] **Step 1: Update server page imports**

Use:

```ts
import { allProducts, getProductBySlug } from "@/lib/catalog";
```

Generate params from `allProducts.map((product) => ({ slug: product.slug }))`.

- [ ] **Step 2: Update client component types**

Replace old `Product` type with:

```ts
import type { CatalogProduct, CatalogVariant } from "@/lib/catalog";
```

- [ ] **Step 3: Keep current layout classes**

Preserve the existing detail layout:

```tsx
<main className="min-h-screen bg-[#0a0a0a] text-[#f0ece4]">
<div className="mx-auto max-w-7xl px-6 py-12 md:px-12 md:py-20">
<div className="grid gap-12 lg:grid-cols-2 lg:gap-20">
```

- [ ] **Step 4: Replace old variant selector**

Use imported variants:

```tsx
const [selectedVariantId, setSelectedVariantId] = useState<number | null>(
  product.variants.find((variant) => variant.available)?.id ?? product.variants[0]?.id ?? null
);
const selectedVariant =
  product.variants.find((variant) => variant.id === selectedVariantId) ??
  product.variants[0] ??
  null;
const displayPrice =
  selectedVariant?.promotionalPrice ??
  selectedVariant?.price ??
  product.promotionalPrice ??
  product.price;
```

- [ ] **Step 5: Replace add-to-cart button**

Use:

```tsx
<TiendanubeCheckoutForm product={product} variant={selectedVariant} disabled={!selectedVariant?.available} />
```

- [ ] **Step 6: Render sanitized description**

Use text rendering first to avoid unsafe HTML:

```tsx
{product.descriptionText && (
  <p className="text-sm leading-[1.9] text-[#6a6560]">{product.descriptionText}</p>
)}
```

- [ ] **Step 7: Run build**

Run: `npm run build`

Expected: failures now limited to category route imports.

---

### Task 7: Category And Listing Pages From Generated Catalog

**Files:**
- Modify: `app/tienda/page.tsx`
- Modify: category route files under `app/tienda/**/page.tsx`
- Modify: `components/layout/Footer.tsx` if old category links no longer map.

**Interfaces:**
- Consumes: `allProducts`, `getCategoryTree`, `slugifyCategory`.

- [ ] **Step 1: Build category groups in `app/tienda/page.tsx`**

Use generated categories:

```ts
import { allProducts, getCategoryTree } from "@/lib/catalog";

const categoryTree = getCategoryTree();
const primaryCategories = categoryTree.map((category) => ({
  id: category.slug,
  label: category.label,
  subcategories: [
    {
      id: "todos",
      label: "Todos",
      products: allProducts.filter((product) => product.categories[0] === category.label),
      brandLabel: category.label,
    },
    ...category.children.map((child) => ({
      id: child.slug,
      label: child.label,
      products: allProducts.filter((product) => product.categories.includes(child.label)),
      brandLabel: `${category.label} · ${child.label}`,
    })),
  ],
}));
```

- [ ] **Step 2: Preserve existing tabs and carousel feel**

Keep the current sticky category tabs and dark/gold subcategory tabs. Only replace arrays and labels.

- [ ] **Step 3: Simplify old brand route pages**

For each old manual route, filter generated catalog by category or brand and render existing `BrandCarousel` + `ProductGrid`. Example for Ray-Ban:

```tsx
import ProductGrid from "@/components/brand/ProductGrid";
import BrandCarousel from "@/components/brand/BrandCarousel";
import { allProducts } from "@/lib/catalog";

const products = allProducts.filter((product) => product.brand.toLowerCase().includes("ray"));

export default function RayBanPage() {
  return (
    <main className="min-h-screen bg-[#0a0a0a] text-[#f0ece4]">
      <BrandCarousel products={products} brand="Ray-Ban" />
      <ProductGrid products={products} brandLabel="Ray-Ban" />
    </main>
  );
}
```

- [ ] **Step 4: Run build**

Run: `npm run build`

Expected: build errors no longer mention missing old product arrays.

---

### Task 8: Remove Cart From Root Layout And UI Path

**Files:**
- Modify: `app/layout.tsx`
- Delete or leave unused pending cleanup:
  - `components/cart/CartButton.tsx`
  - `components/cart/CartSidebar.tsx`
  - `lib/context/CartContext.tsx`

**Interfaces:**
- Produces root layout without cart provider.

- [ ] **Step 1: Remove cart imports**

In `app/layout.tsx`, remove:

```ts
import { CartProvider } from "@/lib/context/CartContext";
import CartButton from "@/components/cart/CartButton";
```

- [ ] **Step 2: Render children directly**

Use:

```tsx
<body>{children}</body>
```

- [ ] **Step 3: Search for cart references**

Run: `rg "CartProvider|CartButton|CartSidebar|useCart|whatsappCheckout|smile_cart|Agregar al carrito" app components lib`

Expected: no live UI references remain.

- [ ] **Step 4: Delete cart files if no references remain**

Run:

```bash
git rm components/cart/CartButton.tsx components/cart/CartSidebar.tsx lib/context/CartContext.tsx
```

- [ ] **Step 5: Run build**

Run: `npm run build`

Expected: PASS.

- [ ] **Step 6: Commit catalog UI transition**

```bash
git add app components lib data package.json scripts
git commit -m "feat: migrate storefront to tiendanube catalog"
```

---

### Task 9: Checkout Verification And Visual Pass

**Files:**
- Modify only if verification reveals issues:
  - `components/checkout/TiendanubeCheckoutForm.tsx`
  - `components/brand/ProductGrid.tsx`
  - `app/tienda/productos/[slug]/ProductDetailClient.tsx`

**Interfaces:**
- Verifies app behavior and final aesthetic.

- [ ] **Step 1: Start dev server**

Run: `npm run dev`

Expected: Next.js starts on `http://localhost:3000`.

- [ ] **Step 2: Open storefront pages**

Check:

- `http://localhost:3000/tienda`
- `http://localhost:3000/tienda/productos/aviador-classic-dorado-verde1`
- one watch product from the generated catalog
- one premium sunglasses product from the generated catalog

- [ ] **Step 3: Visual criteria**

Confirm:

- black background and gold accent remain
- product cards keep current rounded dark-card style
- header/footer still match current project
- no cart floating button appears
- buttons say `Comprar ahora` or `Sin stock`
- product images render
- long product names and variant labels do not overflow on mobile widths

- [ ] **Step 4: Checkout behavior**

Use browser devtools or inspect the form markup for one in-stock variant:

```html
<form method="post" action="https://www.smiletiendaimp.com.ar/comprar/">
  <input name="add_to_cart" value="207087421" />
  <input name="variation[0]" value="STANDARD (M)" />
  <input name="variation[1]" value="Dorado/Verde" />
</form>
```

Expected: submit goes to Tiendanube purchase flow and does not visit `/productos/{slug}/`.

- [ ] **Step 5: Final checks**

Run:

```bash
npm run test:catalog
npm run build
rg "Agregar al carrito|WhatsApp|whatsappCheckout|smile_cart|CartProvider|useCart" app components lib
```

Expected:

- catalog tests PASS
- build PASS
- search returns no active cart/WhatsApp checkout references

- [ ] **Step 6: Commit verification fixes**

If any fixes were needed:

```bash
git add app components lib scripts data package.json
git commit -m "fix: verify tiendanube checkout storefront"
```

---

## Self-Review

- Spec coverage: The plan covers CSV parsing, public page scraping, generated catalog, category migration, no-cart UI, direct Tiendanube purchase form, visual preservation, error reporting, and build/test verification.
- Placeholder scan: No `TBD`, `TODO`, or undefined implementation tasks remain.
- Type consistency: Product and variant types are defined in `lib/catalog.ts`; UI tasks consume `CatalogProduct` and `CatalogVariant`; checkout form uses the same types.
- Scope check: The work is large but cohesive: one storefront migration with one generated data source and one checkout flow.
