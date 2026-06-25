# Tiendanube Catalog Migration Design

## Context

Smile Tienda currently has products managed in Tiendanube at `https://www.smiletiendaimp.com.ar`. The new Next.js project should become the public storefront, replacing the current manually assembled product catalog.

The Tiendanube checkout remains the payment engine. The new project must not implement or keep its own cart because the previous cart/export flow did not work reliably.

## Goals

- Migrate all visible Tiendanube products into this project.
- Preserve product categories, names, descriptions, prices, promotional prices, stock, brands, variants, and images.
- Replace the current hand-written catalog data.
- Remove local cart behavior from the customer experience.
- Send customers directly from this storefront into Tiendanube's purchase flow.

## Source Data

The migration uses two sources:

1. Tiendanube CSV export:
   - File: `/Users/lautaroantunez/Downloads/tiendanube-3759046-17823966794630592303951883044.csv`
   - Encoding: `cp1252`
   - Delimiter: semicolon
   - Parsed rows: 444
   - Visible products: 178 unique products where `Mostrar en tienda = SI`

2. Public Tiendanube product pages:
   - URL pattern: `https://www.smiletiendaimp.com.ar/productos/{slug}/`
   - Used to extract data missing from the CSV:
     - `LS.product.id`
     - `LS.variants`
     - Tiendanube variant IDs
     - variant stock
     - variant options such as `Talle` and `Color`
     - variant image URLs
     - complete gallery images when available

## Data Model

The generated catalog should store products as normalized records:

- `id`: stable local ID, based on Tiendanube product ID or slug
- `tiendanubeProductId`: numeric Tiendanube product ID
- `slug`: Tiendanube URL identifier
- `name`
- `brand`
- `categories`: ordered category path and extra tags parsed from Tiendanube
- `descriptionHtml`: sanitized product description
- `descriptionText`: plain-text fallback for previews and SEO
- `price`
- `promotionalPrice`
- `stock`
- `images`
- `seoTitle`
- `seoDescription`
- `variants`

Each variant should include:

- `id`: Tiendanube variant ID
- `sku`
- `options`: named values such as `Talle` and `Color`
- `price`
- `promotionalPrice`
- `stock`
- `available`
- `image`

## Categories

The storefront should follow Tiendanube's category hierarchy instead of the current manual grouping.

Primary groups include:

- `LENTES DE SOL`
- `RELOJES`
- `MAS VENDIDOS`
- `SMILE SALE`

Nested categories include examples such as:

- `LENTES DE SOL > RAY BAN > AVIADOR`
- `LENTES DE SOL > MARCAS PREMIUM > PRADA`
- `RELOJES > OMEGA X Swatch`
- `RELOJES > TOMMY HILFIGER DAMA`
- `RELOJES > TOMMY HILFIGER CABALLERO`

Comma-separated secondary labels in the Tiendanube category field, such as `LENTES EN PROMO` or `MES DE LA MADRE?`, should be treated as tags or secondary collections, not as the canonical category path.

## Checkout Flow

The project will not keep a local cart.

Product cards and product detail pages will show a `Comprar ahora` action. If a product has multiple available variants, the customer selects the variant first.

When clicked, the browser submits a hidden form directly to Tiendanube:

- `method="post"`
- `action="https://www.smiletiendaimp.com.ar/comprar/"`
- `add_to_cart`: Tiendanube product ID
- `variation[0]`, `variation[1]`, `variation[2]`: selected option values when applicable
- quantity defaults to `1`

This creates the Tiendanube cart/session in Tiendanube and avoids the local cart. The user does not visit the Tiendanube product page. If Tiendanube requires a cart confirmation screen before payment, the storefront still bypasses the product page and enters the purchase flow.

## Application Changes

- Replace `lib/products.ts` manual data with generated catalog data.
- Add an import script, for example `scripts/import-tiendanube-catalog.mjs` or `.ts`.
- Store generated data in a stable project file such as `data/tiendanube-catalog.json`.
- Update product listing pages to read from the generated catalog.
- Update product detail pages to render migrated data and variant selectors.
- Remove cart UI and behavior from the customer path:
  - `CartContext`
  - `CartButton`
  - `CartSidebar`
  - local storage cart state
  - WhatsApp checkout action
- Keep header/footer and existing brand styling where useful.

## Extraction Rules

- Only import products visible in Tiendanube.
- Preserve products with zero stock but render them as unavailable.
- Normalize prices as numbers in ARS.
- Keep original Tiendanube URLs for auditing.
- Convert protocol-relative image URLs such as `//dcdn-us...` to `https://...`.
- Remove embedded base64 images from descriptions to avoid huge HTML payloads.
- Sanitize description HTML before rendering.
- Keep a script summary report with counts:
  - CSV rows read
  - visible products imported
  - products with page scrape success
  - products with scrape errors
  - products with variants
  - products without images

## Error Handling

- If a product page cannot be scraped, keep the CSV product record and mark it with an import warning.
- If a product has no variant IDs, render it as unavailable for direct checkout until fixed.
- If a variant is out of stock, disable its `Comprar ahora` action.
- If no image is found, use a neutral product placeholder.

## Testing And Verification

- Run the import script and verify the generated count matches 178 visible products.
- Verify representative products:
  - simple watch product
  - Ray-Ban with size and color variants
  - premium sunglasses product
  - out-of-stock product
- Verify category navigation shows products under the expected Tiendanube categories.
- Verify no cart UI is visible.
- Verify `Comprar ahora` posts to Tiendanube and bypasses the Tiendanube product detail page.
- Run TypeScript/build checks after implementation.

## Open Risk

Tiendanube controls the behavior after `POST /comprar/`. The project can bypass product pages and submit directly into the purchase flow, but Tiendanube may still show its own cart or confirmation step before payment. This should be tested with at least one live product after implementation.
