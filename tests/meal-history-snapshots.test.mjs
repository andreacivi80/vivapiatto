import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";

const source = await readFile(new URL("../app/mealHistory.ts", import.meta.url), "utf8");
const ast = ts.createSourceFile("mealHistory.ts", source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
assert.equal(ast.parseDiagnostics.length, 0, "The actual history module must parse without errors");
const compiled = ts.transpileModule(source, {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS },
}).outputText;
const exportsObject = {};
const moduleObject = { exports: exportsObject };
const forbiddenCatalog = new Proxy({}, {
  get() { throw new Error("History calculations must not read the current catalog"); },
});
vm.runInNewContext(compiled, {
  exports: exportsObject, module: moduleObject, structuredClone,
  foods: forbiddenCatalog, recipeMap: forbiddenCatalog,
}, { timeout: 1000 });
const {
  createMealHistorySnapshot, parseMealHistorySnapshot, calculateMealSnapshotTotals,
  compareMealHistorySnapshots, editMealHistoryIngredientGrams,
  insertMealHistorySnapshot, setMealHistorySnapshotRecorded, toggleMealHistorySnapshot,
  resolveMealHistoryRecord,
} = moduleObject.exports;
for (const name of ["createMealHistorySnapshot", "parseMealHistorySnapshot", "calculateMealSnapshotTotals",
  "compareMealHistorySnapshots", "editMealHistoryIngredientGrams", "insertMealHistorySnapshot",
  "setMealHistorySnapshotRecorded", "toggleMealHistorySnapshot", "resolveMealHistoryRecord"]) {
  assert.equal(typeof moduleObject.exports[name], "function", `Missing actual export: ${name}`);
}

const plain = (value) => structuredClone(value);
const near = (actual, expected, label) =>
  assert.ok(Number.isFinite(actual) && Math.abs(actual - expected) < 1e-9, `${label}: ${actual} !== ${expected}`);
const facts = (kcal, protein, carbs, fat, fiber = 0) => ({
  kcal, protein, carbs, fat, fiber, source: "FIXTURE: explicit saved facts", weightState: "peso dichiarato",
});
// These are deliberately explicit fixture facts, not a lookup into today's food database.
const p44Input = (overrides = {}) => ({
  id: "meal-p44-release60", planSlotKey: "0-2", recipeId: "matrix-p44-quinoa-cannellini-beet",
  recipeName: "Quinoa con cannellini, barbabietole e rucola",
  recordedAtISO: "2026-10-28T23:15:00.000Z", consumedOn: "2026-10-29", sourceVersion: "1.20.60",
  ingredients: [
    { food: "Quinoa cotta", grams: 185, factsPer100: facts(120, 4.4, 21.3, 1.9, 2.8) },
    { food: "Fagioli cannellini cotti", grams: 150, factsPer100: facts(100, 7, 15, 0.5, 6) },
    { food: "Barbabietole cotte", grams: 150, factsPer100: facts(43, 1.6, 9.6, 0.2, 2.8) },
    { food: "Rucola", grams: 50, factsPer100: facts(25, 2.6, 3.7, 0.7, 1.6) },
    { food: "Olio extravergine", grams: 10, factsPer100: facts(900, 0, 0, 100, 0) },
    { food: "Pane integrale", label: "Pane aggiunto al pranzo", grams: 50, factsPer100: facts(250, 9, 43, 3, 6) },
  ],
  ...overrides,
});
const expectedTotals = (ingredients) => {
  const result = { kcal: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 };
  for (const item of ingredients) {
    for (const field of ["kcal", "protein", "carbs", "fat"]) result[field] += item.factsPer100[field] * item.grams / 100;
    if (result.fiber !== null) result.fiber = item.factsPer100.fiber === undefined
      ? null : result.fiber + item.factsPer100.fiber * item.grams / 100;
  }
  return result;
};
const assertTotals = (actual, expected) => {
  for (const field of ["kcal", "protein", "carbs", "fat"]) near(actual[field], expected[field], field);
  if (expected.fiber === null) assert.equal(actual.fiber, null);
  else near(actual.fiber, expected.fiber, "fiber");
};
const withoutStatus = (snapshot) => {
  const { status, ...rest } = plain(snapshot);
  return rest;
};

