# Tiendanube Hourly Stock And Price Sync

## Goal

Keep Smile's storefront prices and availability synchronized with Tiendanube every hour without introducing a database or changing product copy, images, SEO, slugs, or checkout behavior.

## Architecture

A scheduled GitHub Actions workflow calls a Node.js synchronization script. The script reads all Tiendanube products through the authenticated products API, validates that the response is complete enough to trust, and merges only commercial variant fields into `data/tiendanube-catalog.json`.

The workflow commits the catalog only when its serialized content changes. It runs catalog tests and a production build before pushing the commit and deploying the same revision to Vercel.

## Data Contract

Products are matched by `tiendanubeProductId`. Variants are matched by Tiendanube variant `id`.

The synchronization may update:

- Variant `price`
- Variant `promotionalPrice`
- Variant `stock`
- Variant `available`
- Product aggregate `price`
- Product aggregate `promotionalPrice`
- Product aggregate `stock`

The synchronization must preserve:

- Names and slugs
- Categories and tags
- Images
- Descriptions
- SEO metadata
- Checkout identifiers

Products returned by the catalog but absent from a complete Tiendanube response are marked unavailable with zero stock. A response containing fewer than half of the known Tiendanube product IDs is rejected and must not modify the catalog.

## Failure Handling

The script exits non-zero for missing credentials, HTTP errors, malformed payloads, pagination failures, duplicate IDs, or suspiciously incomplete API responses. It writes the catalog atomically only after all validation and merging succeed.

No change is committed or deployed after a failed synchronization, test, or build.

## Security

`TIENDANUBE_ACCESS_TOKEN`, `TIENDANUBE_STORE_ID`, and `VERCEL_TOKEN` remain GitHub Actions secrets. The access token is used only in server-side automation and only with GET requests.

The application currently returned `read_products,write_products`; the implementation deliberately exposes no write operation to Tiendanube.

## Schedule

The workflow runs hourly with `17 * * * *` and supports manual dispatch. The non-zero minute avoids the busiest top-of-hour window.

## Verification

Unit tests cover variant merging, promotional prices, zero-stock handling, absent products, and incomplete-response rejection. The workflow then runs `npm run test:catalog` and `npm run build`.
