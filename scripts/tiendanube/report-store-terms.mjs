import { execFileSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import {
  PREVIOUS_RUNS_TO_CHECK,
  STORE_TERMS_ISSUE_TITLE,
  planStoreTermsAlert,
  previousTermsVerdict,
  termsAnnotation,
} from "./store-terms-alert.mjs";

// Records this run's payment-terms verdict as an annotation, then opens,
// comments on or closes the GitHub issue that tells the owner the sync failed.
// Runs in GitHub Actions with `gh` and GH_TOKEN (issues: write, actions: read,
// checks: read).
//
// `--dry-run` prints the gh commands that would write (create, comment, close)
// instead of running them. Reads still go to GitHub unless provided:
// STORE_TERMS_OPEN_ISSUES (JSON, as `gh issue list --json` prints them) and
// STORE_TERMS_PREVIOUS_VERDICT ("failed", "ok", "none" or "unknown").

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const termsPath = path.resolve(scriptDirectory, "../../data/store-terms.json");
const dryRun = process.argv.includes("--dry-run");
const { GITHUB_SERVER_URL, GITHUB_REPOSITORY, GITHUB_RUN_ID, GITHUB_REF_NAME } = process.env;

function gh(args) {
  return execFileSync("gh", args, { encoding: "utf8", stdio: ["ignore", "pipe", "inherit"] });
}

function ghWrite(args) {
  if (dryRun) {
    console.log(`[dry-run] gh ${args.map((arg) => JSON.stringify(arg)).join(" ")}`);
    return;
  }
  gh(args);
}

// `{owner}/{repo}` is filled in by gh from GH_REPO (or the local checkout).
function ghApi(endpoint) {
  return JSON.parse(gh(["api", endpoint]));
}

function listOpenIssues() {
  if (dryRun && process.env.STORE_TERMS_OPEN_ISSUES !== undefined) {
    return JSON.parse(process.env.STORE_TERMS_OPEN_ISSUES);
  }
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

// This workflow's file name, from GITHUB_WORKFLOW_REF
// ("owner/repo/.github/workflows/sync-tiendanube.yml@refs/heads/main").
function workflowFile() {
  const workflowPath = (process.env.GITHUB_WORKFLOW_REF ?? "").split("@")[0];
  return path.posix.basename(workflowPath) || "sync-tiendanube.yml";
}

function runAnnotations(run) {
  const { jobs } = ghApi(`repos/{owner}/{repo}/actions/runs/${run.id}/jobs`);
  return jobs.flatMap((job) => {
    const checkRunId = String(job.check_run_url).split("/").pop();
    return ghApi(`repos/{owner}/{repo}/check-runs/${checkRunId}/annotations?per_page=100`);
  });
}

/**
 * Whether the latest earlier run of this workflow (same branch) that read the
 * terms failed: true or false, or null when GitHub couldn't be asked.
 *
 * Why annotations: every run already records its verdict on its own page and
 * GitHub keeps it with the run logs, so the debounce needs no extra state to
 * write, expire or keep consistent (an Actions cache would add an entry per
 * run and a restore/save pair of steps).
 */
async function previousRunFailed() {
  if (dryRun && process.env.STORE_TERMS_PREVIOUS_VERDICT !== undefined) {
    const verdict = process.env.STORE_TERMS_PREVIOUS_VERDICT;
    return verdict === "unknown" ? null : verdict === "failed";
  }

  try {
    const query = new URLSearchParams({
      status: "completed",
      exclude_pull_requests: "true",
      per_page: String(PREVIOUS_RUNS_TO_CHECK),
      ...(GITHUB_REF_NAME ? { branch: GITHUB_REF_NAME } : {}),
    });
    const { workflow_runs: runs } = ghApi(
      `repos/{owner}/{repo}/actions/workflows/${workflowFile()}/runs?${query}`,
    );
    const earlier = runs.filter((run) => String(run.id) !== GITHUB_RUN_ID);
    return (await previousTermsVerdict(earlier, runAnnotations)) === "failed";
  } catch (error) {
    console.log(
      `::warning title=Aviso de condiciones de pago::No se pudo consultar la ejecución anterior (${error.message}); se avisa sin esperar una segunda falla.`,
    );
    return null;
  }
}

async function main() {
  const status = process.env.TERMS_STATUS;
  if (status !== "ok" && status !== "failed") {
    throw new Error(`TERMS_STATUS inválido: "${status ?? ""}"`);
  }

  const terms = await readFile(termsPath, "utf8")
    .then(JSON.parse)
    .catch(() => null);
  const reason = process.env.TERMS_REASON;

  // First, so the verdict is on record even if the issue update fails.
  console.log(termsAnnotation({ status, reason, terms }));

  const previous = status === "failed" ? await previousRunFailed() : undefined;
  const plan = planStoreTermsAlert({
    status,
    reason,
    terms,
    runUrl: `${GITHUB_SERVER_URL}/${GITHUB_REPOSITORY}/actions/runs/${GITHUB_RUN_ID}`,
    owner: process.env.GITHUB_REPOSITORY_OWNER,
    openIssues: listOpenIssues(),
    previousRunFailed: previous,
  });

  if (plan.action === "create") {
    ghWrite(["issue", "create", "--title", plan.title, "--body", plan.body]);
  } else if (plan.action === "comment") {
    ghWrite(["issue", "comment", String(plan.issue), "--body", plan.body]);
  } else if (plan.action === "close") {
    ghWrite(["issue", "close", String(plan.issue), "--comment", plan.comment]);
  }

  console.log(
    JSON.stringify({
      dryRun,
      previousRunFailed: previous,
      ...plan,
      body: undefined,
      comment: undefined,
    }),
  );
}

main().catch((error) => {
  console.log(
    `::warning title=Aviso de condiciones de pago::No se pudo actualizar el issue de alerta: ${error.message}`,
  );
});