test("meal history snapshots require caller metadata and preserve an explicit local consumption day", () => {
  const input = p44Input();
  const snapshot = createMealHistorySnapshot(input);
  assert.equal(snapshot.schema, 1);
  assert.equal(snapshot.status, "recorded");
  for (const field of ["id", "planSlotKey", "recipeId", "recipeName", "recordedAtISO", "consumedOn", "sourceVersion"]) {
    assert.equal(snapshot[field], input[field], field);
    const missing = p44Input();
    delete missing[field];
    assert.throws(() => createMealHistorySnapshot(missing), `Must not invent ${field}`);
  }
  assert.equal(snapshot.consumedOn, "2026-10-29");
  assert.notEqual(snapshot.consumedOn, snapshot.recordedAtISO.slice(0, 10), "The explicit local day is not a UTC timestamp slice");
  const missingIngredients = p44Input();
  delete missingIngredients.ingredients;
  assert.throws(() => createMealHistorySnapshot(missingIngredients));
  for (const [field, value] of [["schema", 1], ["status", "voided"], ["totals", { kcal: 0 }]]) {
    assert.throws(() => createMealHistorySnapshot({ ...p44Input(), [field]: value }), `Creation must not accept caller-injected ${field}`);
  }
  assertTotals(snapshot.totals, expectedTotals(input.ingredients));
});

test("the release60 P44 record keeps its bread and never acquires release61 vinegar or updated database facts", () => {
  const input = p44Input();
  const snapshot = createMealHistorySnapshot(input);
  const stored = JSON.stringify(snapshot);
  const savedTotals = plain(snapshot.totals);
  // Model both a catalog insertion before the bread and an in-place food database correction.
  input.sourceVersion = "1.20.61";
  input.ingredients.splice(5, 0, { food: "Aceto di mele", grams: 5, factsPer100: facts(21, 0, 0.9, 0, 0) });
  input.ingredients[0].factsPer100.kcal = 999;
  input.ingredients[6].grams = 90;
  assert.equal(JSON.stringify(snapshot), stored, "Snapshot must own copies of ingredient rows and nested facts");
  assert.equal(snapshot.ingredients.length, 6);
  assert.equal(snapshot.ingredients[5].food, "Pane integrale");
  assert.equal(snapshot.ingredients[5].grams, 50);
  assert.equal(snapshot.ingredients.some((item) => item.food === "Aceto di mele"), false);
  assertTotals(calculateMealSnapshotTotals(snapshot), savedTotals);
  assert.equal(snapshot.sourceVersion, "1.20.60");
  const restored = parseMealHistorySnapshot(JSON.parse(stored));
  assert.deepEqual(plain(restored), JSON.parse(stored));
  assertTotals(calculateMealSnapshotTotals(restored), savedTotals);
});

test("creation and parsing copy all nested ingredient facts instead of retaining mutable caller references", () => {
  const input = p44Input();
  const inputBefore = JSON.stringify(input);
  const snapshot = createMealHistorySnapshot(input);
  assert.equal(JSON.stringify(input), inputBefore, "Creation must not mutate its input");
  assert.notEqual(snapshot.ingredients, input.ingredients);
  assert.notEqual(snapshot.ingredients[0], input.ingredients[0]);
  assert.notEqual(snapshot.ingredients[0].factsPer100, input.ingredients[0].factsPer100);
  const serialized = JSON.parse(JSON.stringify(snapshot));
  const parsed = parseMealHistorySnapshot(serialized);
  const parsedBefore = JSON.stringify(parsed);
  serialized.ingredients[0].factsPer100.source = "new catalog source";
  serialized.ingredients[0].grams = 1;
  serialized.totals.kcal = -1;
  assert.equal(JSON.stringify(parsed), parsedBefore);
});

test("fractional and zero gram amounts are retained without integer calorie or macro rounding", () => {
  const input = p44Input({ ingredients: [
    { food: "Frazione esplicita", grams: 49.25, factsPer100: facts(123.456, 7.89, 12.34, 3.21, 1.23) },
    { food: "Quantità zero", grams: 0, factsPer100: facts(999, 99, 99, 99, 99) },
  ] });
  const snapshot = createMealHistorySnapshot(input);
  assert.equal(snapshot.ingredients[0].grams, 49.25);
  assert.equal(snapshot.ingredients[1].grams, 0);
  assertTotals(snapshot.totals, expectedTotals(input.ingredients));
  assert.notEqual(snapshot.totals.kcal, Math.round(snapshot.totals.kcal));
});

