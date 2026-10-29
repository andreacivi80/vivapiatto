import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import vm from "node:vm";
import { capturePersistedPlanState } from "../scripts/release-audit-state.mjs";

test("release audit captures user plan identity and changes, not recipe heading text", () => {
  const stored = { choices: { "0-2": "P17" }, actualWeights: { "0-0-0": 49 },
    partSelections: { "0-2-1": { food: "Tofu", grams: 150 } },
    removedIngredients: { "0-4": [2] }, completed: { "0-0": true },
    completedRecipes: { "0-0": "breakfast-rusks-jam" }, weekLocked: true,
    extras: { "0-1": [{ food: "Pizza margherita", grams: 300 }] },
    tab: "recipes" };
  const before = capturePersistedPlanState(JSON.stringify(stored));
  assert.deepEqual(capturePersistedPlanState(JSON.stringify({ ...stored, tab: "today" })), before);
  for (const key of ["choices", "actualWeights", "partSelections", "removedIngredients",
    "completed", "completedRecipes", "weekLocked", "extras"]) {
    assert.notDeepEqual(capturePersistedPlanState(JSON.stringify({ ...stored, [key]: null })), before, key);
  }
  assert.equal(before.actualWeights["0-0-0"], 49);
  assert.equal(stored.tab, "recipes");
});

test("release audit reader runs unchanged inside the page and rejects absent/corrupt state", () => {
  const raw = JSON.stringify({ choices: { "0-2": "P17" }, calories: 2000 });
  const result = vm.runInNewContext(`(${capturePersistedPlanState.toString()})(raw)`, { raw });
  assert.equal(JSON.stringify(result), JSON.stringify(capturePersistedPlanState(raw)));
  for (const raw of [null, "", "null", "[]", "false", "{"]) {
    assert.throws(() => capturePersistedPlanState(raw));
  }
});

test("live update still requires exact menu text as well as persisted plan equality", async () => {
  const audit = await readFile(new URL("../scripts/audit-live-release-update.mjs", import.meta.url), "utf8");
  assert.match(audit, /initialPlanState = await evaluate/);
  assert.match(audit, /restoredPlanState = await evaluate/);
  assert.match(audit, /planStatePreserved: isDeepStrictEqual\(restoredPlanState, initialPlanState\)/);
  assert.match(audit, /menuPreserved: JSON.stringify\(restoredMeal.menu\) === JSON.stringify\(initial.menu\)/);
  assert.match(audit, /!report.gramsPreserved \|\| !report.menuPreserved \|\| !report.planStatePreserved/);
});

test("mobile audit can target the published version while the next local release is prepared", async () => {
  const audit = await readFile(new URL("../scripts/audit-public-mobile.mjs", import.meta.url), "utf8");
  const expression = audit.match(/const version = ([\s\S]*?);\r?\n/)[1];
  const resolve = (argv, env = {}) => vm.runInNewContext(expression, {
    process: { argv, env }, packageFile: { version: "1.20.62" },
  });
  assert.equal(resolve(["node", "audit", "--version=1.20.61"]), "1.20.61");
  assert.equal(resolve(["node", "audit"], { VIVAPIATTO_AUDIT_VERSION: "1.20.60" }), "1.20.60");
  assert.equal(resolve(["node", "audit"]), "1.20.62");
  const urlExpression = audit.match(/const auditBaseUrl = ([\s\S]*?);\r?\n/)[1];
  const resolveUrl = (argv, env = {}) => vm.runInNewContext(urlExpression, { process: { argv, env } });
  assert.equal(resolveUrl(["node", "audit", "--version=1.20.61"]), "https://andreacivi80.github.io/vivapiatto/");
  assert.equal(resolveUrl(["node", "audit", "http://127.0.0.1:4173/", "--version=1.20.62"]), "http://127.0.0.1:4173/");
  assert.equal(resolveUrl(["node", "audit", "--url=http://127.0.0.1:4173/", "--version=1.20.62"]), "http://127.0.0.1:4173/");
  assert.equal(resolveUrl(["node", "audit"], { VIVAPIATTO_AUDIT_URL: "https://example.test/" }), "https://example.test/");
  assert.match(audit, /if \(!\/\^\\d\+\\\.\\d\+\\\.\\d\+\$\/\.test\(version\)\) throw new Error/);
});
