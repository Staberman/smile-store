import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import test from "node:test";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

function readSource(relativePath) {
  return readFileSync(path.join(rootDir, relativePath), "utf8");
}

test("checkout bridge routes expose the required contracts", () => {
  const entrySource = readSource("./app/api/checkout/tiendanube/route.ts");
  const resolveSource = readSource("./app/api/checkout/tiendanube/resolve/route.ts");
  const proxySource = readSource("./app/api/tiendanube/proxy/[...stage]/route.ts");

  assert.match(entrySource, /status:\s*303/);
  assert.match(entrySource, /smiletienda\.mitiendanube\.com\/apps\/smile-comprar\/start/);
  assert.match(resolveSource, /Access-Control-Allow-Origin/);
  assert.match(resolveSource, /https:\/\/smiletienda\.mitiendanube\.com/);
  assert.match(proxySource, /x-linkedstore-hmac-sha256/i);
  assert.match(proxySource, /X-Embed/);
  assert.match(proxySource, /name="go_to_checkout"/);
  assert.match(proxySource, /action="\/comprar\/"/);
});
