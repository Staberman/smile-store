// Turns the payment-terms sync result into one GitHub issue action, so a
// failed read reaches the owner (a warning on a green run sends no email).

export const STORE_TERMS_ISSUE_TITLE =
  "Sincronización de cuotas y descuento con Tiendanube falló";

const COMMENT_INTERVAL_MS = 24 * 60 * 60 * 1000;

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
 * - failed read, no open issue -> create it;
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
    return {
      action: "create",
      title: STORE_TERMS_ISSUE_TITLE,
      body: [
        "La sincronización horaria no pudo leer el descuento por transferencia y las cuotas sin interés desde las páginas de producto de Tiendanube.",
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
