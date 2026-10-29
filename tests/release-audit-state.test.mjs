import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { isDeepStrictEqual } from "node:util";
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

const breakfast49g = () => ({
  choices: { "0-0": "breakfast-rusks-butter" },
  partSelections: { "0-0": [
    { category: "Carboidrato", food: "Fette biscottate integrali", grams: 49,
      label: "Fette biscottate", image: "/vivapiatto/food/part-rusks-v7.png?v=1.20.61" },
    { category: "Extra", food: "Burro", grams: 10,
      label: "Burro", image: "/vivapiatto/food/part-butter-v7.png?v=1.20.61" },
    { category: "Extra", food: "Confettura di frutta", grams: 25,
      label: "Confettura", image: "/vivapiatto/food/part-jam-v7.png?v=1.20.61" },
    { category: "Latticino", food: "Latte parzialmente scremato", grams: 200,
      label: "Latte", image: "/vivapiatto/food/part-milk-v7.png?v=1.20.61" },
  ] },
});
const capture = (state) => capturePersistedPlanState(JSON.stringify(state));

test("release audit preserves the real 49 g breakfast across photo refresh and false collapse defaults", () => {
  const before = breakfast49g();
  const inputSnapshot = JSON.stringify(before);
  const after = structuredClone(before);
  for (const part of after.partSelections["0-0"]) {
    part.image = part.image.replace("1.20.61", "1.20.62");
    part.occasionalCollapsed = false;
  }
  assert.deepEqual(capture(before), capture(after));
  assert.equal(capture(after).partSelections["0-0"][0].grams, 49);
  assert.equal(JSON.stringify(before), inputSnapshot, "Reader must not mutate the input");
  const raw = JSON.stringify(after);
  const inPage = vm.runInNewContext(`(${capturePersistedPlanState.toString()})(raw)`, { raw });
  assert.equal(JSON.stringify(inPage), JSON.stringify(capture(after)));
  const sameVersionReload = structuredClone(before);
  sameVersionReload.partSelections["0-0"].forEach((part) => { part.occasionalCollapsed = false; });
  assert.deepEqual(capture(before), capture(sameVersionReload));
});

test("release audit still detects every logical MealPart change, order and unexpected fields", () => {
  const before = breakfast49g();
  const mutations = {
    food: (parts) => { parts[0].food = "Pane integrale"; },
    grams: (parts) => { parts[0].grams = 48; },
    category: (parts) => { parts[0].category = "Extra"; },
    label: (parts) => { parts[0].label = "Etichetta personalizzata"; },
    order: (parts) => { [parts[0], parts[1]] = [parts[1], parts[0]]; },
    removal: (parts) => { parts.pop(); },
    addition: (parts) => { parts.push({ ...parts[0] }); },
    occasionalGroupId: (parts) => { parts[0].occasionalGroupId = "pizza-user-group"; },
    occasionalRecipeId: (parts) => { parts[0].occasionalRecipeId = "occasional-pizza-margherita"; },
    occasionalSplitGrams: (parts) => { parts[0].occasionalSplitGrams = 49; },
    occasionalCollapsed: (parts) => { parts[0].occasionalCollapsed = true; },
    unknownField: (parts) => { parts[0].futureUserData = { preserve: true }; },
    invalidImage: (parts) => { parts[0].image = { unexpected: true }; },
    invalidCollapsed: (parts) => { parts[0].occasionalCollapsed = "true"; },
  };
  for (const [name, change] of Object.entries(mutations)) {
    const after = structuredClone(before);
    change(after.partSelections["0-0"]);
    assert.notDeepEqual(capture(after), capture(before), name);
  }
});

