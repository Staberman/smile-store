import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { readFileSync } from "node:fs";
import net from "node:net";
import { spawn } from "node:child_process";
import test from "node:test";
import { createPurchaseIntent, verifyPurchaseIntent } from "../../lib/checkout/purchase-intent.mjs";

const ROOT = new URL("../../", import.meta.url);
const CATALOG_PATH = new URL("./data/tiendanube-catalog.json", ROOT);
const SECRET = "test-secret-with-at-least-32-characters";
const APP_SECRET = "test-app-secret-with-at-least-32-characters";
const STORE_ID = "3759046";
const ALLOWED_ORIGIN = "https://smiletienda.mitiendanube.com";
const INTENT_TTL_SECONDS = 600;

function loadCatalogFixtures() {
  const catalog = JSON.parse(readFileSync(CATALOG_PATH, "utf8"));
  const mixedProduct = catalog.find(
    (product) =>
      product.tiendanubeProductId !== null &&
      product.variants.some(
        (variant) =>
          variant.id !== null && variant.available && variant.stock > 0,
      ) &&
      product.variants.some(
        (variant) =>
          variant.id !== null && (!variant.available || variant.stock <= 0),
      ),
  );

  if (!mixedProduct) {
    throw new Error("Unable to find catalog fixtures for checkout tests.");
  }

  const inStockVariant = mixedProduct.variants.find(
    (variant) => variant.id !== null && variant.available && variant.stock > 0,
  );
  const outOfStockVariant = mixedProduct.variants.find(
    (variant) => variant.id !== null && (!variant.available || variant.stock <= 0),
  );

  if (!inStockVariant || !outOfStockVariant) {
    throw new Error("Unable to find catalog variants for checkout tests.");
  }

  return {
    inStock: {
      slug: mixedProduct.slug,
      productId: mixedProduct.tiendanubeProductId,
      variantId: String(inStockVariant.id),
      returnPath: `/tienda/productos/${mixedProduct.slug}`,
    },
    outOfStock: {
      slug: mixedProduct.slug,
      productId: mixedProduct.tiendanubeProductId,
      variantId: String(outOfStockVariant.id),
    },
  };
}

function buildIntentFixture({ productId, variantId, returnPath }) {
  return {
    productId,
    variantId,
    returnPath,
    exp: Math.floor(Date.now() / 1000) + INTENT_TTL_SECONDS,
  };
}

function createFreshIntent(productId, variantId, returnPath) {
  return createPurchaseIntent(
    buildIntentFixture({ productId, variantId, returnPath }),
    SECRET,
  );
}

function makeSignature(secret, storeId, customerId, requestId) {
  return createHmac("sha256", secret)
    .update(`${storeId}${customerId}${requestId}`)
    .digest("hex");
}

async function getFreePort() {
  return await new Promise((resolve, reject) => {
    const server = net.createServer();
    server.unref();
    server.on("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      if (!address || typeof address === "string") {
        reject(new Error("Unable to allocate a free port."));
        return;
      }
      const { port } = address;
      server.close((error) => {
        if (error) reject(error);
        else resolve(port);
      });
    });
  });
}

async function waitForServer(baseUrl, child) {
  const deadline = Date.now() + 60_000;
  let lastError = null;

  while (Date.now() < deadline) {
    if (child.exitCode !== null) {
      throw new Error(`Next dev exited early with code ${child.exitCode}.`);
    }

    try {
      const response = await fetch(baseUrl);
      if (response.ok || response.status === 404) {
        return;
      }
      lastError = new Error(`Unexpected readiness status ${response.status}.`);
    } catch (error) {
      lastError = error;
    }

    await new Promise((resolve) => setTimeout(resolve, 250));
  }

  throw lastError ?? new Error("Timed out waiting for Next dev server.");
}

