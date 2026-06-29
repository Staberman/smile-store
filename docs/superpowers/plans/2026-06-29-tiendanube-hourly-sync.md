# Tiendanube Hourly Sync Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Synchronize Tiendanube stock and prices into the static Smile catalog every hour and deploy verified changes automatically.

**Architecture:** A pure merge module applies validated API product data to the existing catalog. A Node CLI handles pagination, credentials, atomic writes, and summaries. GitHub Actions schedules the CLI, tests the result, commits changes, and deploys production through Vercel.

**Tech Stack:** Node.js 20, native `fetch`, Node test runner, GitHub Actions, Vercel CLI.

## Global Constraints

- Tiendanube is the source of truth only for price, promotional price, stock, and availability.
- Existing product content, images, URLs, SEO, and checkout IDs remain unchanged.
- API failures or suspiciously incomplete responses never overwrite the catalog.
- Secrets never appear in source, logs, artifacts, or commits.

---

### Task 1: Pure Catalog Synchronization

**Files:**
- Create: `scripts/tiendanube/sync-utils.mjs`
- Create: `scripts/tiendanube/sync-utils.test.mjs`

**Interfaces:**
- Consumes: Existing catalog product objects and Tiendanube API product objects.
- Produces: `mergeCatalogWithTiendanube(catalog, apiProducts)` returning `{ catalog, summary }`.

- [ ] Write failing tests for prices, promotions, stock, missing variants, missing products, and incomplete responses.
- [ ] Run `node --test scripts/tiendanube/sync-utils.test.mjs` and confirm the expected missing-module failure.
- [ ] Implement normalized number parsing, availability calculation, validation, and immutable merging.
- [ ] Run the focused test and confirm all cases pass.

### Task 2: Paginated Sync CLI

**Files:**
- Create: `scripts/tiendanube/sync-stock-prices.mjs`
- Modify: `package.json`
- Test: `scripts/tiendanube/sync-utils.test.mjs`

**Interfaces:**
- Consumes: `TIENDANUBE_ACCESS_TOKEN`, `TIENDANUBE_STORE_ID`, optional `TIENDANUBE_USER_AGENT`.
- Produces: Atomically updated `data/tiendanube-catalog.json` and a concise non-secret stdout summary.

- [ ] Add failing tests for API page normalization and pagination-link parsing.
- [ ] Implement authenticated GET pagination with `per_page=200`.
- [ ] Validate the complete payload before calling the merge module.
- [ ] Write to a temporary file and rename it only after successful serialization.
- [ ] Add `sync:catalog` to `package.json`.
- [ ] Run `npm run test:catalog`.

### Task 3: Hourly Automation And Deployment

**Files:**
- Create: `.github/workflows/sync-tiendanube.yml`

**Interfaces:**
- Consumes: GitHub secrets for Tiendanube and Vercel.
- Produces: Hourly catalog commits and production deployments only when data changes.

- [ ] Configure `schedule: "17 * * * *"` and `workflow_dispatch`.
- [ ] Install dependencies with `npm ci`.
- [ ] Run synchronization, catalog tests, and production build.
- [ ] Commit only `data/tiendanube-catalog.json` when changed, using `[skip ci]`.
- [ ] Deploy production with the linked Vercel project IDs and token.
- [ ] Add required Vercel repository secrets without printing their values.

### Task 4: End-To-End Verification

**Files:**
- Verify only.

**Interfaces:**
- Consumes: Manual GitHub Actions dispatch.
- Produces: Successful workflow run and deployed catalog.

- [ ] Run `npm run test:catalog` and `npm run build` locally.
- [ ] Push the implementation.
- [ ] Dispatch `sync-tiendanube.yml`.
- [ ] Inspect the workflow result and production response.
- [ ] Verify Git is clean and the remote branch is synchronized.