test("a missing fiber declaration stays unknown through calculation, JSON and comparison", () => {
  const input = p44Input();
  delete input.ingredients[0].factsPer100.fiber;
  const snapshot = createMealHistorySnapshot(input);
  assert.equal(snapshot.totals.fiber, null);
  assert.equal(calculateMealSnapshotTotals(snapshot).fiber, null);
  const restored = parseMealHistorySnapshot(JSON.parse(JSON.stringify(snapshot)));
  assert.equal(restored.totals.fiber, null);
  assert.equal(restored.ingredients[0].factsPer100.fiber, undefined);
  const comparison = compareMealHistorySnapshots(createMealHistorySnapshot(p44Input()), snapshot);
  assert.equal(comparison.delta.fiber, null, "An unknown fiber value must not produce an invented numeric delta");
  const wrong = JSON.parse(JSON.stringify(snapshot));
  wrong.totals.fiber = 0;
  assert.throws(() => parseMealHistorySnapshot(wrong));
  const minimal = p44Input({ ingredients: [{
    food: "Fatti minimi espliciti", grams: 25,
    factsPer100: { kcal: 100, protein: 2, carbs: 15, fat: 3 },
  }] });
  const minimalSnapshot = createMealHistorySnapshot(minimal);
  assert.equal(minimalSnapshot.totals.fiber, null);
  for (const optional of ["fiber", "source", "weightState"]) {
    assert.equal(Object.hasOwn(minimalSnapshot.ingredients[0].factsPer100, optional), false, `${optional} must not be invented`);
  }
});

test("snapshot parsing rejects tampered totals rather than trusting persisted aggregate numbers", () => {
  const snapshot = createMealHistorySnapshot(p44Input());
  for (const field of ["kcal", "protein", "carbs", "fat", "fiber"]) {
    const changed = plain(snapshot);
    changed.totals[field] += 1;
    assert.throws(() => parseMealHistorySnapshot(changed), `Tampered total: ${field}`);
  }
  const changedFacts = plain(snapshot);
  changedFacts.ingredients[0].factsPer100.kcal += 10;
  assert.throws(() => parseMealHistorySnapshot(changedFacts), "Facts and totals must be validated together");
  for (const change of [
    (item) => { item.schema = 2; },
    (item) => { item.status = "deleted"; },
    (item) => { delete item.totals; },
    (item) => { item.totals.kcal = NaN; },
    (item) => { item.totals.fiber = null; },
  ]) {
    const changed = plain(snapshot);
    change(changed);
    assert.throws(() => parseMealHistorySnapshot(changed));
  }
  for (const value of [null, undefined, false, [], "not-a-snapshot"]) assert.throws(() => parseMealHistorySnapshot(value));
});

test("malformed ingredient facts, missing required macros and nonfinite or negative grams cannot become history", () => {
  for (const grams of [-1, NaN, Infinity, -Infinity, "50", null]) {
    const input = p44Input();
    input.ingredients[0].grams = grams;
    assert.throws(() => createMealHistorySnapshot(input), `Invalid grams: ${String(grams)}`);
  }
  for (const field of ["kcal", "protein", "carbs", "fat", "fiber"]) {
    for (const value of [-1, NaN, Infinity, "1", null]) {
      const input = p44Input();
      input.ingredients[0].factsPer100[field] = value;
      assert.throws(() => createMealHistorySnapshot(input), `Invalid ${field}: ${String(value)}`);
    }
  }
  for (const field of ["kcal", "protein", "carbs", "fat"]) {
    const input = p44Input();
    delete input.ingredients[0].factsPer100[field];
    assert.throws(() => createMealHistorySnapshot(input), `Missing ${field} cannot default to zero`);
  }
  for (const change of [
    (item) => { item.ingredients[0].factsPer100 = null; },
    (item) => { item.ingredients[0].food = ""; },
    (item) => { item.ingredients[0].factsPer100.source = 4; },
    (item) => { item.ingredients[0].factsPer100.weightState = {}; },
  ]) {
    const input = p44Input();
    change(input);
    assert.throws(() => createMealHistorySnapshot(input));
  }
});

test("consumption dates validate the real calendar and timestamps are supplied explicitly", () => {
  for (const consumedOn of ["", "2026-02-30", "2025-02-29", "2026-13-01", "2026-00-10", "2026-10-00", "2026-1-01", "2026-10-29T00:00:00Z"]) {
    assert.throws(() => createMealHistorySnapshot(p44Input({ consumedOn })), `Invalid local calendar day: ${consumedOn}`);
  }
  const leap = createMealHistorySnapshot(p44Input({ consumedOn: "2024-02-29", recordedAtISO: "2024-02-29T23:45:00.000Z" }));
  assert.equal(leap.consumedOn, "2024-02-29");
  for (const recordedAtISO of ["", "not-a-date", "2026-10-29T25:00:00.000Z", "2026-02-30T12:00:00.000Z", "2026-10-29T12:00:00"]) {
    assert.throws(() => createMealHistorySnapshot(p44Input({ recordedAtISO })));
  }
  const offsetTimestamp = "2026-10-29T00:15:00.000+01:00";
  assert.equal(createMealHistorySnapshot(p44Input({ recordedAtISO: offsetTimestamp })).recordedAtISO, offsetTimestamp);
});