async function withNextDev(extraEnv = {}, run) {
  const port = await getFreePort();
  const env = {
    ...process.env,
    NEXT_TELEMETRY_DISABLED: "1",
    TIENDANUBE_CHECKOUT_MODE: "proxy",
  };

  if (Object.hasOwn(extraEnv, "PURCHASE_INTENT_SECRET")) {
    if (extraEnv.PURCHASE_INTENT_SECRET === undefined) {
      delete env.PURCHASE_INTENT_SECRET;
    } else {
      env.PURCHASE_INTENT_SECRET = extraEnv.PURCHASE_INTENT_SECRET;
    }
  } else {
    delete env.PURCHASE_INTENT_SECRET;
  }

  if (Object.hasOwn(extraEnv, "TIENDANUBE_APP_SECRET")) {
    if (extraEnv.TIENDANUBE_APP_SECRET === undefined) {
      delete env.TIENDANUBE_APP_SECRET;
    } else {
      env.TIENDANUBE_APP_SECRET = extraEnv.TIENDANUBE_APP_SECRET;
    }
  } else {
    delete env.TIENDANUBE_APP_SECRET;
  }

  const child = spawn(
    "npm",
    ["run", "dev", "--", "--hostname", "127.0.0.1", "--port", String(port)],
    {
      cwd: new URL("../../", import.meta.url),
      env,
      stdio: ["ignore", "pipe", "pipe"],
    },
  );
  const childExit = new Promise((resolve, reject) => {
    child.once("error", reject);
    child.once("exit", (code, signal) => {
      resolve({ code, signal });
    });
  });

  let stderr = "";
  child.stderr.on("data", (chunk) => {
    stderr += chunk.toString();
  });

  try {
    const baseUrl = `http://127.0.0.1:${port}`;
    await waitForServer(baseUrl, child);
    return await run(baseUrl);
  } finally {
    if (child.exitCode === null && child.signalCode === null) {
      child.kill("SIGTERM");
    }
    await childExit;
    if (child.exitCode !== 0 && child.exitCode !== null && stderr) {
      process.stderr.write(stderr);
    }
  }
}

function proxyHeaders({
  customerId,
  requestId,
  secret = APP_SECRET,
  storeId = STORE_ID,
} = {}) {
  return {
    "x-store-id": storeId,
    ...(customerId === undefined ? {} : { "x-customer-id": customerId }),
    ...(requestId === undefined ? {} : { "x-request-id": requestId }),
    "x-linkedstore-hmac-sha256": makeSignature(
      secret,
      storeId,
      customerId ?? "",
      requestId ?? "",
    ),
  };
}

test("POST /api/checkout/tiendanube redirects with a signed intent", async () => {
  const fixtures = loadCatalogFixtures();

  await withNextDev(
    {
      PURCHASE_INTENT_SECRET: SECRET,
      TIENDANUBE_APP_SECRET: APP_SECRET,
    },
    async (baseUrl) => {
      const response = await fetch(`${baseUrl}/api/checkout/tiendanube`, {
        method: "POST",
        headers: {
          "content-type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          slug: fixtures.inStock.slug,
          variantId: fixtures.inStock.variantId,
        }),
        redirect: "manual",
      });

      assert.equal(response.status, 303);
      const location = response.headers.get("location");
      assert.ok(location);
      assert.match(
        location,
        /^https:\/\/smiletienda\.mitiendanube\.com\/apps\/smile-comprar\/start\?intent=/,
      );

      const intent = new URL(location).searchParams.get("intent");
      assert.ok(intent);
      const verified = verifyPurchaseIntent(intent, SECRET);
      assert.equal(verified.productId, fixtures.inStock.productId);
      assert.equal(verified.variantId, Number(fixtures.inStock.variantId));
      assert.equal(verified.returnPath, fixtures.inStock.returnPath);
      assert.ok(verified.exp > Math.floor(Date.now() / 1000));
    },
  );
});

test("POST /api/checkout/tiendanube rejects incompatible form data with 415", async () => {
  await withNextDev(
    {
      PURCHASE_INTENT_SECRET: SECRET,
      TIENDANUBE_APP_SECRET: APP_SECRET,
    },
    async (baseUrl) => {
      const response = await fetch(`${baseUrl}/api/checkout/tiendanube`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({ slug: "anything", variantId: "anything" }),
      });

      assert.equal(response.status, 415);
    },
  );
});

