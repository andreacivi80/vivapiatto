import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";

const source = await readFile(new URL("../app/FoodPlanner.tsx", import.meta.url), "utf8");
const ast = ts.createSourceFile("FoodPlanner.tsx", source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
assert.equal(ast.parseDiagnostics.length, 0);
const declarations = new Map();
const visit = (node) => {
  if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name) && node.initializer) {
    const matches = declarations.get(node.name.text) || [];
    matches.push(node);
    declarations.set(node.name.text, matches);
  }
  ts.forEachChild(node, visit);
};
visit(ast);
const declaration = (name) => {
  assert.equal(declarations.get(name)?.length, 1, `Expected one actual ${name} declaration`);
  return declarations.get(name)[0];
};
const evaluate = (names, context) => {
  const selected = names.map((name) => `const ${name} = ${declaration(name).initializer.getText(ast)};`).join("\n");
  const compiled = ts.transpileModule(`${selected}\nthis.exposed = { ${names.join(", ")} };`, {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ES2022 },
  }).outputText;
  vm.runInNewContext(compiled, context, { timeout: 1000 });
  return context.exposed;
};
const november = class extends Date {
  constructor(...args) { super(...(args.length ? args : [2026, 10, 15, 12])); }
  static now() { return new Date(2026, 10, 15, 12).valueOf(); }
};
const fixture = (food, kcal) => ({
  id: `test-${food}`, name: food, testKcal: kcal,
  ingredients: [{ food, grams: 150 }],
});
const candidates = [
  fixture("Pesca", 100), fixture("Fragole", 100),
  fixture("Mela", 450), fixture("Pera", 500), fixture("Kiwi", 550),
];
const makeRuntime = (realPrimaryGates = false, dayContext = "Casa", extraNames = [], overrides = {}) => evaluate([
  "seasonalMonths", "recipeSeasonalityScore", "recipeOutOfSeasonProduceCount",
  "preferAvailableSeason",
  ...(realPrimaryGates ? ["mensaRecipeIds", "mensaFirstChoiceIds", "isMensaFriendly", "mensaPracticalPool", "recipePartCategories", "mainMealBalanceScore"] : []),
  "closestForSlot", ...extraNames,
], {
  Date: november, round: Math.round, weekPreference: "variety", dayContext,
  mealPrepMode: "No", budgetLevel: "Medio", recordedFavoriteRecipeIds: new Set(),
  mensaCombinations: [],
  mainMealBalanceScore: () => 3, recipeBudgetScore: () => 0,
  varietyKeysForItems: () => ({ bases: new Set(), vegetables: new Set() }),
  profileRecipeKcal: (recipe) => recipe.testKcal, automaticMultiLegumePenalty: () => 0,
  mensaPracticalPool: (pool) => pool,
  ...overrides,
});

test("v1.20.62 preserves the CREA October peach calendar while November excludes it", () => {
  const runtime = makeRuntime();
  assert.equal(runtime.seasonalMonths.Pesca.includes(10), true);
  assert.equal(runtime.recipeOutOfSeasonProduceCount(candidates[0]), 1);
  assert.equal(runtime.recipeOutOfSeasonProduceCount(candidates[1]), 1);
  for (const recipe of candidates.slice(2)) assert.equal(runtime.recipeOutOfSeasonProduceCount(recipe), 0);
});

test("v1.20.62 every automatic offset selects November-compatible produce before calorie ranking", () => {
  const runtime = makeRuntime();
  const original = JSON.stringify(candidates);
  // Calorie distance deliberately favors the two unavailable fruits. The gate,
  // not a larger score penalty, must exclude them for every rotation position.
  for (const slot of [0, 1, 2, 3, 4]) {
    for (let offset = 0; offset < 35; offset += 1) {
      const selected = runtime.closestForSlot(candidates, slot, 100, offset);
      assert.ok(selected, `slot ${slot}, offset ${offset}: missing automatic proposal`);
      assert.equal(runtime.recipeOutOfSeasonProduceCount(selected), 0, `slot ${slot}, offset ${offset}: ${selected.name}`);
      assert.ok(candidates.slice(2).includes(selected));
    }
  }
  assert.equal(JSON.stringify(candidates), original, "Candidate catalog/order must not be mutated");
});