test("an explicit gram edit creates a new snapshot with the saved facts and only the requested amount changed", () => {
  const snapshot = createMealHistorySnapshot(p44Input());
  const before = JSON.stringify(snapshot);
  const edited = editMealHistoryIngredientGrams(snapshot, 5, 37.25);
  assert.notEqual(edited, snapshot);
  assert.equal(JSON.stringify(snapshot), before, "Editing must not mutate the recorded snapshot");
  assert.equal(edited.ingredients[5].food, "Pane integrale");
  assert.equal(edited.ingredients[5].grams, 37.25);
  assert.deepEqual(plain(edited.ingredients[5].factsPer100), plain(snapshot.ingredients[5].factsPer100));
  assert.notEqual(edited.ingredients[5].factsPer100, snapshot.ingredients[5].factsPer100);
  assert.deepEqual(plain(edited.ingredients.slice(0, 5)), plain(snapshot.ingredients.slice(0, 5)));
  for (const field of ["id", "planSlotKey", "recipeId", "recipeName", "recordedAtISO", "consumedOn", "sourceVersion", "status"]) {
    assert.equal(edited[field], snapshot[field], field);
  }
  assertTotals(edited.totals, expectedTotals(edited.ingredients));
  assert.equal(editMealHistoryIngredientGrams(snapshot, 5, 0).ingredients[5].grams, 0);
  for (const index of [-1, 6, 0.5, NaN]) assert.throws(() => editMealHistoryIngredientGrams(snapshot, index, 10));
  for (const grams of [-1, NaN, Infinity]) assert.throws(() => editMealHistoryIngredientGrams(snapshot, 5, grams));
});

test("snapshot comparison reports right-minus-left deltas using saved facts without rounding", () => {
  const left = createMealHistorySnapshot(p44Input());
  const same = compareMealHistorySnapshots(left, parseMealHistorySnapshot(JSON.parse(JSON.stringify(left))));
  assert.equal(same.sameIngredients, true);
  assertTotals(same.delta, { kcal: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 });
  const right = editMealHistoryIngredientGrams(left, 5, 37.25);
  const changed = compareMealHistorySnapshots(left, right);
  assert.equal(changed.sameIngredients, false);
  const breadFacts = left.ingredients[5].factsPer100;
  assertTotals(changed.delta, Object.fromEntries(["kcal", "protein", "carbs", "fat", "fiber"].map((field) =>
    [field, breadFacts[field] * (37.25 - 50) / 100])));
  const renamed = p44Input();
  renamed.ingredients[5].food = "Pane diverso dichiarato esplicitamente";
  assert.equal(compareMealHistorySnapshots(left, createMealHistorySnapshot(renamed)).sameIngredients, false);
});

test("insertion never overwrites an existing ID and rejects a second active record for the same local day and slot", () => {
  const first = createMealHistorySnapshot(p44Input());
  const history = insertMealHistorySnapshot([], first);
  const before = JSON.stringify(history);
  assert.equal(history.length, 1);
  assert.throws(() => insertMealHistorySnapshot(history, first), "Even an identical duplicate ID is an error");
  assert.throws(() => insertMealHistorySnapshot(history, editMealHistoryIngredientGrams(first, 5, 12)), "An edit cannot overwrite the existing ID by insertion");
  const sameSlot = createMealHistorySnapshot(p44Input({ id: "another-record-same-day-slot" }));
  assert.throws(() => insertMealHistorySnapshot(history, sameSlot));
  assert.equal(JSON.stringify(history), before);
  const nextDay = createMealHistorySnapshot(p44Input({ id: "next-local-day", consumedOn: "2026-10-30" }));
  const otherSlot = createMealHistorySnapshot(p44Input({ id: "same-day-other-slot", planSlotKey: "0-4" }));
  const expanded = insertMealHistorySnapshot(insertMealHistorySnapshot(history, nextDay), otherSlot);
  assert.equal(expanded.length, 3);
  assert.equal(history.length, 1, "Insertion must not mutate the supplied history");
});

