import { readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import {
  mergeCatalogWithTiendanube,
  parseNextPage,
} from "./sync-utils.mjs";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(scriptDirectory, "../..");
const catalogPath = path.join(projectRoot, "data/tiendanube-catalog.json");
const temporaryPath = `${catalogPath}.tmp`;

function requiredEnvironment(name) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Falta la variable ${name}.`);
  return value;
}

async function fetchProducts({ storeId, accessToken }) {
  let nextUrl = `https://api.tiendanube.com/v1/${encodeURIComponent(storeId)}/products?page=1&per_page=200`;
  const products = [];
  let pageCount = 0;

  while (nextUrl) {
    pageCount += 1;
    if (pageCount > 100) {
      throw new Error("Tiendanube devolvió más de 100 páginas; se canceló por seguridad.");
    }

    const response = await fetch(nextUrl, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "User-Agent":
          process.env.TIENDANUBE_USER_AGENT?.trim() ||
          "Smile Stock Sync (smiletiendaimp.com.ar)",
      },
    });

    if (!response.ok) {
      throw new Error(
        `Tiendanube respondió HTTP ${response.status} en la página ${pageCount}.`,
      );
    }

    const page = await response.json();
    if (!Array.isArray(page)) {
      throw new Error(`Tiendanube devolvió una página ${pageCount} inválida.`);
    }

    products.push(...page);
    nextUrl = parseNextPage(response.headers.get("link"));
  }

  return products;
}

async function main() {
  const accessToken = requiredEnvironment("TIENDANUBE_ACCESS_TOKEN");
  const storeId = requiredEnvironment("TIENDANUBE_STORE_ID");
  const originalText = await readFile(catalogPath, "utf8");
  const catalog = JSON.parse(originalText);
  const apiProducts = await fetchProducts({ storeId, accessToken });
  const result = mergeCatalogWithTiendanube(catalog, apiProducts);
  const nextText = `${JSON.stringify(result.catalog, null, 2)}\n`;
  const changed = nextText !== originalText;

  if (changed && !process.argv.includes("--dry-run")) {
    await writeFile(temporaryPath, nextText, "utf8");
    await rename(temporaryPath, catalogPath);
  }

  console.log(
    JSON.stringify({
      changed,
      dryRun: process.argv.includes("--dry-run"),
      ...result.summary,
    }),
  );
}

main().catch((error) => {
  console.error(`Error de sincronización: ${error.message}`);
  process.exitCode = 1;
});