test("v1.20.62 one seasonal candidate suffices; an empty compatible pool keeps the explicit fallback", () => {
  const runtime = makeRuntime();
  const singleSeasonal = candidates.slice(0, 3);
  for (let offset = 0; offset < 15; offset += 1) {
    assert.equal(runtime.closestForSlot(singleSeasonal, 1, 100, offset), candidates[2]);
  }
  const unavailableOnly = candidates.slice(0, 2);
  assert.equal(runtime.preferAvailableSeason(unavailableOnly), unavailableOnly);
  assert.ok(unavailableOnly.includes(runtime.closestForSlot(unavailableOnly, 1, 100, 1)));
  assert.equal(runtime.preferAvailableSeason([]).length, 0);
});

test("v1.20.62 applyCuisine gates breakfast/snack pools and closestForSlot gates before rotation", () => {
  const cuisine = declaration("applyCuisine").initializer.getText(ast);
  assert.match(cuisine, /const breakfasts = preferAvailableSeason\(availableBreakfasts\(\)\)/);
  assert.match(cuisine, /const snacks = preferAvailableSeason\(practicalWorkSnacks\(availableSnacks\(\), dayContext\)\)/);
  const closest = declaration("closestForSlot").initializer.getText(ast);
  const gate = closest.indexOf("const seasonalPool = preferAvailableSeason(coherentPool)");
  assert.ok(gate > closest.indexOf("mensaPracticalPool(pool, slot)"));
  assert.ok(gate > closest.indexOf("const coherentPool = completeMains.length"));
  assert.ok(gate < closest.indexOf("const compactSnackPool"));
  assert.ok(gate < closest.indexOf("return ranked[offset"));
});

const literalRecipe = (id) => {
  const matches = [];
  const find = (node) => {
    if (ts.isObjectLiteralExpression(node)) {
      const idProperty = node.properties.find((entry) => ts.isPropertyAssignment(entry) &&
        entry.name.getText(ast) === "id" && ts.isStringLiteral(entry.initializer) && entry.initializer.text === id);
      if (idProperty) matches.push(node);
    }
    ts.forEachChild(node, find);
  };
  find(ast);
  assert.equal(matches.length, 1, `Expected one actual ${id} recipe`);
  const context = { photo: (name) => name };
  const compiled = ts.transpileModule(`const standardComponentAlternatives = ${declaration("standardComponentAlternatives").initializer.getText(ast)};\nthis.recipe = ${matches[0].getText(ast)};`, {
    compilerOptions: { target: ts.ScriptTarget.ES2022 },
  }).outputText;
  vm.runInNewContext(compiled, context, { timeout: 1000 });
  return { ...context.recipe, testKcal: 500 };
};

test("v1.20.62 complete meals remain primary when only an incomplete alternative is seasonal", () => {
  const runtime = makeRuntime(true);
  const completeOutOfSeason = literalRecipe("matrix-d42-chicken-brown-rice-peppers");
  const incompleteSeasonal = {
    id: "test-seasonal-pasta-vegetables", name: "Pasta e broccoli senza proteina", testKcal: 100,
    ingredients: [{ food: "Pasta cotta", grams: 160 }, { food: "Broccoli bolliti", grams: 200 }],
    parts: [{ category: "Carboidrato", food: "Pasta cotta", grams: 160 }, { category: "Contorno", food: "Broccoli bolliti", grams: 200 }],
  };
  assert.equal(runtime.mainMealBalanceScore(completeOutOfSeason), 3);
  assert.equal(runtime.mainMealBalanceScore(incompleteSeasonal), 2);
  assert.equal(runtime.recipeOutOfSeasonProduceCount(completeOutOfSeason), 1);
  assert.equal(runtime.recipeOutOfSeasonProduceCount(incompleteSeasonal), 0);
  for (const slot of [2, 4]) {
    for (let offset = 0; offset < 15; offset += 1) {
      assert.equal(runtime.closestForSlot([incompleteSeasonal, completeOutOfSeason], slot, 100, offset), completeOutOfSeason);
    }
  }
});

test("v1.20.62 real mensa practicality gate remains primary over a seasonal home recipe", () => {
  const runtime = makeRuntime(true, "Mensa");
  const practicalOutOfSeason = literalRecipe("matrix-d42-chicken-brown-rice-peppers");
  const seasonalHomeMeal = literalRecipe("matrix-p49-millet-chicken-pumpkin");
  assert.equal(runtime.mainMealBalanceScore(practicalOutOfSeason), 3);
  assert.equal(runtime.mainMealBalanceScore(seasonalHomeMeal), 3);
  assert.equal(runtime.mensaFirstChoiceIds.has(practicalOutOfSeason.id), true);
  assert.equal(runtime.mensaFirstChoiceIds.has(seasonalHomeMeal.id), false);
  assert.equal(runtime.recipeOutOfSeasonProduceCount(seasonalHomeMeal), 0);
  assert.equal(runtime.mensaPracticalPool([seasonalHomeMeal, practicalOutOfSeason], 2)[0], practicalOutOfSeason);
  for (let offset = 0; offset < 15; offset += 1) {
    assert.equal(runtime.closestForSlot([seasonalHomeMeal, practicalOutOfSeason], 2, 500, offset), practicalOutOfSeason);
  }
});

