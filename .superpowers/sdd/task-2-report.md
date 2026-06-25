Status: DONE_WITH_CONCERNS

Commit hash(es):
- `0a04bf8` - `feat: import tiendanube catalog data`

Files changed:
- scripts/tiendanube/import-catalog.mjs
- data/tiendanube-catalog.json
- data/tiendanube-import-summary.json
- .superpowers/sdd/task-2-report.md

Tests/commands run with exact command and result:
- `node --test scripts/tiendanube/catalog-utils.test.mjs` -> PASS (7 tests passed, 0 failed)
- `node --check scripts/tiendanube/import-catalog.mjs` -> PASS
- `node scripts/tiendanube/import-catalog.mjs` -> PASS (`Imported 178 visible products`, `Scrape errors: 0`)
- `node -e 'const s=require("./data/tiendanube-import-summary.json"); console.log(JSON.stringify({visibleProductsImported:s.visibleProductsImported,productsWithPageData:s.productsWithPageData,productsWithScrapeErrors:s.productsWithScrapeErrors,scrapeErrors:s.scrapeErrors.length,productsWithVariants:s.productsWithVariants,productsWithoutImages:s.productsWithoutImages.length}, null, 2));'` -> PASS (`178 imported`, `178 with page data`, `0 scrape errors`, `178 with variants`, `0 without images`)
- `node - <<'NODE' ... protocol/image verification ... NODE` -> PASS (`nonHttpsProductImages: 0`, `nonHttpsVariantImages: 0`)
- `node - <<'NODE' ... variant id verification ... NODE` -> PASS (`noVariantIds: 0`, `emptyVariants: 0`)
- `node - <<'NODE' ... source quality check ... NODE` -> PASS WITH CONCERNS (`emptyDescriptions: 25`, `blankBrands: 46`)

Import summary numbers:
- CSV rows read: 444
- Visible products imported: 178
- Products with page data: 178
- Products with scrape errors: 0
- Products with variants: 178
- Products without images: 0

Self-review notes:
- Used `new TextDecoder("windows-1252").decode(buffer)` for CSV decoding per project constraint.
- Kept the importer scoped to the owned files and reused Task 1 helpers for prices, category parsing, protocol normalization, HTML-to-text conversion, and JSON assignment extraction.
- Added local parsing in the importer for `LS.product` because Tiendanube emits it as a JS object literal rather than strict JSON.
- Extracted gallery images from public markup so products keep full image sets, not just one image per variant.
- Preserved out-of-stock variants and marked them unavailable instead of dropping them.
- Removed malformed embedded base64 description images and normalized protocol-relative/image URLs to HTTPS.

Concerns, if any:
- 25 imported products ended up with empty `descriptionText` after stripping malformed embedded base64 image payloads from the source CSV descriptions.
- 46 imported products still have blank `brand` because both the CSV export and the public Tiendanube page expose no brand value for them.

---

Status: FIXED

Review findings addressed:
- Added `resolveBrand()` / `inferBrandFromTokens()` so brand resolution now prefers CSV `Marca`, then `pageData.product.brand`, then recognized category/name tokens.
- Added direct token coverage for the requested inferable brands: Tommy Hilfiger, Invicta, OMEGA x Swatch, Ray Ban, Prada, Gucci, Saint Laurent, Louis Vuitton, Versace, Christian Dior, Balenciaga, Cartier, Fendi, Dolce&Gabbana, Celine Paris, and Off-White.
- Narrowed Ray Ban fallback with model-family tokens used by the blank-brand products in this catalog.
- Normalized variant promotional price handling so `0`, `null`, and `undefined` no longer suppress CSV `Precio promocional`; missing promo now serializes as `null`.
- Regenerated `data/tiendanube-catalog.json` and `data/tiendanube-import-summary.json` from the importer after the logic changes.

Commands run:
- `node --check scripts/tiendanube/import-catalog.mjs` -> PASS
- `node scripts/tiendanube/import-catalog.mjs` -> PASS (`Imported 178 visible products`, `Scrape errors: 0`)
- `node - <<'NODE' ... post-fix counts ... NODE` -> PASS (`products: 178`, `blankBrands: 0`, `zeroVariantPromo: 0`)

Post-fix counts:
- Visible products imported: 178
- Blank brands: 0
- Variants with `promotionalPrice === 0`: 0
- Variants with `promotionalPrice === null`: 165

Concerns, if any:
- 25 imported products still end up with empty `descriptionText` after stripping malformed embedded base64 image payloads from the source CSV descriptions; this fix did not change description sourcing.
