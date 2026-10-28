import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

const expectedMeals = [
  "mensa-pasta-pollo-zucchine",
  "mensa-riso-merluzzo-fagiolini",
  "mensa-patate-bistecca-carote",
  "mensa-pasta-lenticchie-spinaci",
];
const source = await readFile(new URL("../app/FoodPlanner.tsx", import.meta.url), "utf8");
const combinations = source.split("const mensaCombinations: Recipe[] = [")[1]
  ?.split("const catalogWorkMains")[0] || "";

test("v1.20.60 mensa combinations keep four distinct full-meal photographs", async () => {
  const ids = [...combinations.matchAll(/id: "(mensa-[^"]+)"/g)].map((match) => match[1]);
  assert.deepEqual(ids, expectedMeals);
  const images = [...combinations.matchAll(/image: photo\("(recipe-mensa-[^"]+)"\)/g)]
    .map((match) => match[1]);
  assert.equal(images.length, expectedMeals.length);
  assert.equal(new Set(images).size, expectedMeals.length);
  for (const image of images) {
    await access(new URL(`../public/food/${image}.png`, import.meta.url));
    await access(new URL(`../dist/food/${image}.png`, import.meta.url));
  }
  assert.equal((combinations.match(/kind: "combination"/g) || []).length, expectedMeals.length);
  assert.equal((combinations.match(/parts: \[/g) || []).length, expectedMeals.length);
});

test("v1.20.60 mensa nutrition ingredients derive from the editable components", () => {
  assert.match(combinations, /mensaCombinations\.forEach\(\(recipe\) => \{/);
  assert.match(combinations, /recipe\.ingredients = \(recipe\.parts \|\| \[\]\)\.map\(\(\{ food, grams \}\) => \(\{ food, grams \}\)\)/);
  assert.equal((combinations.match(/ingredients: \[\]/g) || []).length, expectedMeals.length);
  const rawCatalog = source.split("const rawRecipes: Recipe[] = [")[1]?.split("];", 1)[0] || "";
  assert.match(rawCatalog, /\.\.\.mensaCombinations/);
});

test("v1.20.60 practical mensa lunch choices gate the candidate pool before ranking", () => {
  const picker = source.split("const closestForSlot = (")[1]
    ?.split("const plannedFruitFoods")[0] || "";
  const practical = source.split("const mensaPracticalPool = (")[1]?.split("const mensaMainsFrom")[0] || "";
  assert.match(practical, /dayContext === "Mensa" && slot === 2/);
  assert.match(practical, /pool\.filter\(\(recipe\) => mensaFirstChoiceIds\.has\(recipe\.id\)\)/);
  assert.match(practical, /return practical\.length \? practical : pool/);
  assert.match(picker, /const practicalPool = mensaPracticalPool\(pool, slot\)/);
  assert.match(picker, /practicalPool\.filter\(\(recipe\) => mainMealBalanceScore\(recipe\) === 3\)/);
  assert.match(picker, /const coherentPool = completeMains\.length \? completeMains : practicalPool/);
  assert.ok(picker.indexOf("const practicalPool") < picker.indexOf("const ranked"));
  const chooser = source.split("const chooseMain = (")[1]?.split("profileDays.forEach")[0] || "";
  assert.ok(chooser.indexOf("const seasonAwareCandidates = mensaPracticalPool(") >= 0);
  assert.ok(chooser.indexOf("const seasonAwareCandidates = mensaPracticalPool(") < chooser.indexOf("const unusedSpecies"));
});

test("v1.20.60 mensa combinations are whitelisted in planner and matrix audit", async () => {
  const whitelist = source.split("const mensaRecipeIds = new Set([")[1]
    ?.split("]);", 1)[0] || "";
  const preferred = source.split("const mensaFirstChoiceIds = new Set([")[1]
    ?.split("]);", 1)[0] || "";
  assert.match(whitelist, /\.\.\.mensaCombinations\.map\(\(recipe\) => recipe\.id\)/);
  assert.match(preferred, /\.\.\.mensaCombinations\.map\(\(recipe\) => recipe\.id\)/);
  const audit = await readFile(new URL("../scripts/audit-cuisine-plan.mjs", import.meta.url), "utf8");
  for (const id of expectedMeals) {
    assert.ok(audit.includes(`"${id}"`), `Mensa audit missing ${id}`);
  }
});