test("POST /api/checkout/tiendanube rejects out-of-stock variants", async () => {
  const fixtures = loadCatalogFixtures();

  await withNextDev(
    {
      PURCHASE_INTENT_SECRET: SECRET,
      TIENDANUBE_APP_SECRET: APP_SECRET,
    },
    async (baseUrl) => {
      const response = await fetch(`${baseUrl}/api/checkout/tiendanube`, {
        method: "POST",
        headers: {
          "content-type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          slug: fixtures.outOfStock.slug,
          variantId: fixtures.outOfStock.variantId,
        }),
      });

      assert.equal(response.status, 409);
    },
  );
});

test("GET /api/checkout/tiendanube/resolve enforces origin, secret, and intent validity", async () => {
  const fixtures = loadCatalogFixtures();
  const intent = createFreshIntent(
    fixtures.inStock.productId,
    Number(fixtures.inStock.variantId),
    fixtures.inStock.returnPath,
  );

  await withNextDev(
    {
      PURCHASE_INTENT_SECRET: SECRET,
      TIENDANUBE_APP_SECRET: APP_SECRET,
    },
    async (baseUrl) => {
      const forbiddenOriginResponse = await fetch(
        `${baseUrl}/api/checkout/tiendanube/resolve?intent=${encodeURIComponent(intent)}`,
        {
          headers: { origin: "https://evil.test" },
        },
      );
      assert.equal(forbiddenOriginResponse.status, 403);
      assert.equal(
        forbiddenOriginResponse.headers.get("access-control-allow-origin"),
        null,
      );
      assert.equal(forbiddenOriginResponse.headers.get("cache-control"), "no-store");

      const missingIntentResponse = await fetch(
        `${baseUrl}/api/checkout/tiendanube/resolve`,
        {
          headers: { origin: ALLOWED_ORIGIN },
        },
      );
      assert.equal(missingIntentResponse.status, 400);

      const invalidIntentResponse = await fetch(
        `${baseUrl}/api/checkout/tiendanube/resolve?intent=broken`,
        {
          headers: { origin: ALLOWED_ORIGIN },
        },
      );
      assert.equal(invalidIntentResponse.status, 400);

      const allowedResponse = await fetch(
        `${baseUrl}/api/checkout/tiendanube/resolve?intent=${encodeURIComponent(intent)}`,
        {
          headers: { origin: ALLOWED_ORIGIN },
        },
      );

      assert.equal(allowedResponse.status, 200);
      assert.equal(
        allowedResponse.headers.get("access-control-allow-origin"),
        ALLOWED_ORIGIN,
      );
      assert.match(allowedResponse.headers.get("vary") ?? "", /(^|, )Origin(,|$)/);
      assert.equal(allowedResponse.headers.get("cache-control"), "no-store");
      assert.deepEqual(await allowedResponse.json(), {
        productId: fixtures.inStock.productId,
        variantId: Number(fixtures.inStock.variantId),
        quantity: 1,
      });
    },
  );
});

test("GET /api/checkout/tiendanube/resolve returns 500 when the intent secret is missing", async () => {
  await withNextDev(
    { TIENDANUBE_APP_SECRET: APP_SECRET },
    async (baseUrl) => {
      const response = await fetch(
        `${baseUrl}/api/checkout/tiendanube/resolve?intent=abc`,
        {
          headers: { origin: ALLOWED_ORIGIN },
        },
      );

      assert.equal(response.status, 500);
    },
  );
});

test("POST /api/checkout/tiendanube returns 500 when the child omits PURCHASE_INTENT_SECRET", async () => {
  const fixtures = loadCatalogFixtures();

  await withNextDev(
    { TIENDANUBE_APP_SECRET: APP_SECRET },
    async (baseUrl) => {
      const response = await fetch(`${baseUrl}/api/checkout/tiendanube`, {
        method: "POST",
        headers: {
          "content-type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          slug: fixtures.inStock.slug,
          variantId: fixtures.inStock.variantId,
        }),
      });

      assert.equal(response.status, 500);
    },
  );
});

