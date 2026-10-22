import { execFileSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { STORE_TERMS_ISSUE_TITLE, planStoreTermsAlert } from "./store-terms-alert.mjs";

// Opens, comments on or closes the GitHub issue that tells the owner the
// payment-terms sync failed. Runs in GitHub Actions with `gh` and GH_TOKEN.
// `--dry-run` prints the gh commands instead and reads the open issues from
// STORE_TERMS_OPEN_ISSUES (JSON, as `gh issue list --json` prints them).

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const termsPath = path.resolve(scriptDirectory, "../../data/store-terms.json");
const dryRun = process.argv.includes("--dry-run");

function gh(args) {
  if (dryRun) {
    console.log(`[dry-run] gh ${args.map((arg) => JSON.stringify(arg)).join(" ")}`);
    return "";
  }
  return execFileSync("gh", args, { encoding: "utf8", stdio: ["ignore", "pipe", "inherit"] });
}

function listOpenIssues() {
  if (dryRun) return JSON.parse(process.env.STORE_TERMS_OPEN_ISSUES || "[]");
  return JSON.parse(
    gh([
      "issue",
      "list",
      "--state",
      "open",
      "--search",
      `in:title "${STORE_TERMS_ISSUE_TITLE}"`,
      "--json",
      "number,title,createdAt,comments",
      "--limit",
      "20",
    ]),
  );
}

async function main() {
  const status = process.env.TERMS_STATUS;
  if (status !== "ok" && status !== "failed") {
    throw new Error(`TERMS_STATUS inválido: "${status ?? ""}"`);
  }

  const terms = await readFile(termsPath, "utf8")
    .then(JSON.parse)
    .catch(() => null);
  const { GITHUB_SERVER_URL, GITHUB_REPOSITORY, GITHUB_RUN_ID } = process.env;
  const plan = planStoreTermsAlert({
    status,
    reason: process.env.TERMS_REASON,
    terms,
    runUrl: `${GITHUB_SERVER_URL}/${GITHUB_REPOSITORY}/actions/runs/${GITHUB_RUN_ID}`,
    owner: process.env.GITHUB_REPOSITORY_OWNER,
    openIssues: listOpenIssues(),
  });

  if (plan.action === "create") {
    gh(["issue", "create", "--title", plan.title, "--body", plan.body]);
  } else if (plan.action === "comment") {
    gh(["issue", "comment", String(plan.issue), "--body", plan.body]);
  } else if (plan.action === "close") {
    gh(["issue", "close", String(plan.issue), "--comment", plan.comment]);
  }

  console.log(JSON.stringify({ dryRun, ...plan, body: undefined, comment: undefined }));
}

main().catch((error) => {
  console.log(
    `::warning title=Aviso de condiciones de pago::No se pudo actualizar el issue de alerta: ${error.message}`,
  );
});
