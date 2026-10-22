// Turns the payment-terms sync result into one GitHub issue action, so a
// failed read reaches the owner (a warning on a green run sends no email).

export const STORE_TERMS_ISSUE_TITLE =
  "Sincronización de cuotas y descuento con Tiendanube falló";

const COMMENT_INTERVAL_MS = 24 * 60 * 60 * 1000;

// Every run that reads the terms records its verdict as an annotation with this
// title: a warning when the read failed, a notice when it worked. The next run
// reads it back through the GitHub API to know whether the previous run failed.
export const STORE_TERMS_ANNOTATION_TITLE = "Condiciones de pago";

// Title for problems of the alert step itself (lookup or issue update failed).
// It must differ from STORE_TERMS_ANNOTATION_TITLE: termsVerdict would read
// such a warning as a failed sync and open the issue after one real failure.
export const STORE_TERMS_ALERT_PROBLEM_TITLE = "Aviso de condiciones de pago";

// Runs that skip the terms step (sync paused, catalog sync failed, cancelled)
// leave no verdict, so the lookup goes back this many completed runs at most.
export const PREVIOUS_RUNS_TO_CHECK = 5;

// Workflow-command escaping for annotation messages (as @actions/core does).
function escapeAnnotationMessage(text) {
  return String(text).replace(/%/g, "%25").replace(/\r/g, "%0D").replace(/\n/g, "%0A");
}

/** The workflow command that records this run's verdict on the run's page. */
export function termsAnnotation({ status, reason, terms }) {
  const [level, message] =
    status === "ok"
      ? [
          "notice",
          `Condiciones de pago leídas desde Tiendanube${terms ? `: ${describeKeptTerms(terms)}` : ""}.`,
        ]
      : [
          "warning",
          `No se actualizaron las condiciones de pago: ${reason || "sin detalle"}. Se mantiene data/store-terms.json sin cambios.`,
        ];
  return `::${level} title=${STORE_TERMS_ANNOTATION_TITLE}::${escapeAnnotationMessage(message)}`;
}

/**
 * The payment-terms verdict a run left among its check-run annotations
 * (`{ annotation_level, title }`, as the GitHub API lists them): "failed",
 * "ok", or null when that run didn't read the terms.
 */
export function termsVerdict(annotations) {
  const own = annotations.filter(
    (annotation) => annotation.title === STORE_TERMS_ANNOTATION_TITLE,
  );
  if (own.some((annotation) => annotation.annotation_level !== "notice")) return "failed";
  return own.length > 0 ? "ok" : null;
}

/**
 * The verdict of the most recent run (newest first) that read the terms, or
 * null when none of `runs` did. `annotationsOf(run)` is only called until a
 * verdict turns up; its errors propagate so the caller can tell "unknown".
 */
export async function previousTermsVerdict(runs, annotationsOf) {
  for (const run of runs) {
    const verdict = termsVerdict(await annotationsOf(run));
    if (verdict) return verdict;
  }
  return null;
}

function describeKeptTerms(terms) {
  return terms
    ? `${terms.transferDiscountPercent}% de descuento por transferencia y ${terms.interestFreeInstallments} cuotas sin interés`
    : "los valores anteriores";
}

// Latest moment anyone wrote on the issue (opening it counts).
function lastActivity(issue) {
  return Math.max(
    Date.parse(issue.createdAt),
    ...(issue.comments ?? []).map((comment) => Date.parse(comment.createdAt)),
  );
}

/**
 * Decides what to do with the alert issue:
 * - failed read, no open issue, previous run read fine -> "defer": a single
 *   failure may be transient, the issue opens if the next run fails too;
 * - failed read, no open issue, previous run failed too -> create it;
 * - failed read, no open issue, previous run unknown (`previousRunFailed`
 *   null/undefined: the lookup failed) -> create it, rather than stay silent;
 * - failed read, open issue -> comment, at most once every 24 h ("wait" otherwise);
 * - valid read, open issue -> close it with a short comment;
 * - valid read, no open issue -> nothing.
 */
export function planStoreTermsAlert({
  status,
  reason,
  terms,
  runUrl,
  owner,
  openIssues = [],
  previousRunFailed = null,
  now = new Date(),
}) {
  const issue = openIssues
    .filter((candidate) => candidate.title === STORE_TERMS_ISSUE_TITLE)
    .sort((a, b) => a.number - b.number)[0];

  if (status === "ok") {
    return issue
      ? {
          action: "close",
          issue: issue.number,
          comment: `Las condiciones de pago se volvieron a leer bien desde Tiendanube: ${describeKeptTerms(terms)}. Ejecución: ${runUrl}`,
        }
      : { action: "none" };
  }

  const details = [
    `**Qué falló:** ${reason || "sin detalle"}.`,
    `**Valores que se mantienen en el sitio:** ${describeKeptTerms(terms)} (\`data/store-terms.json\`).`,
    `**Ejecución:** ${runUrl}`,
  ].join("\n");

  if (!issue) {
    if (previousRunFailed === false) return { action: "defer" };

    const failedRead =
      "La sincronización horaria no pudo leer el descuento por transferencia y las cuotas sin interés desde las páginas de producto de Tiendanube";
    return {
      action: "create",
      title: STORE_TERMS_ISSUE_TITLE,
      body: [
        previousRunFailed
          ? `${failedRead} en dos ejecuciones seguidas.`
          : `${failedRead}. No se pudo consultar la ejecución anterior, así que se avisa sin esperar una segunda falla.`,
        "",
        details,
        "",
        "Revisá que lo que muestra el sitio coincida con lo configurado en el administrador de Tiendanube. Si cambió el diseño de la tienda, puede hacer falta actualizar `scripts/tiendanube/store-terms.mjs`. Este issue se cierra solo cuando una sincronización vuelva a leer valores válidos.",
        ...(owner ? ["", `cc @${owner}`] : []),
      ].join("\n"),
    };
  }

  const nextCommentAt = lastActivity(issue) + COMMENT_INTERVAL_MS;
  if (now.getTime() < nextCommentAt) {
    return { action: "wait", issue: issue.number, nextCommentAt: new Date(nextCommentAt).toISOString() };
  }

  return {
    action: "comment",
    issue: issue.number,
    body: `Sigue fallando la lectura de las condiciones de pago.\n\n${details}`,
  };
}