test("v1.20.62 mixed real main-meal pools prefer a complete practical seasonal candidate for every offset", () => {
  const runtime = makeRuntime(true, "Mensa");
  const practicalOutOfSeason = literalRecipe("matrix-d42-chicken-brown-rice-peppers");
  const seasonalHomeMeal = literalRecipe("matrix-p49-millet-chicken-pumpkin");
  const practicalSeasonal = literalRecipe("matrix-d32-frittata-al-forno-con-broccoli-e-patate");
  assert.equal(runtime.mainMealBalanceScore(practicalSeasonal), 3);
  assert.equal(runtime.mensaFirstChoiceIds.has(practicalSeasonal.id), true);
  assert.equal(runtime.recipeOutOfSeasonProduceCount(practicalSeasonal), 0);
  const pool = [seasonalHomeMeal, practicalOutOfSeason, practicalSeasonal];
  const snapshot = JSON.stringify(pool);
  for (let offset = 0; offset < 35; offset += 1) {
    assert.equal(runtime.closestForSlot(pool, 2, 500, offset), practicalSeasonal);
  }
  assert.equal(JSON.stringify(pool), snapshot);
});

const chooserNames = [
  "proteinFamilyForItems", "recipeProteinFamily", "wholeEggEquivalents",
  "proteinSignatureForItems", "recipeProteinSignature", "recipeCourse", "recipeCuisine",
  "fitsSlot", "WEEKLY_MAIN_ROTATION", "chooseMain",
];
const makeChooserRuntime = (pool, context = "Mensa", preference = "repeat", state = {}) => makeRuntime(true, context, chooserNames, {
  allRecipes: pool, cuisineChoice: "Italiano", preference,
  isProfileEligible: () => true, isWorkFriendly: () => true,
  plannedEggEquivalents: 0, plannedIngredients: (_key, recipe) => recipe.ingredients,
  usedRecipes: new Set(), usedProteinSignatures: new Set(),
  seenBases: new Set(), seenVegetables: new Set(), ...state,
});

test("v1.20.62 chooseMain gates practicality and completeness before season and species", () => {
  const chooser = declaration("chooseMain").initializer.getText(ast);
  const practical = chooser.indexOf("const practicalCandidates = mensaPracticalPool(budgetedCandidates, slot)");
  const complete = chooser.indexOf("const completeCandidates = practicalCandidates.filter");
  const season = chooser.indexOf("const inSeasonCandidates = coherentCandidates.filter");
  const species = chooser.indexOf("const unusedSpecies");
  assert.ok(practical >= 0 && practical < complete && complete < season && season < species);
  assert.match(chooser, /completeCandidates\.length \? completeCandidates : practicalCandidates/);
  assert.match(chooser, /inSeasonCandidates\.length \? inSeasonCandidates : coherentCandidates/);
  assert.match(chooser, /unusedSpecies\.length \? unusedSpecies : seasonAwareCandidates/);
});

test("v1.20.62 actual chooseMain retains the sole practical mensa meal over a seasonal home meal", () => {
  const practical = literalRecipe("matrix-d42-chicken-brown-rice-peppers");
  const home = literalRecipe("matrix-p49-millet-chicken-pumpkin");
  const pool = [home, practical];
  const snapshot = JSON.stringify(pool);
  const runtime = makeChooserRuntime(pool);
  assert.equal(runtime.recipeProteinFamily(practical), "carne-bianca");
  assert.equal(runtime.recipeProteinFamily(home), "carne-bianca");
  assert.equal(runtime.recipeOutOfSeasonProduceCount(practical), 1);
  assert.equal(runtime.recipeOutOfSeasonProduceCount(home), 0);
  for (let offset = 0; offset < 35; offset += 1) {
    assert.equal(runtime.chooseMain(pool, "carne-bianca", 2, 500, offset, 0), practical);
  }
  assert.equal(JSON.stringify(pool), snapshot);
});