test("release audit keeps pizza grouping, split grams and true collapse state significant", () => {
  const before = breakfast49g();
  Object.assign(before.partSelections["0-0"][0], {
    occasionalGroupId: "pizza-group-1", occasionalRecipeId: "occasional-pizza-margherita",
    occasionalSplitGrams: 49, occasionalCollapsed: true,
  });
  for (const [field, value] of [
    ["occasionalGroupId", "pizza-group-2"],
    ["occasionalRecipeId", "occasional-pizza-marinara"],
    ["occasionalSplitGrams", 48],
    ["occasionalCollapsed", false],
    ["occasionalCollapsed", undefined],
  ]) {
    const after = structuredClone(before);
    if (value === undefined) delete after.partSelections["0-0"][0][field];
    else after.partSelections["0-0"][0][field] = value;
    assert.notDeepEqual(capture(after), capture(before), `${field}=${value}`);
  }
});

test("release audit retains malformed and unknown part-selection data instead of filtering it", () => {
  for (const value of [
    "unexpected", ["unexpected"],
    { "0-0": { food: "Tofu", grams: 150, image: "not-an-array" } },
    { "0-0": [null, 7, ["unexpected"], { image: "not-a-MealPart" }] },
  ]) {
    assert.deepEqual(capture({ partSelections: value }).partSelections, value);
  }
  const state = breakfast49g();
  state.partSelections["0-0"][0].futureUserData = { preserve: true };
  assert.deepEqual(capture(state).partSelections["0-0"][0].futureUserData, { preserve: true });
});

test("live update still requires exact menu text as well as persisted plan equality", async () => {
  const audit = await readFile(new URL("../scripts/audit-live-release-update.mjs", import.meta.url), "utf8");
  assert.match(audit, /initialPlanState = await evaluate/);
  assert.match(audit, /restoredPlanState = await evaluate/);
  assert.match(audit, /writeReadiness\("ready", \{ initial, profile, initialPlanState \}\)/);
  assert.match(audit, /changedPlanState: Object\.fromEntries\(changedPlanFields\.map/);
  assert.match(audit, /before: initialPlanState\[key\]/);
  assert.match(audit, /after: restoredPlanState\[key\]/);
  assert.match(audit, /planStatePreserved: isDeepStrictEqual\(restoredPlanState, initialPlanState\)/);
  assert.match(audit, /menuPreserved: JSON.stringify\(restoredMeal.menu\) === JSON.stringify\(initial.menu\)/);
  assert.match(audit, /!report.gramsPreserved \|\| !report.menuPreserved \|\| !report.planStatePreserved/);
});

test("live update diagnostics expose before/after only for fields that actually changed", async () => {
  const audit = await readFile(new URL("../scripts/audit-live-release-update.mjs", import.meta.url), "utf8");
  const changedExpression = audit.match(/const changedPlanFields = ([\s\S]*?);\r?\n  const report =/)[1];
  const detailsExpression = audit.slice(audit.indexOf("changedPlanState: ") + "changedPlanState: ".length,
    audit.indexOf(",\n    scrollPreserved:") >= 0
      ? audit.indexOf(",\n    scrollPreserved:") : audit.indexOf(",\r\n    scrollPreserved:"));
  const initialPlanState = capture(breakfast49g());
  const changed = breakfast49g();
  changed.partSelections["0-0"][0].grams = 48;
  const restoredPlanState = capture(changed);
  const run = (restored) => vm.runInNewContext(`(() => {
    const changedPlanFields = ${changedExpression};
    return { changedPlanFields, changedPlanState: ${detailsExpression} };
  })()`, { initialPlanState, restoredPlanState: restored, isDeepStrictEqual });
  const result = JSON.parse(JSON.stringify(run(restoredPlanState)));
  assert.deepEqual(result.changedPlanFields, ["partSelections"]);
  assert.deepEqual(result.changedPlanState, { partSelections: {
    before: initialPlanState.partSelections, after: restoredPlanState.partSelections,
  } });
  assert.deepEqual(JSON.parse(JSON.stringify(run(initialPlanState))), {
    changedPlanFields: [], changedPlanState: {},
  });
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