test("GET /api/tiendanube/proxy/start honors HMAC, optional customer id, and HTML headers", async () => {
  const fixtures = loadCatalogFixtures();
  const intent = createFreshIntent(
    fixtures.inStock.productId,
    Number(fixtures.inStock.variantId),
    fixtures.inStock.returnPath,
  );

  await withNextDev(
    {
      PURCHASE_INTENT_SECRET: SECRET,
      TIENDANUBE_APP_SECRET: APP_SECRET,
    },
    async (baseUrl) => {
      const response = await fetch(
        `${baseUrl}/api/tiendanube/proxy/start?intent=${encodeURIComponent(intent)}`,
        {
          headers: proxyHeaders({
            requestId: "req-1",
          }),
        },
      );

      assert.equal(response.status, 200);
      assert.equal(response.headers.get("content-type"), "text/html; charset=utf-8");
      assert.equal(response.headers.get("x-embed"), "true");
      assert.equal(response.headers.get("cache-control"), "no-store");
      const body = await response.text();
      assert.match(body, /Preparando tu compra\.\.\./);
      assert.doesNotMatch(body, /go_to_checkout/);
    },
  );
});

test("GET /api/tiendanube/proxy/start returns 403 when the child omits TIENDANUBE_APP_SECRET", async () => {
  const fixtures = loadCatalogFixtures();
  const intent = createFreshIntent(
    fixtures.inStock.productId,
    Number(fixtures.inStock.variantId),
    fixtures.inStock.returnPath,
  );

  await withNextDev(
    { PURCHASE_INTENT_SECRET: SECRET },
    async (baseUrl) => {
      const response = await fetch(
        `${baseUrl}/api/tiendanube/proxy/start?intent=${encodeURIComponent(intent)}`,
        {
          headers: proxyHeaders({
            requestId: "req-1",
          }),
        },
      );

      assert.equal(response.status, 403);
      assert.equal(response.headers.get("cache-control"), "no-store");
    },
  );
});

test("GET /api/tiendanube/proxy/start rejects an invalid HMAC", async () => {
  const fixtures = loadCatalogFixtures();
  const intent = createFreshIntent(
    fixtures.inStock.productId,
    Number(fixtures.inStock.variantId),
    fixtures.inStock.returnPath,
  );

  await withNextDev(
    {
      PURCHASE_INTENT_SECRET: SECRET,
      TIENDANUBE_APP_SECRET: APP_SECRET,
    },
    async (baseUrl) => {
      const response = await fetch(
        `${baseUrl}/api/tiendanube/proxy/start?intent=${encodeURIComponent(intent)}`,
        {
          headers: proxyHeaders({
            requestId: "req-1",
            secret: "wrong-app-secret-with-at-least-32-characters",
          }),
        },
      );

      assert.equal(response.status, 403);
      assert.equal(response.headers.get("access-control-allow-origin"), null);
      assert.equal(response.headers.get("cache-control"), "no-store");
    },
  );
});

test("GET /api/tiendanube/proxy/start rejects an incorrect store id", async () => {
  const fixtures = loadCatalogFixtures();
  const intent = createFreshIntent(
    fixtures.inStock.productId,
    Number(fixtures.inStock.variantId),
    fixtures.inStock.returnPath,
  );

  await withNextDev(
    {
      PURCHASE_INTENT_SECRET: SECRET,
      TIENDANUBE_APP_SECRET: APP_SECRET,
    },
    async (baseUrl) => {
      const response = await fetch(
        `${baseUrl}/api/tiendanube/proxy/start?intent=${encodeURIComponent(intent)}`,
        {
          headers: proxyHeaders({
            requestId: "req-1",
            storeId: "0000000",
          }),
        },
      );

      assert.equal(response.status, 403);
      assert.equal(response.headers.get("access-control-allow-origin"), null);
      assert.equal(response.headers.get("cache-control"), "no-store");
    },
  );
});