test("v1.20.62 actual chooseMain retains a complete meal over a seasonal incomplete meal of the same family", () => {
  const complete = literalRecipe("matrix-d42-chicken-brown-rice-peppers");
  const incomplete = {
    id: "test-seasonal-chicken-no-starch", name: "Pollo e broccoli senza carboidrato", course: "Piatto unico", cuisine: "Italiano", time: 15, testKcal: 100,
    ingredients: [{ food: "Petto di pollo cotto", grams: 120 }, { food: "Broccoli bolliti", grams: 200 }],
    parts: [{ category: "Proteina", food: "Petto di pollo cotto", grams: 120 }, { category: "Contorno", food: "Broccoli bolliti", grams: 200 }],
  };
  const pool = [incomplete, complete];
  const runtime = makeChooserRuntime(pool, "Casa");
  assert.equal(runtime.recipeProteinFamily(incomplete), "carne-bianca");
  assert.equal(runtime.mainMealBalanceScore(incomplete), 2);
  assert.equal(runtime.recipeOutOfSeasonProduceCount(incomplete), 0);
  for (let offset = 0; offset < 35; offset += 1) {
    assert.equal(runtime.chooseMain(pool, "carne-bianca", 4, 100, offset, 0), complete);
  }
});

test("v1.20.62 actual chooseMain preserves protein-family requests, species bookkeeping and the weekly rotation", () => {
  const practical = literalRecipe("matrix-d42-chicken-brown-rice-peppers");
  const home = literalRecipe("matrix-p49-millet-chicken-pumpkin");
  const pool = [practical, home];
  const state = { usedRecipes: new Set(), usedProteinSignatures: new Set() };
  const runtime = makeChooserRuntime(pool, "Casa", "variety", state);
  const first = runtime.chooseMain(pool, "carne-bianca", 4, 500, 0, 0);
  const second = runtime.chooseMain(pool, "carne-bianca", 4, 500, 0, 1);
  assert.equal(first, home);
  assert.equal(second, practical);
  assert.equal(runtime.recipeProteinFamily(first), "carne-bianca");
  assert.equal(runtime.recipeProteinFamily(second), "carne-bianca");
  assert.deepEqual([...state.usedRecipes], [home.id, practical.id]);
  assert.deepEqual([...state.usedProteinSignatures], [runtime.recipeProteinSignature(home), runtime.recipeProteinSignature(practical)]);
  assert.deepEqual(Array.from(runtime.WEEKLY_MAIN_ROTATION), [
    "legumi", "pesce", "carne-bianca", "uova", "legumi", "pesce", "latticini",
    "carne-bianca", "salumi", "latticini", "legumi", "carne-rossa", "latticini", "pesce",
  ]);
  const repeatState = { usedRecipes: new Set(), usedProteinSignatures: new Set() };
  makeChooserRuntime(pool, "Casa", "repeat", repeatState).chooseMain(pool, "carne-bianca", 4, 500, 0, 0);
  assert.equal(repeatState.usedRecipes.size, 0);
  assert.equal(repeatState.usedProteinSignatures.size, 0);
});

test("v1.20.62 saved and manual out-of-season choices remain visible and unchanged", () => {
  const peach = candidates[0], apple = candidates[2];
  const recipeMap = { [peach.id]: peach, [apple.id]: apple };
  const saved = { "0-1": peach.id };
  const snapshot = JSON.stringify(saved);
  const { safeRecipeIds } = evaluate(["safeRecipeIds"], {
    recipeMap, safeRecord: (value) => value && typeof value === "object" ? value : {},
  });
  const restored = safeRecipeIds(saved);
  assert.equal(restored["0-1"], peach.id, "Hydration must not seasonally replace saved choices");
  const { getDayIds } = evaluate(["getDayIds"], {
    days: [{ recipes: [apple.id, apple.id, apple.id, apple.id, apple.id] }],
    choices: restored, recipeMap,
  });
  assert.equal(getDayIds(0)[1], peach.id, "Manual/saved selection stays visible in November");
  makeRuntime().closestForSlot(candidates, 1, 100, 4);
  assert.equal(restored["0-1"], peach.id);
  assert.equal(JSON.stringify(saved), snapshot);
  const getDaySource = declaration("getDayIds").initializer.getText(ast);
  assert.doesNotMatch(getDaySource, /preferAvailableSeason|seasonalChoicesForNewPlan|recipeOutOfSeasonProduceCount/);
  assert.ok(source.includes("setChoices(safeRecipeIds(s.choices))"));
  const recommendation = declaration("recommendedPartOptions").initializer.getText(ast);
  assert.match(recommendation, /seasonalFirst\(mealPartOptions\[part.category\]\)/);
  assert.doesNotMatch(recommendation, /preferAvailableSeason/);
});
