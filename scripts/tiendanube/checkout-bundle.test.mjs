import assert from "node:assert/strict";
import path from "node:path";
import { pathToFileURL } from "node:url";
import test from "node:test";

test("public bundle exports App", async () => {
  const bundlePath = path.resolve(
    "public/tiendanube-checkout/main.min.js",
  );
  const bundle = await import(pathToFileURL(bundlePath).href);

  assert.equal(typeof bundle.App, "function");
});