test("GET /api/tiendanube/proxy/checkout submits the checkout form", async () => {
  const fixtures = loadCatalogFixtures();
  const intent = createFreshIntent(
    fixtures.inStock.productId,
    Number(fixtures.inStock.variantId),
    fixtures.inStock.returnPath,
  );

  await withNextDev(
    {
      PURCHASE_INTENT_SECRET: SECRET,
      TIENDANUBE_APP_SECRET: APP_SECRET,
    },
    async (baseUrl) => {
      const response = await fetch(
        `${baseUrl}/api/tiendanube/proxy/checkout?intent=${encodeURIComponent(intent)}`,
        {
          headers: proxyHeaders({
            requestId: "req-2",
          }),
        },
      );

      assert.equal(response.status, 200);
      assert.equal(response.headers.get("content-type"), "text/html; charset=utf-8");
      assert.equal(response.headers.get("x-embed"), "true");
      assert.equal(response.headers.get("cache-control"), "no-store");
      const body = await response.text();
      assert.match(body, /<form id="smile-checkout" method="post" action="\/comprar\/">/);
      assert.match(body, /name="go_to_checkout" value="1"/);
      assert.match(body, /document\.getElementById\("smile-checkout"\)\.submit\(\);/);
    },
  );
});

test("GET /api/tiendanube/proxy/error escapes the return path", async () => {
  const intent = createFreshIntent(
    299935919,
    1338048150,
    '/tienda/productos/fake" autofocus onfocus="alert(1)',
  );

  await withNextDev(
    {
      PURCHASE_INTENT_SECRET: SECRET,
      TIENDANUBE_APP_SECRET: APP_SECRET,
    },
    async (baseUrl) => {
      const response = await fetch(
        `${baseUrl}/api/tiendanube/proxy/error?intent=${encodeURIComponent(intent)}`,
        {
          headers: proxyHeaders({
            requestId: "req-3",
          }),
        },
      );

      assert.equal(response.status, 200);
      assert.equal(response.headers.get("cache-control"), "no-store");
      const body = await response.text();
      assert.match(body, /No pudimos preparar tu compra/);
      assert.match(body, /&quot; autofocus onfocus=&quot;alert\(1\)/);
      assert.doesNotMatch(body, /onfocus="alert\(1\)/);
    },
  );
});

test("GET /api/tiendanube/proxy/start rejects a missing X-Request-Id header", async () => {
  const fixtures = loadCatalogFixtures();
  const intent = createFreshIntent(
    fixtures.inStock.productId,
    Number(fixtures.inStock.variantId),
    fixtures.inStock.returnPath,
  );

  await withNextDev(
    {
      PURCHASE_INTENT_SECRET: SECRET,
      TIENDANUBE_APP_SECRET: APP_SECRET,
    },
    async (baseUrl) => {
      const response = await fetch(
        `${baseUrl}/api/tiendanube/proxy/start?intent=${encodeURIComponent(intent)}`,
        {
          headers: proxyHeaders({
            requestId: undefined,
          }),
        },
      );

      assert.equal(response.status, 403);
      assert.equal(response.headers.get("cache-control"), "no-store");
    },
  );
});

test("GET /api/tiendanube/proxy/checkout rejects multi-segment stages", async () => {
  const fixtures = loadCatalogFixtures();
  const intent = createFreshIntent(
    fixtures.inStock.productId,
    Number(fixtures.inStock.variantId),
    fixtures.inStock.returnPath,
  );

  await withNextDev(
    {
      PURCHASE_INTENT_SECRET: SECRET,
      TIENDANUBE_APP_SECRET: APP_SECRET,
    },
    async (baseUrl) => {
      const response = await fetch(
        `${baseUrl}/api/tiendanube/proxy/checkout/extra?intent=${encodeURIComponent(intent)}`,
        {
          headers: proxyHeaders({
            requestId: "req-4",
          }),
        },
      );

      assert.equal(response.status, 404);
      assert.equal(response.headers.get("cache-control"), "no-store");
    },
  );
});

test("purchase intent signatures expire and reject tampering", () => {
  const payload = {
    productId: 299935919,
    variantId: 1338048150,
    returnPath: "/tienda/productos/hexagonal-classic-3548-dorado-verde-3lb4e",
    exp: 2_000,
  };

  const token = createPurchaseIntent(payload, SECRET);
  assert.deepEqual(verifyPurchaseIntent(token, SECRET, 1_999), payload);
  assert.throws(() => verifyPurchaseIntent(token, SECRET, 2_001), /expired/i);
  assert.throws(() => verifyPurchaseIntent(`${token}x`, SECRET, 1_999));
});
