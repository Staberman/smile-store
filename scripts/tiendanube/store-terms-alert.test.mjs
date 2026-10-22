import assert from "node:assert/strict";
import test from "node:test";
import {
  STORE_TERMS_ALERT_PROBLEM_TITLE,
  STORE_TERMS_ANNOTATION_TITLE,
  STORE_TERMS_ISSUE_TITLE,
  planStoreTermsAlert,
  previousTermsVerdict,
  termsAnnotation,
  termsVerdict,
} from "./store-terms-alert.mjs";

const runUrl = "https://github.com/Staberman/smile-store/actions/runs/123";
const terms = { transferDiscountPercent: 10, interestFreeInstallments: 6, freeShippingMinimumArs: 200000 };
const keptTerms =
  "10% de descuento por transferencia, 6 cuotas sin interés y envío gratis en compras superiores a $ 200.000";
const failure = {
  status: "failed",
  reason: "las páginas no coinciden",
  terms,
  runUrl,
  owner: "Staberman",
  previousRunFailed: true,
  now: new Date("2026-10-21T12:00:00Z"),
};
const openIssue = (createdAt, commentDates = []) => ({
  number: 7,
  title: STORE_TERMS_ISSUE_TITLE,
  createdAt,
  comments: commentDates.map((date) => ({ createdAt: date })),
});

test("a second consecutive failed read opens the issue with what failed, the kept values and the run", () => {
  const plan = planStoreTermsAlert(failure);

  assert.equal(plan.action, "create");
  assert.equal(plan.title, "Sincronización de cuotas y descuento con Tiendanube falló");
  assert.match(plan.body, /en dos ejecuciones seguidas\./);
  assert.match(plan.body, /\*\*Qué falló:\*\* las páginas no coinciden\./);
  assert.ok(
    plan.body.includes(`**Valores que se mantienen en el sitio:** ${keptTerms} (\`data/store-terms.json\`).`),
    plan.body,
  );
  assert.match(plan.body, /las cuotas sin interés y el monto mínimo para envío gratis/);
  assert.match(plan.body, /actions\/runs\/123/);
  assert.match(plan.body, /cc @Staberman/);
});

test("a first failed read after a good run opens nothing yet", () => {
  assert.deepEqual(planStoreTermsAlert({ ...failure, previousRunFailed: false }), {
    action: "defer",
  });
});

test("when the previous run can't be checked, the failure is reported right away", () => {
  for (const previousRunFailed of [null, undefined]) {
    const plan = planStoreTermsAlert({ ...failure, previousRunFailed });
    assert.equal(plan.action, "create");
    assert.match(plan.body, /No se pudo consultar la ejecución anterior/);
  }
});

test("issues with other titles are ignored", () => {
  const other = { ...openIssue("2026-10-21T11:00:00Z"), title: "Otra cosa" };
  assert.equal(planStoreTermsAlert({ ...failure, openIssues: [other] }).action, "create");
  assert.equal(
    planStoreTermsAlert({ ...failure, previousRunFailed: false, openIssues: [other] }).action,
    "defer",
  );
});

test("an open issue gets at most one comment every 24 h", () => {
  assert.deepEqual(
    planStoreTermsAlert({ ...failure, openIssues: [openIssue("2026-10-21T02:00:00Z")] }),
    { action: "wait", issue: 7, nextCommentAt: "2026-10-22T02:00:00.000Z" },
  );

  // The last comment, not the opening, sets the clock.
  assert.equal(
    planStoreTermsAlert({
      ...failure,
      openIssues: [openIssue("2026-10-19T12:00:00Z", ["2026-10-21T01:00:00Z"])],
    }).action,
    "wait",
  );

  const comment = planStoreTermsAlert({
    ...failure,
    openIssues: [openIssue("2026-10-19T12:00:00Z", ["2026-10-20T12:00:00Z"])],
  });
  assert.equal(comment.action, "comment");
  assert.equal(comment.issue, 7);
  assert.match(comment.body, /Sigue fallando/);
  assert.match(comment.body, /actions\/runs\/123/);
});

test("the debounce only gates opening: an open issue still gets its comment", () => {
  const plan = planStoreTermsAlert({
    ...failure,
    previousRunFailed: false,
    openIssues: [openIssue("2026-10-19T12:00:00Z", ["2026-10-20T12:00:00Z"])],
  });
  assert.equal(plan.action, "comment");
});

