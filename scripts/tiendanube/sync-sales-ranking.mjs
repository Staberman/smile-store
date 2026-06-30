import { writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { buildSalesRanking } from "./sales-ranking-utils.mjs";
import { parseNextPage } from "./sync-utils.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const output = path.join(root, "data/tiendanube-sales-ranking.json");

function required(name) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Falta la variable ${name}.`);
  return value;
}

async function main() {
  const accessToken = required("TIENDANUBE_ACCESS_TOKEN");
  const storeId = required("TIENDANUBE_STORE_ID");
  const cutoff = new Date();
  cutoff.setUTCDate(cutoff.getUTCDate() - 90);
  let nextUrl = `https://api.tiendanube.com/v1/${encodeURIComponent(storeId)}/orders?status=any&created_at_min=${encodeURIComponent(cutoff.toISOString())}&per_page=200`;
  const orders = [];

  while (nextUrl) {
    const response = await fetch(nextUrl, {
      headers: {
        Authentication: `bearer ${accessToken}`,
        "User-Agent": "Smile Stock Sync (smiletiendaimportados@gmail.com)",
      },
    });
    if (!response.ok) throw new Error(`Tiendanube respondió HTTP ${response.status}.`);
    const page = await response.json();
    if (!Array.isArray(page)) throw new Error("Tiendanube devolvió pedidos inválidos.");
    orders.push(...page);
    nextUrl = parseNextPage(response.headers.get("link"));
  }

  const payload = {
    updatedAt: new Date().toISOString(),
    windowDays: 90,
    ranking: buildSalesRanking(orders),
  };
  await writeFile(output, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
  console.log(JSON.stringify({ orders: orders.length, products: payload.ranking.length }));
}

main().catch((error) => {
  console.error(`Error de ranking: ${error.message}`);
  process.exitCode = 1;
});

