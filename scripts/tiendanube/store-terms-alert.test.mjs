import assert from "node:assert/strict";
import test from "node:test";
import { STORE_TERMS_ISSUE_TITLE, planStoreTermsAlert } from "./store-terms-alert.mjs";

const runUrl = "https://github.com/Staberman/smile-store/actions/runs/123";
const terms = { transferDiscountPercent: 10, interestFreeInstallments: 6 };
const failure = {
  status: "failed",
  reason: "las páginas no coinciden",
  terms,
  runUrl,
  owner: "Staberman",
  now: new Date("2026-10-21T12:00:00Z"),
};
const openIssue = (createdAt, commentDates = []) => ({
  number: 7,
  title: STORE_TERMS_ISSUE_TITLE,
  createdAt,
  comments: commentDates.map((date) => ({ createdAt: date })),
});

test("a failed read opens the issue with what failed, the kept values and the run", () => {
  const plan = planStoreTermsAlert(failure);

  assert.equal(plan.action, "create");
  assert.equal(plan.title, "Sincronización de cuotas y descuento con Tiendanube falló");
  assert.match(plan.body, /\*\*Qué falló:\*\* las páginas no coinciden\./);
  assert.match(plan.body, /10% de descuento por transferencia y 6 cuotas sin interés/);
  assert.match(plan.body, /actions\/runs\/123/);
  assert.match(plan.body, /cc @Staberman/);
});

test("issues with other titles are ignored", () => {
  const other = { ...openIssue("2026-10-21T11:00:00Z"), title: "Otra cosa" };
  assert.equal(planStoreTermsAlert({ ...failure, openIssues: [other] }).action, "create");
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

test("a valid read closes the open issue, or does nothing without one", () => {
  const close = planStoreTermsAlert({
    ...failure,
    status: "ok",
    openIssues: [openIssue("2026-10-21T02:00:00Z")],
  });
  assert.equal(close.action, "close");
  assert.equal(close.issue, 7);
  assert.match(close.comment, /10% de descuento por transferencia y 6 cuotas sin interés/);

  assert.deepEqual(planStoreTermsAlert({ ...failure, status: "ok" }), { action: "none" });
});
