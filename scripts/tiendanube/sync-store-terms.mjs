import { appendFile, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import {
  agreeOnStoreTerms,
  parseStorefrontPaymentTerms,
  pickStorefrontProductUrls,
  storeTermsFileText,
} from "./store-terms.mjs";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(scriptDirectory, "../..");
const catalogPath = path.join(projectRoot, "data/tiendanube-catalog.json");
const termsPath = path.join(projectRoot, "data/store-terms.json");
const temporaryPath = `${termsPath}.tmp`;
const dryRun = process.argv.includes("--dry-run");

// Step outputs for the workflow's alert step, which opens or closes the
// GitHub issue. No-op outside GitHub Actions.
async function setStepOutputs(status, reason = "") {
  if (!process.env.GITHUB_OUTPUT) return;
  await appendFile(
    process.env.GITHUB_OUTPUT,
    `status=${status}\nreason=${reason.replace(/\s+/g, " ")}\n`,
  );
}

// Shows up as an annotation on the GitHub Actions run. This step never fails
// the job: the stock and price sync must keep publishing.
async function fail(reason) {
  console.log(
    `::warning title=Condiciones de pago::No se actualizaron las condiciones de pago: ${reason}. Se mantiene data/store-terms.json sin cambios.`,
  );
  await setStepOutputs("failed", reason);
}

async function fetchProductPage(url) {
  const response = await fetch(url, {
    headers: {
      "User-Agent":
        process.env.TIENDANUBE_USER_AGENT?.trim() ||
        "Smile Stock Sync (smiletiendaimp.com.ar)",
    },
    signal: AbortSignal.timeout(20_000),
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.text();
}

async function main() {
  const catalog = JSON.parse(await readFile(catalogPath, "utf8"));
  const urls = pickStorefrontProductUrls(catalog, 3);
  const readings = await Promise.all(
    urls.map(async (url) => {
      try {
        return { url, terms: parseStorefrontPaymentTerms(await fetchProductPage(url)) };
      } catch (error) {
        return { url, error: `no se pudo leer la página (${error.message})` };
      }
    }),
  );

  const result = agreeOnStoreTerms(readings, 3);
  if (!result.ok) {
    await fail(result.reason);
    return;
  }

  const originalText = await readFile(termsPath, "utf8").catch(() => null);
  const nextText = storeTermsFileText(result.terms);
  const changed = nextText !== originalText;

  if (changed && !dryRun) {
    await writeFile(temporaryPath, nextText, "utf8");
    await rename(temporaryPath, termsPath);
  }

  console.log(JSON.stringify({ changed, dryRun, ...result.terms, pages: urls }));
  await setStepOutputs("ok");
}

main().catch((error) =>
  fail(`error inesperado (${error.message})`).catch((outputError) => {
    console.error(`No se pudo escribir la salida del paso: ${outputError.message}`);
  }),
);