test("a valid read closes the open issue, or does nothing without one", () => {
  const close = planStoreTermsAlert({
    ...failure,
    status: "ok",
    openIssues: [openIssue("2026-10-21T02:00:00Z")],
  });
  assert.equal(close.action, "close");
  assert.equal(close.issue, 7);
  assert.ok(close.comment.includes(`desde Tiendanube: ${keptTerms}. Ejecución:`), close.comment);

  assert.deepEqual(planStoreTermsAlert({ ...failure, status: "ok" }), { action: "none" });
});

test("the kept values name free shipping the way the site does, or leave it out when unknown", () => {
  const keptWith = (keptTermsFile) =>
    planStoreTermsAlert({ ...failure, terms: keptTermsFile }).body;

  assert.match(
    keptWith({ ...terms, freeShippingMinimumArs: 0 }),
    /6 cuotas sin interés y envío gratis a todo el país \(/,
  );
  // A data/store-terms.json from before the free-shipping sync.
  assert.match(
    keptWith({ transferDiscountPercent: 10, interestFreeInstallments: 6 }),
    /\*\*Valores que se mantienen en el sitio:\*\* 10% de descuento por transferencia y 6 cuotas sin interés \(/,
  );
  assert.match(keptWith(null), /\*\*Valores que se mantienen en el sitio:\*\* los valores anteriores \(/);
});

// Parses a workflow command the way GitHub turns it into a check-run annotation.
function asAnnotation(command) {
  const [, level, title, message] = /^::(\w+) title=([^:]*)::(.*)$/.exec(command);
  return {
    annotation_level: level,
    title,
    message: message.replace(/%0A/g, "\n").replace(/%0D/g, "\r").replace(/%25/g, "%"),
  };
}

test("each run's verdict annotation reads back as that verdict", () => {
  const failed = termsAnnotation({ status: "failed", reason: "HTTP 503, tras 3 intentos", terms });
  const ok = termsAnnotation({ status: "ok", terms });

  assert.equal(
    failed,
    "::warning title=Condiciones de pago::No se actualizaron las condiciones de pago: HTTP 503, tras 3 intentos. Se mantiene data/store-terms.json sin cambios.",
  );
  assert.equal(
    ok,
    "::notice title=Condiciones de pago::Condiciones de pago leídas desde Tiendanube: 10%25 de descuento por transferencia, 6 cuotas sin interés y envío gratis en compras superiores a $ 200.000.",
  );
  assert.equal(termsVerdict([asAnnotation(failed)]), "failed");
  assert.equal(termsVerdict([asAnnotation(ok)]), "ok");
});

test("annotation messages escape % and line breaks", () => {
  const command = termsAnnotation({ status: "failed", reason: "a dice 10%\ny b 15%\r" });

  assert.doesNotMatch(command, /[\r\n]/);
  assert.match(
    asAnnotation(command).message,
    /^No se actualizaron las condiciones de pago: a dice 10%\ny b 15%\r\. Se mantiene/,
  );
});

test("termsVerdict ignores annotations other than the payment-terms verdict", () => {
  const annotation = (annotation_level, title) => ({ annotation_level, title, message: "" });

  assert.equal(termsVerdict([]), null);
  assert.equal(
    termsVerdict([
      annotation("warning", ""),
      annotation("failure", ""),
      // The alert step's own problems never count as a failed sync.
      annotation("warning", STORE_TERMS_ALERT_PROBLEM_TITLE),
    ]),
    null,
  );
  assert.notEqual(STORE_TERMS_ALERT_PROBLEM_TITLE, STORE_TERMS_ANNOTATION_TITLE);
  assert.equal(
    termsVerdict([annotation("notice", ""), annotation("warning", STORE_TERMS_ANNOTATION_TITLE)]),
    "failed",
  );
  assert.equal(termsVerdict([annotation("notice", STORE_TERMS_ANNOTATION_TITLE)]), "ok");
});

test("previousTermsVerdict takes the latest run that read the terms, newest first", async () => {
  const verdictOf = { 3: [], 2: [{ annotation_level: "warning", title: "Condiciones de pago" }] };
  const asked = [];
  const annotationsOf = async (run) => {
    asked.push(run.id);
    if (!(run.id in verdictOf)) throw new Error(`run ${run.id} should not be read`);
    return verdictOf[run.id];
  };

  // Run 3 skipped the terms step (paused sync, failed catalog sync…).
  assert.equal(
    await previousTermsVerdict([{ id: 3 }, { id: 2 }, { id: 1 }], annotationsOf),
    "failed",
  );
  assert.deepEqual(asked, [3, 2]);

  assert.equal(await previousTermsVerdict([{ id: 3 }], annotationsOf), null);
  assert.equal(await previousTermsVerdict([], annotationsOf), null);
  await assert.rejects(previousTermsVerdict([{ id: 9 }], annotationsOf), /should not be read/);
});