test("void and toggle preserve the complete record; conflicting reactivation and unknown IDs are errors", () => {
  const snapshot = createMealHistorySnapshot(p44Input());
  const original = insertMealHistorySnapshot([], snapshot);
  const voided = setMealHistorySnapshotRecorded(original, snapshot.id, false);
  assert.equal(original[0].status, "recorded");
  assert.equal(voided[0].status, "voided");
  assert.deepEqual(withoutStatus(voided[0]), withoutStatus(snapshot));
  const restored = toggleMealHistorySnapshot(voided, snapshot.id);
  assert.equal(restored[0].status, "recorded");
  assert.deepEqual(plain(restored[0]), plain(snapshot));
  const toggledOff = toggleMealHistorySnapshot(restored, snapshot.id);
  assert.equal(toggledOff[0].status, "voided");
  assert.deepEqual(withoutStatus(toggledOff[0]), withoutStatus(snapshot));
  const replacement = createMealHistorySnapshot(p44Input({ id: "replacement-in-voided-slot" }));
  const occupied = insertMealHistorySnapshot(voided, replacement);
  const occupiedBefore = JSON.stringify(occupied);
  assert.throws(() => setMealHistorySnapshotRecorded(occupied, snapshot.id, true));
  assert.throws(() => toggleMealHistorySnapshot(occupied, snapshot.id));
  assert.throws(() => insertMealHistorySnapshot(voided, snapshot), "A voided ID also remains unique");
  assert.equal(JSON.stringify(occupied), occupiedBefore);
  for (const history of [[], original, voided]) {
    assert.throws(() => setMealHistorySnapshotRecorded(history, "unknown-id", false));
    assert.throws(() => toggleMealHistorySnapshot(history, "unknown-id"));
  }
});

test("the resolver accepts valid snapshots but never reconstructs a legacy ingredient list from recipe IDs and positional weights", () => {
  const snapshot = createMealHistorySnapshot(p44Input());
  const resolved = resolveMealHistoryRecord(JSON.parse(JSON.stringify(snapshot)));
  assert.equal(resolved.status, "resolved");
  assert.deepEqual(plain(resolved.snapshot), plain(snapshot));
  const legacy = {
    completed: { "0-2": true }, completedRecipes: { "0-2": "matrix-p44-quinoa-cannellini-beet" },
    actualWeights: { "0-2": [185, 150, 150, 50, 10, 50] },
    partSelections: {}, extras: { "0": [{ label: "Dati originali", kcal: 12.5 }] },
    futureUserData: { keep: ["raw", { value: 49.25 }] },
  };
  const before = JSON.stringify(legacy);
  const review = resolveMealHistoryRecord(legacy);
  assert.equal(review.status, "needsReview");
  assert.equal(review.reason, "legacy-without-snapshot");
  assert.equal(Object.hasOwn(review, "snapshot"), false);
  assert.deepEqual(plain(review.raw), legacy);
  assert.notEqual(review.raw, legacy);
  assert.notEqual(review.raw.actualWeights, legacy.actualWeights);
  legacy.actualWeights["0-2"][5] = 999;
  legacy.futureUserData.keep[1].value = 0;
  assert.equal(JSON.stringify(review.raw), before, "Unresolved raw history must be preserved by deep copy");
  const invalid = plain(snapshot);
  invalid.totals.kcal += 1;
  const invalidReview = resolveMealHistoryRecord(invalid);
  assert.equal(invalidReview.status, "needsReview");
  assert.equal(invalidReview.reason, "invalid-snapshot");
  assert.equal(Object.hasOwn(invalidReview, "snapshot"), false);
  assert.deepEqual(plain(invalidReview.raw), invalid);
  assert.notEqual(invalidReview.raw, invalid);
});

test("an uncloneable legacy host value remains opaque needsReview instead of crashing the resolver", () => {
  const raw = { legacy: true, callback() {}, nested: { keep: "original evidence" } };
  const review = resolveMealHistoryRecord(raw);
  assert.equal(review.status, "needsReview");
  assert.equal(review.reason, "legacy-without-snapshot");
  assert.equal(review.raw, raw, "Uncloneable evidence cannot be serialized or silently rewritten");
  assert.equal(Object.hasOwn(review, "snapshot"), false);
});

test("sparse ingredient arrays and numeric overflow are rejected without partial records", () => {
  assert.throws(() => createMealHistorySnapshot(p44Input({ ingredients: Array(2) })));
  const overflowing = p44Input({ ingredients: [{
    food: "Overflow fixture", grams: Number.MAX_VALUE,
    factsPer100: facts(Number.MAX_VALUE, 1, 1, 1, 1),
  }] });
  assert.throws(() => createMealHistorySnapshot(overflowing));
});
