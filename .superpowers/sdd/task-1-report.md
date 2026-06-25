Status: DONE

Commit hash(es):
- b24b7422aa06abe58399e3c1d2ad74404906d626

Files changed:
- package.json
- scripts/tiendanube/catalog-utils.mjs
- scripts/tiendanube/catalog-utils.test.mjs

Tests run:
- `npm run test:catalog` -> PASS

Self-review notes:
- Added the helper surface exactly as requested by the brief.
- Kept the parsing helpers small and deterministic for CSV/catalog migration use.
- Verified the suite in the task worktree after moving the implementation out of the main repo copy.

Concerns:
- None.

---

Fix report:
- Root cause: `extractAssignedJson` used a non-balanced regex, so nested arrays/objects inside `LS.variants` were truncated before `JSON.parse`.
- Fix: replaced regex extraction with a balanced scanner that walks brackets/braces, respects quoted strings and escapes, and parses the full slice.
- Added coverage for the nested assignment case from the review.

Tests run:
- `npm run test:catalog` -> PASS
